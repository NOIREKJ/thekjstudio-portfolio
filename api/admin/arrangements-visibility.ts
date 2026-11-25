/*
  편곡 공개 여부 일괄 변경 — /api/admin/arrangements-visibility

  /admin 의 편곡 목록에서 여러 건을 골라 공개·비공개로 바꾼다.
  `source = "ssd"` 행은 화면이 Supabase 에 직접 쓴다. 이 함수가 맡는 것은
  **`source = "notion"` 행** 이다 — 그쪽은 노션이 원본이라 노션을 고치지 않으면
  다음 동기화 때 되돌아간다.

  GET   인증·설정 확인만 한다.                → 200 { available: true }
  POST  { ids, visibility } → 노션과 DB 반영  → 200 { updatedIds: [...] }

  ⚠️ 자급자족 파일이어야 한다(로컬 상대 import 금지). `export default` 금지.
     이유는 api/selfcontained.test.ts.
*/

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

const env = (k: string): string | undefined => {
  const v = process.env[k];
  return v && v.trim() !== "" ? v.trim() : undefined;
};

const TIMEOUT_MS = 10_000;
const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";
/** 노션 쪽 공개 여부가 담긴 속성 이름. sync-arrangements.ts 가 읽는 것과 같아야 한다. */
const VISIBILITY_PROP = "사이트 공개";
/** 노션 rate limit(초당 3건)에 걸리지 않게 페이지 사이를 띄운다. */
const THROTTLE_MS = 350;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchT(url: string, init?: RequestInit): Promise<Response> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}

/** scripts/sync/transform.ts 와 같은 규칙. 옵션 이름 앞 그림문자를 걷어낸다. */
export function stripLeadingEmoji(raw: string): string {
  return raw.replace(/^[\p{Extended_Pictographic}‍️⃣\s]+/u, "").trim();
}

/** 화면이 보내는 값 ↔ 노션 옵션 이름. 노션은 "공개"/"비공개" 로 쓴다. */
const LABEL: Record<Visibility, string> = { public: "공개", private: "비공개" };

export type Visibility = "public" | "private";

/* ── 권한 ─────────────────────────────────────────────────────────────
   redeploy.ts 와 같은 규칙이다. 자급자족 규약 때문에 공유하지 않고 복제한다.
   한쪽을 고치면 다른 쪽도 같이 고칠 것. */

export type AdminCheck =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

export async function checkAdmin(req: Request): Promise<AdminCheck> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) return { ok: false, status: 401, error: "인증이 필요합니다" };

  const url = env("SUPABASE_URL") ?? env("VITE_SUPABASE_URL");
  const anon = env("SUPABASE_PUBLISHABLE_KEY") ?? env("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !anon) return { ok: false, status: 503, error: "서버 설정이 없습니다" };

  let userId: string;
  try {
    const res = await fetchT(`${url.replace(/\/+$/, "")}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { ok: false, status: 401, error: "인증이 필요합니다" };
    const body = (await res.json()) as { id?: unknown };
    if (typeof body.id !== "string" || !body.id) {
      return { ok: false, status: 401, error: "인증이 필요합니다" };
    }
    userId = body.id;
  } catch {
    return { ok: false, status: 503, error: "인증을 확인할 수 없습니다" };
  }

  const allow = (env("ADMIN_USER_IDS") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!allow.length) return { ok: false, status: 503, error: "서버 설정이 없습니다" };
  if (!allow.includes(userId)) return { ok: false, status: 403, error: "권한이 없습니다" };

  return { ok: true, userId };
}

function notionConfigured(): boolean {
  return Boolean(env("NOTION_TOKEN") && env("NOTION_ARRANGEMENTS_DATABASE_ID"));
}

function dbConfigured(): boolean {
  return Boolean(
    (env("SUPABASE_URL") ?? env("VITE_SUPABASE_URL")) && env("SUPABASE_SERVICE_ROLE_KEY"),
  );
}

/* ── 노션 속성 모양 알아내기 ──────────────────────────────────────────

  옵션 이름을 코드에 박지 않는다. 노션에서 "🟢 공개" 처럼 그림문자를 붙여
  두는데, 그게 바뀌면 조용히 틀린 값을 쓰게 된다. 그래서 스키마를 읽어
  **그림문자를 걷어낸 이름이 맞는 것** 을 고른다.
*/

type PropShape =
  | { kind: "select"; optionName: Record<Visibility, string | null> }
  | { kind: "status"; optionName: Record<Visibility, string | null> }
  | { kind: "rich_text" }
  | null;

export function readPropShape(dbSchema: unknown): PropShape {
  const props = (dbSchema as { properties?: Record<string, unknown> })?.properties;
  const prop = props?.[VISIBILITY_PROP] as { type?: string } | undefined;
  if (!prop?.type) return null;

  if (prop.type === "select" || prop.type === "status") {
    const container = (prop as Record<string, unknown>)[prop.type] as
      | { options?: { name?: string }[] }
      | undefined;
    const options = container?.options ?? [];
    const find = (want: string): string | null =>
      options.find((o) => stripLeadingEmoji(String(o.name ?? "")) === want)?.name ?? null;
    return {
      kind: prop.type,
      optionName: { public: find(LABEL.public), private: find(LABEL.private) },
    };
  }
  if (prop.type === "rich_text") return { kind: "rich_text" };
  return null;
}

function propertyPayload(shape: NonNullable<PropShape>, visibility: Visibility): unknown | null {
  if (shape.kind === "rich_text") {
    return { rich_text: [{ type: "text", text: { content: LABEL[visibility] } }] };
  }
  const name = shape.optionName[visibility];
  if (!name) return null; // 그 옵션이 노션에 없다 — 만들어 내지 않는다
  return shape.kind === "select" ? { select: { name } } : { status: { name } };
}

/* ── 핸들러 ───────────────────────────────────────────────────────── */

export async function GET(req: Request): Promise<Response> {
  const who = await checkAdmin(req);
  if (!who.ok) return json({ available: false, error: who.error }, who.status);
  if (!notionConfigured() || !dbConfigured()) {
    return json({ available: false, error: "노션 연결이 설정되지 않았습니다" }, 503);
  }
  return json({ available: true }, 200);
}

export async function POST(req: Request): Promise<Response> {
  const who = await checkAdmin(req);
  if (!who.ok) return json({ updatedIds: [], error: who.error }, who.status);

  const notionToken = env("NOTION_TOKEN");
  const notionDb = env("NOTION_ARRANGEMENTS_DATABASE_ID");
  const dbUrl = (env("SUPABASE_URL") ?? env("VITE_SUPABASE_URL"))?.replace(/\/+$/, "");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!notionToken || !notionDb || !dbUrl || !serviceKey) {
    return json({ updatedIds: [], error: "노션 연결이 설정되지 않았습니다" }, 503);
  }

  let ids: string[];
  let visibility: Visibility;
  try {
    const body = (await req.json()) as { ids?: unknown; visibility?: unknown };
    if (!Array.isArray(body.ids)) throw new Error("ids");
    ids = body.ids.filter((v): v is string => typeof v === "string" && v.trim() !== "");
    if (body.visibility !== "public" && body.visibility !== "private") throw new Error("visibility");
    visibility = body.visibility;
  } catch {
    return json({ updatedIds: [], error: "요청 본문이 올바르지 않습니다" }, 400);
  }
  if (!ids.length) return json({ updatedIds: [] }, 200);

  const sbHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  /*
    화면이 보낸 id 를 그대로 믿지 않는다. 노션이 원본인 행만, 그리고 보관되지
    않은 행만 건드린다. 화면이 이미 걸러 보내지만 서버에서도 확인한다.
  */
  type Row = { id: string; notion_page_id: string | null };
  let rows: Row[];
  try {
    const q = new URLSearchParams({
      select: "id,notion_page_id",
      source: "eq.notion",
      archived: "is.false",
      id: `in.(${ids.map((i) => `"${i.replace(/"/g, "")}"`).join(",")})`,
    });
    const res = await fetchT(`${dbUrl}/rest/v1/arrangements?${q}`, { headers: sbHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    rows = (await res.json()) as Row[];
  } catch {
    return json({ updatedIds: [], error: "대상을 찾지 못했습니다" }, 502);
  }

  const targets = rows.filter((r) => r.notion_page_id);
  if (!targets.length) return json({ updatedIds: [] }, 200);

  // 노션 속성 모양을 한 번만 읽는다.
  let shape: PropShape;
  try {
    const res = await fetchT(`${NOTION_API}/databases/${notionDb}`, {
      headers: { Authorization: `Bearer ${notionToken}`, "Notion-Version": NOTION_VERSION },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    shape = readPropShape(await res.json());
  } catch {
    return json({ updatedIds: [], error: "노션 설정을 읽지 못했습니다" }, 502);
  }
  if (!shape) {
    return json({ updatedIds: [], error: `노션에 '${VISIBILITY_PROP}' 속성이 없습니다` }, 502);
  }
  const payload = propertyPayload(shape, visibility);
  if (!payload) {
    return json(
      { updatedIds: [], error: `노션에 '${LABEL[visibility]}' 옵션이 없습니다` },
      502,
    );
  }

  const updatedIds: string[] = [];
  for (const [i, row] of targets.entries()) {
    if (i > 0) await sleep(THROTTLE_MS);
    try {
      const res = await fetchT(`${NOTION_API}/pages/${row.notion_page_id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ properties: { [VISIBILITY_PROP]: payload } }),
      });
      if (!res.ok) continue;
    } catch {
      continue;
    }

    /*
      노션이 원본이지만 DB 도 같이 고친다. 안 고치면 다음 동기화(15분 cron)
      전까지 사이트와 목록이 옛 값을 보여 준다. 노션이 성공한 것만 고친다 —
      둘이 어긋나느니 한쪽만 맞는 편이 낫다.
    */
    try {
      await fetchT(
        `${dbUrl}/rest/v1/arrangements?id=eq.${encodeURIComponent(row.id)}&source=eq.notion`,
        {
          method: "PATCH",
          headers: { ...sbHeaders, Prefer: "return=minimal" },
          body: JSON.stringify({ visibility }),
        },
      );
    } catch {
      // DB 반영이 늦어도 노션은 바뀌었다. 다음 동기화가 맞춰 준다.
    }
    updatedIds.push(row.id);
  }

  // 곡명·본문은 남기지 않는다. 몇 건이 어디까지 갔는지만 남긴다.
  console.log(
    "admin.arrangements-visibility",
    `to=${visibility}`,
    `asked=${ids.length}`,
    `eligible=${targets.length}`,
    `ok=${updatedIds.length}`,
  );
  return json({ updatedIds }, 200);
}
