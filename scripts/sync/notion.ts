/*
  노션 REST 를 직접 부른다. @notionhq/client 를 넣지 않는 이유는 content/fetch.ts
  와 같다 — 동기화 스크립트 하나 때문에 저장소에 런타임 의존성을 늘리지 않는다.

  API 버전은 2022-06-28 로 고정한다. 노션은 버전을 헤더로 받고 올리지 않으면
  모양이 바뀌지 않으므로, 어느 날 응답이 달라져 조용히 깨지는 일이 없다.
*/
const API = "https://api.notion.com/v1";
const VERSION = "2022-06-28";

/* 노션 rate limit 은 평균 3req/s 다. 호출 사이에 이만큼 쉰다. */
export const THROTTLE_MS = 350;

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type NotionPage = {
  id: string;
  url: string;
  properties: Record<string, unknown>;
};

export type NotionFile = { name: string; url: string };

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": VERSION,
    "Content-Type": "application/json",
  };
}

async function call(
  token: string,
  path: string,
  init: { method: string; body?: unknown },
): Promise<Record<string, unknown>> {
  const res = await fetch(`${API}${path}`, {
    method: init.method,
    headers: headers(token),
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!res.ok) {
    throw new Error(`노션 ${init.method} ${path} 실패: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

/** 데이터베이스의 모든 행. 커서를 끝까지 따라간다. */
export async function queryAllPages(token: string, databaseId: string): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let cursor: string | undefined;
  do {
    const body: Record<string, unknown> = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const json = await call(token, `/databases/${databaseId}/query`, { method: "POST", body });
    pages.push(...((json.results as NotionPage[]) ?? []));
    cursor = json.has_more ? (json.next_cursor as string) : undefined;
    if (cursor) await sleep(THROTTLE_MS);
  } while (cursor);
  return pages;
}

type Block = { id: string; type: string; has_children?: boolean; children?: Block[] };

/**
 * 페이지 본문 블록. has_children 이면 한 단계 더 들어간다 — 세 단계까지.
 * 그 아래로 내려가면 호출 수가 급히 늘고, 편곡 노트가 그보다 깊을 일은 없다.
 */
export async function listBlocks(
  token: string,
  blockId: string,
  depth = 0,
): Promise<Block[]> {
  if (depth > 2) return [];
  const out: Block[] = [];
  let cursor: string | undefined;
  do {
    const q = new URLSearchParams({ page_size: "100" });
    if (cursor) q.set("start_cursor", cursor);
    const json = await call(token, `/blocks/${blockId}/children?${q}`, { method: "GET" });
    const results = (json.results as Block[]) ?? [];
    for (const b of results) {
      if (b.has_children) {
        await sleep(THROTTLE_MS);
        b.children = await listBlocks(token, b.id, depth + 1);
      }
      out.push(b);
    }
    cursor = json.has_more ? (json.next_cursor as string) : undefined;
    if (cursor) await sleep(THROTTLE_MS);
  } while (cursor);
  return out;
}

/* ── 속성 읽기 ───────────────────────────────────────────────────────── */

type Prop = Record<string, unknown>;

export function propText(page: NotionPage, name: string): string | null {
  const p = page.properties[name] as Prop | undefined;
  if (!p) return null;
  const kind = p.type as string;
  if (kind === "title" || kind === "rich_text") {
    const arr = (p[kind] as { plain_text?: string }[]) ?? [];
    const v = arr.map((t) => t.plain_text ?? "").join("").trim();
    return v || null;
  }
  if (kind === "select") {
    const sel = p.select as { name?: string } | null;
    return sel?.name ?? null;
  }
  if (kind === "status") {
    const sel = p.status as { name?: string } | null;
    return sel?.name ?? null;
  }
  if (kind === "url") {
    const v = (p.url as string | null) ?? null;
    return v && v.trim() ? v.trim() : null;
  }
  if (kind === "number") {
    const v = p.number as number | null;
    return v == null ? null : String(v);
  }
  return null;
}

export function propNumber(page: NotionPage, name: string): number | null {
  const p = page.properties[name] as Prop | undefined;
  if (!p || p.type !== "number") return null;
  return (p.number as number | null) ?? null;
}

/*
  파일 속성. ⚠️ 여기서 돌려주는 url 은 **서명 URL 이라 1시간 뒤 죽는다.**
  절대 DB 나 구운 JSON 에 그대로 저장하면 안 된다 — 배포된 악보 버튼이
  하루도 못 간다. 받은 즉시 내려받아 Supabase Storage 로 옮기고, 거기서 나온
  공개 URL 을 저장한다(sync-arrangements.ts 의 uploadSheet 참고).
*/
export function propFiles(page: NotionPage, name: string): NotionFile[] {
  const p = page.properties[name] as Prop | undefined;
  if (!p || p.type !== "files") return [];
  const files = (p.files as Record<string, unknown>[]) ?? [];
  return files.flatMap((f) => {
    const nm = (f.name as string) ?? "sheet";
    const hosted = f.file as { url?: string } | undefined;
    const external = f.external as { url?: string } | undefined;
    const url = hosted?.url ?? external?.url;
    return url ? [{ name: nm, url }] : [];
  });
}

/** 노션이 호스팅하는 파일인가(= 서명 URL 이라 복사해야 하는가). */
export function isNotionHosted(url: string): boolean {
  return /(^https:\/\/[^/]*\.notion[-.]static\.com\/)|(amazonaws\.com\/secure\.notion-static\.com)|(\bX-Amz-Signature=)/.test(
    url,
  );
}
