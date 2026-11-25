/*
  관리자 재배포 — /api/admin/redeploy

  /admin 에서 콘텐츠를 여러 건 저장한 뒤 '사이트 재배포' 를 한 번 눌러 운영
  브랜치를 다시 빌드시킨다. 화면은 Codex, 이 함수와 권한 검증은 Claude 담당.

  GET   인증·설정 확인만 한다. **Vercel 요청을 보내지 않는다.** → 200 { available: true }
  POST  Deploy Hook 을 호출한다.                                  → 202 { status: "queued" }

  ⚠️ 이 파일은 **자급자족** 이어야 한다. api/ 핸들러는 로컬 상대 import 를 쓰지
     않는다 — 배포 시 번들되지 않아 런타임에 ERR_MODULE_NOT_FOUND 로 죽는다.
     자세한 것은 api/selfcontained.test.ts.

  ⚠️ `export default` 금지. Vercel 이 Node 스타일로 보고 return 한 Response 를
     버려서 요청이 매달린다.
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

async function fetchT(url: string, init?: RequestInit): Promise<Response> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}

/* ── 권한 ─────────────────────────────────────────────────────────────

  토큰만으로는 부족하다. 사이트에 로그인한 **아무 계정**이나 운영 배포를
  돌릴 수 있으면 안 된다. 그래서 두 단계로 본다.

    1. Supabase 에 토큰을 물어 누구인지 확인한다(위조 불가).
    2. 그 user id 가 서버 설정의 허용 목록에 있는지 본다.

  허용 목록이 비어 있으면 **아무도 통과하지 못한다.** 설정을 깜빡했을 때
  열리는 쪽보다 닫히는 쪽이 낫다.
*/

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

/* ── 중복 방지 ────────────────────────────────────────────────────────

  같은 버튼을 두 번 누르거나 탭을 두 개 열어 두면 빌드가 두 번 돈다.
  화면에도 막는 장치가 있지만 서버에서도 한 번 거른다.

  ⚠️ 이것은 **이 인스턴스 안에서만** 유효하다. 서버리스라 요청이 다른
     인스턴스로 가면 이 값이 비어 있다. 빠른 연타와 같은 탭 묶음은 거의
     같은 인스턴스로 떨어지므로 실제로 걸리는 경우는 대부분 잡지만,
     보장은 아니다. 확실히 막으려면 공용 저장소에 잠금을 둬야 한다.
*/
const COOLDOWN_MS = 60_000;
let lastQueuedAt = 0;

export function cooldownLeftMs(now = Date.now()): number {
  return Math.max(0, lastQueuedAt + COOLDOWN_MS - now);
}

/** 테스트에서 상태를 되돌린다. */
export function resetCooldown(): void {
  lastQueuedAt = 0;
}

/* ── 핸들러 ───────────────────────────────────────────────────────── */

export async function GET(req: Request): Promise<Response> {
  const who = await checkAdmin(req);
  if (!who.ok) return json({ available: false, error: who.error }, who.status);

  // 여기서 Vercel 을 부르지 않는다. 설정이 있는지만 본다.
  if (!env("VERCEL_DEPLOY_HOOK")) {
    return json({ available: false, error: "배포 훅이 설정되지 않았습니다" }, 503);
  }
  return json({ available: true }, 200);
}

export async function POST(req: Request): Promise<Response> {
  const who = await checkAdmin(req);
  if (!who.ok) return json({ status: "rejected", error: who.error }, who.status);

  const hook = env("VERCEL_DEPLOY_HOOK");
  if (!hook) return json({ status: "rejected", error: "배포 훅이 설정되지 않았습니다" }, 503);

  const left = cooldownLeftMs();
  if (left > 0) {
    return json(
      { status: "rejected", error: "이미 배포 요청이 접수됐습니다", retryAfterMs: left },
      429,
    );
  }
  // 훅을 부르기 전에 찍는다. 호출이 늦어지는 사이 두 번째 요청이 들어오면
  // 그것도 막아야 한다.
  lastQueuedAt = Date.now();

  let accepted = false;
  try {
    const res = await fetchT(hook, { method: "POST" });
    accepted = res.ok;
  } catch {
    accepted = false;
  }

  if (!accepted) {
    // 접수되지 않았으면 쿨다운을 풀어 준다. 실패해 놓고 1분을 묶으면
    // 사용자가 다시 시도할 길이 없다.
    lastQueuedAt = 0;
    // 훅 URL 도 Vercel 원본 응답도 밖으로 내보내지 않는다.
    console.log("admin.redeploy", "hook=fail");
    return json({ status: "rejected", error: "배포를 요청하지 못했습니다" }, 502);
  }

  console.log("admin.redeploy", "hook=ok");
  return json({ status: "queued" }, 202);
}
