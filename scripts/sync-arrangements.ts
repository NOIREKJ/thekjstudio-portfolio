/*
  노션 트래커 → Supabase `arrangements` 단방향 동기화.

  노션이 원본이고 Supabase 는 사본이다. 사이트는 빌드 때 사본을 구워 쓴다.

  규칙 네 가지:
  1. **전 행을 먼저 검증하고 한 번에 쓴다.** 중간에 터져서 절반만 반영된
     상태를 만들지 않는다.
  2. **모르는 값이면 멈춘다.** 작업 상태 오타 하나로 곡이 조용히 사라지는
     것보다 동기화가 실패하는 편이 낫다 — 실패하면 이전 사이트가 그대로 산다.
  3. **노션에서 사라진 곡은 지우지 않고 archived 로 내린다.** 되돌릴 수 있는 쪽으로.
     SSD 스캔으로 들어온 행(source='ssd')은 애초에 노션에 없으므로 건드리지 않는다.
  4. **바뀐 페이지만 처리한다.** last_edited_time 이 synced_at 보다 새 것일 때만
     본문과 악보를 받는다. 15분 cron 이라 이게 없으면 매번 전 곡을 다시 받는다.

  실행:
    SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… NOTION_TOKEN=… \
    NOTION_ARRANGEMENTS_DATABASE_ID=… npx tsx scripts/sync-arrangements.ts
    옵션: --dry-run (쓰지 않고 보여만 줌) · --all (바뀌지 않은 페이지도 다시 처리)
*/
import {
  assignSlugs, blocksToMarkdown, parseBodyLabels, sheetObjectName, toStatus, toVisibility,
} from "./sync/transform";
import {
  isNotionHosted, listBlocks, propFiles, propNumber, propText, queryAllPages, sleep,
  THROTTLE_MS, type NotionPage,
} from "./sync/notion";

const SHEET_BUCKET = "sheets";

const DRY = process.argv.includes("--dry-run");
const ALL = process.argv.includes("--all");

type Env = { url: string; key: string; token: string; db: string; hook?: string };

function env(): Env {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = process.env.NOTION_TOKEN;
  const db = process.env.NOTION_ARRANGEMENTS_DATABASE_ID;
  const missing = [
    ["SUPABASE_URL", url], ["SUPABASE_SERVICE_ROLE_KEY", key],
    ["NOTION_TOKEN", token], ["NOTION_ARRANGEMENTS_DATABASE_ID", db],
  ].filter(([, v]) => !v).map(([n]) => n);
  if (missing.length) throw new Error(`환경변수가 없습니다: ${missing.join(", ")}`);
  return {
    url: url!, key: key!, token: token!, db: db!,
    // .env 의 이름을 그대로 쓴다(스펙에는 _URL 로 적혀 있지만 저장소는 이 이름이다)
    hook: process.env.VERCEL_DEPLOY_HOOK || undefined,
  };
}

/* ── Supabase (PostgREST / Storage) ──────────────────────────────────── */

async function rest(
  e: Env, path: string, init: { method: string; body?: unknown; prefer?: string } ,
): Promise<unknown> {
  const headers: Record<string, string> = {
    apikey: e.key, Authorization: `Bearer ${e.key}`, "Content-Type": "application/json",
  };
  if (init.prefer) headers.Prefer = init.prefer;
  const res = await fetch(`${e.url}/rest/v1/${path}`, {
    method: init.method, headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 402) {
      throw new Error(
        "Supabase 가 402 로 막혀 있습니다 — 조직의 무료 플랜 한도 초과입니다. " +
          "쿼터가 재충전되거나 플랜을 올리기 전에는 동기화가 쓸 수 없습니다. " +
          `원문: ${text}`,
      );
    }
    throw new Error(`Supabase ${init.method} ${path} 실패: ${res.status} ${text}`);
  }
  /*
    PostgREST 는 `Prefer: return=minimal` 일 때 **201 에 빈 본문**을 준다.
    204 만 걸러내면 그 빈 본문에서 res.json() 이
    "Unexpected end of JSON input" 으로 터진다.

    ⚠️ 이 터짐은 **쓰기가 이미 성공한 뒤**에 일어난다. 그래서 들어갈 건 다
       들어갔는데 스크립트는 실패로 끝나고, 뒤에 있는 archived 처리와 재배포
       훅 호출을 건너뛴다. 2026-11-25 에 실제로 당했다 — 로그는 "동기화하지
       못했습니다" 인데 DB 에는 4곡이 갱신돼 있었다.
  */
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/* ── 소유자 ───────────────────────────────────────────────────────────

  `arrangements.user_id` 는 NOT NULL DEFAULT `auth.uid()` 이고
  `household_id` 는 NOT NULL DEFAULT `my_default_household_id()` 다.

  이 스크립트는 **service_role 키**로 쓴다. 서비스 롤에는 `auth.uid()` 가
  없어서 두 기본값이 NULL 로 계산되고, 그대로 NOT NULL 위반(23502)이 난다.
  그래서 INSERT 든 upsert 든 **두 값을 직접 보내야 한다.**

  ⚠️ 2026-11-25 까지 이 동기화는 쓰기에 **한 번도 성공하지 못했다.** 최초
     적재만 사람이 값을 명시해서 넣었고(73행 전부 created_at 이 한 시각이다),
     그 뒤 스케줄 실행은 곡이 하나라도 바뀌면 전부 23502 로 죽었다. 노션을
     읽는 데까지는 성공해서 "노션 8행 · DB 8행" 까지 찍힌다 — 로그 앞부분만
     보면 멀쩡해 보인다. 그래서 오래 묻혀 있었다.

  값은 **표에서 읽어 온다.** 공개 저장소라 uuid 를 코드에 박지 않고, 새
  시크릿도 만들지 않는다. 표가 비어 있는 첫 적재에만 환경변수로 받는다.
*/
type Owner = { user_id: string; household_id: string };

async function resolveOwner(e: Env): Promise<Owner> {
  const rows = (await rest(
    e, "arrangements?select=user_id,household_id&limit=1", { method: "GET" },
  )) as { user_id?: string | null; household_id?: string | null }[];
  const seed = rows.find((r) => r.user_id && r.household_id);
  if (seed) return { user_id: seed.user_id!, household_id: seed.household_id! };

  const user = process.env.ARRANGEMENTS_USER_ID;
  const household = process.env.ARRANGEMENTS_HOUSEHOLD_ID;
  if (user && household) return { user_id: user, household_id: household };
  throw new Error(
    "소유자를 알 수 없습니다 — arrangements 가 비어 있습니다. " +
    "첫 적재라면 ARRANGEMENTS_USER_ID 와 ARRANGEMENTS_HOUSEHOLD_ID 를 넣어 주세요",
  );
}

type ExistingRow = {
  notion_page_id: string; slug: string; synced_at: string | null; sheet_url: string | null;
};

async function existingRows(e: Env): Promise<Map<string, ExistingRow>> {
  const rows = (await rest(
    e, "arrangements?select=notion_page_id,slug,synced_at,sheet_url&source=eq.notion",
    { method: "GET" },
  )) as ExistingRow[];
  return new Map(rows.map((r) => [r.notion_page_id, r]));
}

/** 악보 버킷이 없으면 만든다. 공개 버킷이라 악보 링크가 그대로 산다. */
async function ensureBucket(e: Env): Promise<void> {
  const res = await fetch(`${e.url}/storage/v1/bucket/${SHEET_BUCKET}`, {
    headers: { apikey: e.key, Authorization: `Bearer ${e.key}` },
  });
  if (res.ok) return;
  const made = await fetch(`${e.url}/storage/v1/bucket`, {
    method: "POST",
    headers: { apikey: e.key, Authorization: `Bearer ${e.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ id: SHEET_BUCKET, name: SHEET_BUCKET, public: true }),
  });
  if (!made.ok) throw new Error(`악보 버킷을 만들지 못했습니다: ${made.status} ${await made.text()}`);
  console.log(`  버킷 ${SHEET_BUCKET} 생성`);
}

/*
  노션 파일을 Supabase Storage 로 옮기고 공개 URL 을 돌려준다.

  노션이 주는 url 은 서명 URL 이라 1시간이면 죽는다. 그걸 DB 에 저장하면
  배포된 악보 버튼이 하루도 못 간다. 외부 링크(구글 드라이브 등)는 만료가
  없으므로 그대로 쓴다.
*/
async function uploadSheet(
  e: Env, slug: string, file: { name: string; url: string },
): Promise<string> {
  if (!isNotionHosted(file.url)) return file.url;

  const got = await fetch(file.url);
  if (!got.ok) throw new Error(`악보 내려받기 실패(${slug}): ${got.status}`);
  const bytes = Buffer.from(await got.arrayBuffer());
  const object = sheetObjectName(slug, file.name);

  const put = await fetch(`${e.url}/storage/v1/object/${SHEET_BUCKET}/${object}`, {
    method: "POST",
    headers: {
      apikey: e.key, Authorization: `Bearer ${e.key}`,
      "Content-Type": got.headers.get("content-type") ?? "application/octet-stream",
      "x-upsert": "true",
    },
    body: new Uint8Array(bytes),
  });
  if (!put.ok) throw new Error(`악보 올리기 실패(${slug}): ${put.status} ${await put.text()}`);
  return `${e.url}/storage/v1/object/public/${SHEET_BUCKET}/${object}`;
}

/* ── 한 페이지를 행으로 ──────────────────────────────────────────────── */

type Row = Record<string, unknown>;

function buildRow(
  page: NotionPage, slug: string, markdown: string, sheetUrl: string | null, owner: Owner,
): Row {
  const body = parseBodyLabels(markdown);
  // 속성이 있으면 속성이 이긴다. 없으면 본문 라벨에서 읽는다(스펙의 폴백 규칙).
  const pick = (prop: string | null, fromBody: string | null) => prop ?? fromBody;

  return {
    // NOT NULL 이고 기본값이 auth.uid() 라 서비스 롤로는 비어 버린다 — resolveOwner 참고.
    ...owner,
    notion_page_id: page.id.replace(/-/g, ""),
    notion_url: page.url,
    source: "notion",
    slug,
    title: propText(page, "곡명") ?? "(제목 없음)",
    original_artist: propText(page, "원곡 / 아티스트"),
    status: toStatus(propText(page, "작업 상태")),
    genre: propText(page, "장르·구분"),
    visibility: toVisibility(propText(page, "사이트 공개")),
    key_bpm: pick(propText(page, "Key / BPM"), body.keyBpm),
    arrangement_note: pick(propText(page, "편곡 메모"), body.arrangementNote),
    youtube_url: pick(propText(page, "유튜브"), body.youtubeUrl),
    purchase_url: propText(page, "Patreon / 판매 링크"),
    sheet_url: sheetUrl,
    gear_setup: body.gearSetup,
    songform: body.songform,
    behind_story: body.behindStory,
    body_markdown: markdown || null,
    sort_order: propNumber(page, "정렬") ?? 0,
    archived: false,
    synced_at: new Date().toISOString(),
  };
}

/* ── 본체 ────────────────────────────────────────────────────────────── */

async function main(): Promise<void> {
  const e = env();
  console.log(DRY ? "· dry-run — 쓰지 않습니다" : "· 동기화 시작");

  // 쓸 수 없는 상태면 노션을 긁기 전에 멈춘다.
  const owner = await resolveOwner(e);
  const existing = await existingRows(e);
  const pages = await queryAllPages(e.token, e.db);
  console.log(`  노션 ${pages.length}행 · DB ${existing.size}행`);

  // 슬러그는 기존 것을 그대로 둔다 — 공유된 링크가 죽으면 안 된다.
  const slugs = assignSlugs(
    pages.map((p) => ({
      pageId: p.id.replace(/-/g, ""),
      title: propText(p, "곡명") ?? "",
      existingSlug: existing.get(p.id.replace(/-/g, ""))?.slug ?? null,
    })),
  );

  const rows: Row[] = [];
  const problems: string[] = [];
  let skipped = 0;

  for (const page of pages) {
    const pid = page.id.replace(/-/g, "");
    const slug = slugs.get(pid)!;
    const prev = existing.get(pid);
    const edited = (page as unknown as { last_edited_time?: string }).last_edited_time;

    // 바뀐 페이지만. 안 바뀐 건 본문도 악보도 받지 않는다.
    if (!ALL && prev?.synced_at && edited && new Date(edited) <= new Date(prev.synced_at)) {
      skipped += 1;
      continue;
    }

    try {
      const blocks = await listBlocks(e.token, page.id);
      const markdown = blocksToMarkdown(blocks);

      let sheetUrl = prev?.sheet_url ?? null;
      const files = propFiles(page, "악보 (PDF/MIDI)");
      if (files.length === 0) {
        sheetUrl = null;
      } else if (!DRY) {
        await ensureBucket(e);
        sheetUrl = await uploadSheet(e, slug, files[0]);
      }

      rows.push(buildRow(page, slug, markdown, sheetUrl, owner));
    } catch (error) {
      problems.push(`${propText(page, "곡명") ?? page.id}: ${(error as Error).message}`);
    }
    await sleep(THROTTLE_MS);
  }

  // 전 행이 통과해야 쓴다. 하나라도 틀리면 손대지 않는다.
  if (problems.length) {
    throw new Error(`${problems.length}곡에서 막혔습니다 — 아무것도 쓰지 않았습니다:\n  ` +
      problems.join("\n  "));
  }

  const live = new Set(pages.map((p) => p.id.replace(/-/g, "")));
  const gone = [...existing.keys()].filter((id) => !live.has(id));

  console.log(`  바뀐 곡 ${rows.length} · 그대로 ${skipped} · 노션에서 사라짐 ${gone.length}`);
  if (DRY) {
    for (const r of rows) console.log(`    ${r.slug} · ${r.status} · ${r.visibility}`);
    for (const id of gone) console.log(`    archived 예정: ${id}`);
    return;
  }

  if (rows.length) {
    await rest(e, "arrangements?on_conflict=notion_page_id", {
      method: "POST", body: rows, prefer: "resolution=merge-duplicates,return=minimal",
    });
  }
  for (const id of gone) {
    // 지우지 않는다 — 되돌릴 수 있게 내려만 둔다.
    await rest(e, `arrangements?notion_page_id=eq.${encodeURIComponent(id)}&source=eq.notion`, {
      method: "PATCH", body: { archived: true }, prefer: "return=minimal",
    });
    console.log(`  archived: ${id}`);
  }

  if (e.hook && (rows.length || gone.length)) {
    const res = await fetch(e.hook, { method: "POST" });
    console.log(res.ok ? "  재배포 요청 보냄" : `  ⚠ 재배포 요청 실패: ${res.status}`);
  }
  console.log("✓ 동기화 완료");
}

main().catch((error) => {
  console.error(`✕ 동기화하지 못했습니다: ${(error as Error).message}`);
  process.exit(1);
});
