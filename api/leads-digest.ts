

/*
  ── 아래 블록은 원래 별도 파일이었다 ──────────────────────
  Vercel 이 함수를 번들할 때 **import 한 파일을 함께 넣어 주지 않는다.**
  엔트리포인트만 트랜스파일되어 배포되고, 런타임에 ERR_MODULE_NOT_FOUND
  로 죽는다. src/lib → api/_lib 로 옮겨도 같았다(둘 다 실측).
  그래서 핸들러를 자립형으로 둔다. 테스트는 이 파일에서 직접 import 한다.
*/
/*
  일일 리드 점검의 순수 로직 — 무엇이 늦었는지, 무엇을 지울 때가 됐는지.

  네트워크·비밀은 `api/leads-digest.ts` 가 들고 있다.
*/
/*
  ⚠️ 보유 기간은 화면(src/lib/privacy.ts)과 이 작업이 **같은 값**을 봐야 한다.
  원래 한 파일에서 import 했는데, Vercel 이 함수를 번들할 때 api/ 바깥 파일을
  넣어 주지 않아 배포된 함수가 ERR_MODULE_NOT_FOUND 로 죽었다. 그래서 여기에
  따로 두되, 두 값이 어긋나면 테스트(src/routes/Privacy.test.tsx)가 잡는다.
*/
export const RETENTION_DAYS = 365;

const retentionLabel = (days = RETENTION_DAYS): string =>
  days % 365 === 0 ? `${days / 365}년` : days % 30 === 0 ? `${days / 30}개월` : `${days}일`;

/** 이만큼 답이 없으면 늦은 것으로 본다. 영업에서 실제로 돈을 잃는 지점이다. */
export const OVERDUE_DAYS = 3;

/*
  한 번에 이보다 많이 지우게 되면 **지우지 않고 알리기만 한다.**
  삭제는 되돌릴 수 없다. 숫자가 갑자기 커졌다면 기준이 잘못됐을 가능성이 더 크다.
*/
export const DELETE_CAP = 200;

export type Lead = {
  id: string;
  created_at: string;
  product: string;
  name: string | null;
  contact: string;
  stage: string;
};

const DAY = 86_400_000;
export const daysAgo = (now: Date, days: number): Date => new Date(now.getTime() - days * DAY);
const ageDays = (now: Date, iso: string): number =>
  Math.floor((now.getTime() - new Date(iso).getTime()) / DAY);

const LABEL: Record<string, string> = { koinon: "KOINON", music: "음악·편곡", other: "기타" };

/** 늦은 순서대로 — 가장 오래 방치된 것이 맨 위에 와야 한다. */
export function sortOverdue(rows: Lead[]): Lead[] {
  return [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function overdueMessage(rows: Lead[], now: Date): string | null {
  if (rows.length === 0) return null;
  const lines = sortOverdue(rows).slice(0, 15).map((r) => {
    const who = r.name ?? r.contact;
    return `· ${ageDays(now, r.created_at)}일 — ${LABEL[r.product] ?? r.product} · ${who}`;
  });
  const more = rows.length > 15 ? [`… 외 ${rows.length - 15}건`] : [];
  return [
    `⏳ 답을 안 한 문의 ${rows.length}건 (${OVERDUE_DAYS}일 넘음)`,
    ...lines,
    ...more,
  ].join("\n");
}

export type StageCount = { stage: string; n: number };

const STAGE_LABEL: Record<string, string> = {
  new: "미응답", contacted: "연락함", talking: "협의 중", won: "성사", lost: "종료",
};
const STAGE_ORDER = ["new", "contacted", "talking", "won", "lost"];

export function weeklyMessage(counts: StageCount[]): string | null {
  const total = counts.reduce((s, c) => s + c.n, 0);
  if (total === 0) return null;
  const by = new Map(counts.map((c) => [c.stage, c.n]));
  const parts = STAGE_ORDER.filter((s) => by.get(s)).map((s) => `${STAGE_LABEL[s]} ${by.get(s)}`);
  return `📊 리드 ${total}건 — ${parts.join(" · ")}`;
}

export type DeletePlan =
  | { act: "none" }
  | { act: "delete"; cutoff: string; n: number }
  | { act: "hold"; cutoff: string; n: number; why: string };

/*
  파기 대상은 **종료된(won·lost) 문의 중 처리 완료일로부터 보유 기간이 지난 것**이다.
  단계와 처리 완료일 두 가지를 모두 보는 이유는, 한쪽만 보면 버그 하나로 살아 있는
  리드가 지워질 수 있기 때문이다.
*/
export function planDeletion(n: number, now: Date): DeletePlan {
  const cutoff = daysAgo(now, RETENTION_DAYS).toISOString();
  if (n === 0) return { act: "none" };
  if (n > DELETE_CAP) {
    return {
      act: "hold", cutoff, n,
      why: `한 번에 ${n}건은 너무 많습니다(상한 ${DELETE_CAP}). 기준이 잘못됐을 수 있어 지우지 않았습니다.`,
    };
  }
  return { act: "delete", cutoff, n };
}

export function deletionMessage(plan: DeletePlan): string | null {
  if (plan.act === "none") return null;
  if (plan.act === "hold") return `⚠️ 파기 보류 ${plan.n}건 — ${plan.why}`;
  return `🗑 보유 기간(${retentionLabel()})이 지난 문의 ${plan.n}건을 파기했습니다.`;
}

/** 할 말이 없으면 보내지 않는다. 조용한 날에 알림이 오면 다음부터 안 읽는다. */
export function combine(parts: (string | null)[]): string | null {
  const kept = parts.filter((p): p is string => p !== null && p !== "");
  return kept.length ? kept.join("\n\n") : null;
}

/*
  하루 한 번 도는 리드 점검 — Vercel cron (`vercel.json` 의 crons).

  하는 일 세 가지.
    ① 3일 넘게 답하지 않은 문의를 알린다. **영업에서 실제로 돈을 잃는 지점이다** —
       리드가 없어서가 아니라 들어온 걸 잊어서 잃는다.
    ② 보유 기간이 지난 종료 문의를 파기한다. 방침에 "1년 뒤 파기" 라고 적어 놓고
       안 지우면 그건 방침을 어기는 것이다.
    ③ 월요일에는 단계별 분포를 한 줄 덧붙인다.

  할 말이 없으면 **아무것도 보내지 않는다.** 조용한 날에 알림이 오면 다음부터
  안 읽게 되고, 그러면 ① 이 쓸모없어진다.

  GitHub Actions 가 아니라 Vercel cron 인 이유: 함수가 이미 이 배포 안에 있고,
  워크플로 파일을 밀려면 토큰에 `workflow` 스코프가 필요하다.

  환경변수: SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY · TELEGRAM_BOT_TOKEN ·
            TELEGRAM_CHAT_ID · (선택) CRON_SECRET
*/

const env = (k: string): string | undefined => {
  const v = process.env[k];
  return v && v.trim() !== "" ? v.trim() : undefined;
};

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

type Sb = { url: string; key: string };

async function rest(sb: Sb, path: string, init?: RequestInit & { prefer?: string }): Promise<Response> {
  const headers: Record<string, string> = {
    apikey: sb.key, Authorization: `Bearer ${sb.key}`, "Content-Type": "application/json",
  };
  if (init?.prefer) headers.Prefer = init.prefer;
  return fetch(`${sb.url}/rest/v1/${path}`, { ...init, headers });
}

async function rows<T>(sb: Sb, path: string): Promise<T[]> {
  const res = await rest(sb, path);
  if (!res.ok) throw new Error(`Supabase GET ${path}: ${res.status}${res.status === 402 ? " (쿼터)" : ""}`);
  return (await res.json()) as T[];
}

async function notify(text: string): Promise<boolean> {
  const token = env("TELEGRAM_BOT_TOKEN");
  const chat = env("TELEGRAM_CHAT_ID");
  if (!token || !chat) return false;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
  });
  return res.ok;
}

export default async function handler(req: Request): Promise<Response> {
  // CRON_SECRET 을 설정해 두면 Vercel cron 이 이 헤더로 부른다. 설정했으면 반드시 본다.
  const secret = env("CRON_SECRET");
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const url = env("SUPABASE_URL") ?? env("VITE_SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json({ ok: false, error: "Supabase 환경변수가 없습니다" }, 503);
  const sb: Sb = { url: url.replace(/\/+$/, ""), key };

  const now = new Date();
  try {
    // ① 늦은 문의
    const overdueBefore = daysAgo(now, OVERDUE_DAYS).toISOString();
    const late = await rows<Lead>(
      sb,
      `inquiries?select=id,created_at,product,name,contact,stage` +
        `&stage=eq.new&created_at=lt.${encodeURIComponent(overdueBefore)}&order=created_at.asc`,
    );

    // ② 파기 대상 — 단계와 처리 완료일 **둘 다** 본다. 한쪽만 보면
    //    버그 하나로 살아 있는 리드가 지워진다.
    const cutoff = daysAgo(now, RETENTION_DAYS).toISOString();
    const closedQ =
      `inquiries?select=id&stage=in.(won,lost)&handled_at=lt.${encodeURIComponent(cutoff)}`;
    const expired = await rows<{ id: string }>(sb, closedQ);
    const plan = planDeletion(expired.length, now);

    if (plan.act === "delete") {
      const res = await rest(sb, closedQ.replace("select=id&", ""), {
        method: "DELETE", prefer: "return=minimal",
      });
      if (!res.ok) throw new Error(`파기 실패: ${res.status}`);
    }

    // ③ 월요일에만 집계 (0=일요일)
    let weekly: string | null = null;
    if (now.getUTCDay() === 1) {
      const all = await rows<{ stage: string }>(sb, "inquiries?select=stage");
      const by = new Map<string, number>();
      for (const r of all) by.set(r.stage, (by.get(r.stage) ?? 0) + 1);
      const counts: StageCount[] = [...by].map(([stage, n]) => ({ stage, n }));
      weekly = weeklyMessage(counts);
    }

    const text = combine([overdueMessage(late, now), deletionMessage(plan), weekly]);
    const sent = text === null ? false : await notify(text);

    // 로그에 연락처·내용은 남기지 않는다. 숫자만.
    console.log(`leads-digest overdue=${late.length} expired=${expired.length} act=${plan.act} sent=${sent}`);
    return json({ ok: true, overdue: late.length, expired: expired.length, act: plan.act, sent }, 200);
  } catch (e) {
    const msg = (e as Error).message;
    console.error("leads-digest 실패:", msg);
    // 실패를 조용히 삼키면 "알림이 안 오니 조용한가 보다" 로 오해하게 된다.
    await notify(`⚠️ 리드 점검이 실패했습니다 — ${msg}`);
    return json({ ok: false, error: msg }, 500);
  }
}
