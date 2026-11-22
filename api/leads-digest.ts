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
import {
  combine, daysAgo, deletionMessage, OVERDUE_DAYS, overdueMessage, planDeletion,
  RETENTION_DAYS, weeklyMessage, type Lead, type StageCount,
} from "./_lib/digest";

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
