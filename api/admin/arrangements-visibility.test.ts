import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { GET, POST, readPropShape, stripLeadingEmoji } from "./arrangements-visibility";

/*
  이 파일이 생긴 이유: 첫 구현이 **노션만 성공해도 성공으로 셌다.** 그러면 DB
  반영이 실패해도 화면은 '저장했습니다' 를 띄우고 새 값으로 바뀐다. 사이트는
  옛 값인데 아무도 모르고 다시 누를 수도 없다. Codex 가 PR 검토에서 잡았고,
  그 재현(노션 200 + Supabase 503)을 아래 첫 테스트로 박아 둔다.
*/

const ADMIN = "11111111-1111-4111-8111-111111111111";
const ROW_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ROW_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const PAGE_A = "pageaaa";
const PAGE_B = "pagebbb";

type Opts = {
  user?: { id: string } | null;
  rows?: { id: string; notion_page_id: string | null }[];
  notionPatchOk?: boolean;
  dbPatchStatus?: number;
  /** PATCH 가 돌려줄 행. 기본은 요청한 id 를 그대로 돌려준다. */
  dbPatchReturns?: (id: string) => unknown[];
};

let notionPatches: string[] = [];
let dbPatches: string[] = [];

function stub(o: Opts = {}) {
  const {
    user = { id: ADMIN },
    rows = [{ id: ROW_A, notion_page_id: PAGE_A }],
    notionPatchOk = true,
    dbPatchStatus = 200,
    dbPatchReturns,
  } = o;
  notionPatches = [];
  dbPatches = [];

  vi.stubGlobal("fetch", vi.fn(async (url: string | URL, init?: RequestInit) => {
    const href = String(url);
    const method = init?.method ?? "GET";

    if (href.includes("/auth/v1/user")) {
      return user
        ? new Response(JSON.stringify(user), { status: 200 })
        : new Response("{}", { status: 401 });
    }
    if (href.includes("/rest/v1/arrangements") && method === "GET") {
      return new Response(JSON.stringify(rows), { status: 200 });
    }
    if (href.includes("/rest/v1/arrangements") && method === "PATCH") {
      const id = /id=eq\.([0-9a-f-]+)/i.exec(href)?.[1] ?? "";
      dbPatches.push(id);
      const body = dbPatchReturns ? dbPatchReturns(id) : [{ id }];
      return new Response(JSON.stringify(body), { status: dbPatchStatus });
    }
    if (href.includes("/v1/databases/")) {
      return new Response(
        JSON.stringify({
          properties: {
            "사이트 공개": {
              type: "select",
              select: { options: [{ name: "🟢 공개" }, { name: "🔴 비공개" }] },
            },
          },
        }),
        { status: 200 },
      );
    }
    if (href.includes("/v1/pages/")) {
      notionPatches.push(href.split("/v1/pages/")[1]);
      return new Response("{}", { status: notionPatchOk ? 200 : 403 });
    }
    throw new Error(`예상하지 못한 호출: ${method} ${href}`);
  }));
}

const post = (body: unknown, token = "tok") =>
  POST(new Request("https://www.thekjstudio.com/api/admin/arrangements-visibility", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }));

beforeEach(() => {
  process.env.SUPABASE_URL = "https://db.example.supabase.co";
  process.env.SUPABASE_PUBLISHABLE_KEY = "pk_test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "sr_test";
  process.env.ADMIN_USER_IDS = ADMIN;
  process.env.NOTION_TOKEN = "ntn_test";
  process.env.NOTION_ARRANGEMENTS_DATABASE_ID = "db_test";
});

afterEach(() => vi.unstubAllGlobals());

/* ── Codex 가 잡은 버그 ───────────────────────────────────────────── */

test("노션은 됐지만 DB 가 503 이면 성공으로 세지 않는다", async () => {
  stub({ dbPatchStatus: 503, dbPatchReturns: () => ({ message: "nope" }) as never });
  const res = await post({ ids: [ROW_A], visibility: "public" });
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ updatedIds: [] });
  expect(notionPatches).toEqual([PAGE_A]); // 노션은 바뀌었다
});

test("DB 가 200 이어도 바뀐 행이 없으면 성공이 아니다", async () => {
  stub({ dbPatchReturns: () => [] });
  expect(await (await post({ ids: [ROW_A], visibility: "public" })).json())
    .toEqual({ updatedIds: [] });
});

test("노션이 거절하면 DB 를 건드리지 않는다", async () => {
  stub({ notionPatchOk: false });
  expect(await (await post({ ids: [ROW_A], visibility: "public" })).json())
    .toEqual({ updatedIds: [] });
  expect(dbPatches).toEqual([]);
});

test("일부만 실패하면 성공한 것만 돌려준다", async () => {
  stub({
    rows: [{ id: ROW_A, notion_page_id: PAGE_A }, { id: ROW_B, notion_page_id: PAGE_B }],
    dbPatchReturns: (id) => (id === ROW_A ? [{ id }] : []),
  });
  expect(await (await post({ ids: [ROW_A, ROW_B], visibility: "private" })).json())
    .toEqual({ updatedIds: [ROW_A] });
});

test("둘 다 되면 둘 다 성공이다", async () => {
  stub({ rows: [{ id: ROW_A, notion_page_id: PAGE_A }, { id: ROW_B, notion_page_id: PAGE_B }] });
  expect(await (await post({ ids: [ROW_A, ROW_B], visibility: "public" })).json())
    .toEqual({ updatedIds: [ROW_A, ROW_B] });
});

/* ── 입력 ─────────────────────────────────────────────────────────── */

test("uuid 가 아닌 id 는 걸러낸다", async () => {
  stub({ rows: [] });
  const res = await post({ ids: ["not-a-uuid", "'); drop--"], visibility: "public" });
  expect(await res.json()).toEqual({ updatedIds: [] });
});

test("배치 상한을 넘기면 413 으로 거절한다", async () => {
  stub({ rows: [] });
  const many = Array.from({ length: 51 }, (_, i) =>
    `aaaaaaaa-aaaa-4aaa-8aaa-${String(i).padStart(12, "0")}`);
  expect((await post({ ids: many, visibility: "public" })).status).toBe(413);
});

test("visibility 가 빠지면 400", async () => {
  stub();
  expect((await post({ ids: [ROW_A] })).status).toBe(400);
});

/* ── 권한 ─────────────────────────────────────────────────────────── */

test("권한이 없으면 403 이고 노션을 건드리지 않는다", async () => {
  stub({ user: { id: "22222222-2222-4222-8222-222222222222" } });
  expect((await post({ ids: [ROW_A], visibility: "public" })).status).toBe(403);
  expect(notionPatches).toEqual([]);
});

test("GET 은 권한·설정만 확인한다", async () => {
  stub();
  const res = await GET(new Request("https://x/api/admin/arrangements-visibility", {
    headers: { Authorization: "Bearer tok" },
  }));
  expect(await res.json()).toEqual({ available: true });
  expect(notionPatches).toEqual([]);
  expect(dbPatches).toEqual([]);
});

/* ── 노션 옵션 이름 ───────────────────────────────────────────────── */

test("그림문자가 붙은 옵션 이름을 찾아낸다", () => {
  const shape = readPropShape({
    properties: {
      "사이트 공개": { type: "select", select: { options: [{ name: "🟢 공개" }, { name: "🔴 비공개" }] } },
    },
  });
  expect(shape).toEqual({ kind: "select", optionName: { public: "🟢 공개", private: "🔴 비공개" } });
});

test("속성이 없으면 null 이다", () => {
  expect(readPropShape({ properties: {} })).toBeNull();
});

test("stripLeadingEmoji 는 앞쪽 그림문자만 걷어낸다", () => {
  expect(stripLeadingEmoji("🟢 공개")).toBe("공개");
  expect(stripLeadingEmoji("공개")).toBe("공개");
});
