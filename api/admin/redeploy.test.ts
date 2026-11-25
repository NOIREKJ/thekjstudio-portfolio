import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { GET, POST, resetCooldown } from "./redeploy";

/*
  요청서의 검증 기준을 그대로 옮긴다.

  - 비로그인·권한 없는 사용자에게 **배포가 일어나지 않는다.**
  - 권한 확인 GET 에서 **배포가 일어나지 않는다.**
  - 모의 훅으로 허용된 POST 한 번과 중복 방지를 확인한다.

  '배포가 일어나지 않는다' 를 상태 코드로만 보지 않는다. 훅이 **불렸는지**로
  본다. 403 을 주면서 훅을 부르는 구현도 테스트를 통과해 버리면 의미가 없다.
*/

const HOOK = "https://api.vercel.com/v1/integrations/deploy/prj_test/hook";
const ADMIN = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

let hookCalls = 0;

/** Supabase 사용자 조회와 Deploy Hook 만 답하는 가짜 네트워크. */
function stubFetch(user: { id: string } | null) {
  hookCalls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string | URL) => {
    const href = String(url);
    if (href.includes("/auth/v1/user")) {
      return user
        ? new Response(JSON.stringify(user), { status: 200 })
        : new Response("{}", { status: 401 });
    }
    if (href === HOOK) {
      hookCalls += 1;
      return new Response(JSON.stringify({ job: { id: "x" } }), { status: 201 });
    }
    throw new Error(`예상하지 못한 호출: ${href}`);
  }));
}

const req = (method: string, token?: string) =>
  new Request("https://www.thekjstudio.com/api/admin/redeploy", {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

beforeEach(() => {
  resetCooldown();
  process.env.SUPABASE_URL = "https://db.example.supabase.co";
  process.env.SUPABASE_PUBLISHABLE_KEY = "pk_test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "sr_test";
  process.env.ADMIN_USER_IDS = ADMIN;
  process.env.VERCEL_DEPLOY_HOOK = HOOK;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("토큰이 없으면 401 이고 훅을 부르지 않는다", async () => {
  stubFetch(null);
  const res = await POST(req("POST"));
  expect(res.status).toBe(401);
  expect(hookCalls).toBe(0);
});

test("로그인했어도 허용 목록에 없으면 403 이고 훅을 부르지 않는다", async () => {
  stubFetch({ id: OTHER });
  const res = await POST(req("POST", "tok"));
  expect(res.status).toBe(403);
  expect(hookCalls).toBe(0);
});

test("허용 목록이 비어 있으면 아무도 통과하지 못한다", async () => {
  process.env.ADMIN_USER_IDS = "";
  stubFetch({ id: ADMIN });
  const res = await POST(req("POST", "tok"));
  expect(res.status).toBe(503);
  expect(hookCalls).toBe(0);
});

test("GET 은 권한만 확인하고 훅을 부르지 않는다", async () => {
  stubFetch({ id: ADMIN });
  const res = await GET(req("GET", "tok"));
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ available: true });
  expect(hookCalls).toBe(0);
});

test("훅이 설정되지 않았으면 GET 이 available:false 를 준다", async () => {
  delete process.env.VERCEL_DEPLOY_HOOK;
  stubFetch({ id: ADMIN });
  const res = await GET(req("GET", "tok"));
  expect(res.status).toBe(503);
  expect((await res.json()).available).toBe(false);
});

test("허용된 POST 는 202 queued 이고 훅을 한 번 부른다", async () => {
  stubFetch({ id: ADMIN });
  const res = await POST(req("POST", "tok"));
  expect(res.status).toBe(202);
  expect(await res.json()).toEqual({ status: "queued" });
  expect(hookCalls).toBe(1);
});

test("연달아 누르면 두 번째는 429 이고 훅은 한 번만 불린다", async () => {
  stubFetch({ id: ADMIN });
  const first = await POST(req("POST", "tok"));
  const second = await POST(req("POST", "tok"));
  expect(first.status).toBe(202);
  expect(second.status).toBe(429);
  expect(hookCalls).toBe(1);
});

test("훅 호출이 실패하면 쿨다운을 풀어 다시 시도할 수 있게 한다", async () => {
  hookCalls = 0;
  let fail = true;
  vi.stubGlobal("fetch", vi.fn(async (url: string | URL) => {
    const href = String(url);
    if (href.includes("/auth/v1/user")) {
      return new Response(JSON.stringify({ id: ADMIN }), { status: 200 });
    }
    hookCalls += 1;
    if (fail) return new Response("nope", { status: 500 });
    return new Response("{}", { status: 201 });
  }));

  const failed = await POST(req("POST", "tok"));
  expect(failed.status).toBe(502);

  fail = false;
  const retried = await POST(req("POST", "tok"));
  expect(retried.status).toBe(202);
  expect(hookCalls).toBe(2);
});

test("오류 응답에 훅 URL 이나 Vercel 원본 응답이 섞이지 않는다", async () => {
  stubFetch({ id: OTHER });
  const body = await (await POST(req("POST", "tok"))).text();
  expect(body).not.toContain(HOOK);
  expect(body).not.toContain("prj_test");
  expect(body).not.toContain("tok");
});
