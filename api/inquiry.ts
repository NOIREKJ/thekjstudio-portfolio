/*
  문의 제출 받기 — 사이트의 유일한 쓰기 경로.

  왜 서버를 거치는가. 전에는 브라우저가 PostgREST 로 직접 insert 했고 그 때문에
  세 가지가 동시에 망가져 있었다.

  1. anon 키로 누구나 무한히 행을 넣을 수 있었다(허니팟·타이머는 브라우저 코드라
     REST 를 직접 때리면 없는 것과 같다). 그 정책은 이제 떼어냈다.
  2. 문의가 들어와도 알리는 경로가 없었다. 브라우저는 텔레그램 토큰을 못 가진다.
  3. Supabase 가 402 로 막히면 제출이 통째로 실패했다 — 리드가 사라졌다.

  ## 핵심 규칙 — 받은 것을 잃지 않는다

  받는 즉시 **세 곳으로** 보낸다: 텔레그램(알림) · 메일(영구 사본) · DB(저장).
  **하나라도 성공하면 사용자에게 성공을 보여준다.** 전부 실패했을 때만 실패를
  보여주고 다른 연락 수단을 안내한다. 조용히 성공처럼 보이게 하는 것이 최악이다.

  메일 본문 끝에는 payload 를 JSON 으로 그대로 넣는다. DB 가 막혀 있던 동안의
  문의를 나중에 되돌려 넣을 수 있어야 하기 때문이다.

  ## 환경변수 (전부 선택 — 설정된 것만 쓴다)

    TELEGRAM_BOT_TOKEN · TELEGRAM_CHAT_ID       알림
    RESEND_API_KEY · INQUIRY_MAIL_TO · INQUIRY_MAIL_FROM   영구 사본
    SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY    저장

  ⚠️ 서비스 롤 키에 `VITE_` 접두사를 붙이면 **번들에 박혀 공개된다.** 절대 금지.
*/
import { clean, formatMail, formatTelegram, Rejected } from "../src/lib/inquiry";
import type { CleanInquiry } from "../src/lib/inquiry";

const env = (k: string): string | undefined => {
  const v = process.env[k];
  return v && v.trim() !== "" ? v.trim() : undefined;
};

type SinkResult = { sink: string; ok: boolean; detail?: string };

async function toTelegram(q: CleanInquiry): Promise<SinkResult> {
  const token = env("TELEGRAM_BOT_TOKEN");
  const chat = env("TELEGRAM_CHAT_ID");
  if (!token || !chat) return { sink: "telegram", ok: false, detail: "미설정" };

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chat,
      text: formatTelegram(q),
      disable_web_page_preview: true,
    }),
  });
  return { sink: "telegram", ok: res.ok, detail: res.ok ? undefined : `HTTP ${res.status}` };
}

async function toMail(q: CleanInquiry, at: Date): Promise<SinkResult> {
  const key = env("RESEND_API_KEY");
  const to = env("INQUIRY_MAIL_TO");
  const from = env("INQUIRY_MAIL_FROM");
  if (!key || !to || !from) return { sink: "mail", ok: false, detail: "미설정" };

  const { subject, text } = formatMail(q, at);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  return { sink: "mail", ok: res.ok, detail: res.ok ? undefined : `HTTP ${res.status}` };
}

async function toDatabase(q: CleanInquiry): Promise<SinkResult> {
  const url = env("SUPABASE_URL") ?? env("VITE_SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return { sink: "db", ok: false, detail: "미설정" };

  const res = await fetch(`${url.replace(/\/+$/, "")}/rest/v1/inquiries`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify([{
      product: q.product,
      type: q.type,
      name: q.name,
      contact: q.contact,
      message: q.message,
      source: q.source,
      payload: q.payload,
      stage: "new",
    }]),
  });
  // 402 는 조직 쿼터 초과다. 고장이 아니라 막혀 있는 것이므로 그렇게 적는다.
  const detail = res.ok ? undefined : res.status === 402 ? "402 쿼터" : `HTTP ${res.status}`;
  return { sink: "db", ok: res.ok, detail };
}

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return json({ ok: false, error: "POST 만 받습니다" }, 405);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ ok: false, error: "본문을 읽을 수 없습니다" }, 400);
  }
  if (raw === null || typeof raw !== "object") {
    return json({ ok: false, error: "본문을 읽을 수 없습니다" }, 400);
  }

  let q: CleanInquiry;
  try {
    q = clean(raw as Record<string, unknown>);
  } catch (e) {
    if (e instanceof Rejected) {
      // 봇에게는 성공처럼 보여준다 — 막혔다고 알려 주면 다음엔 피해서 온다.
      if (e.silent) return json({ ok: true }, 200);
      return json({ ok: false, error: e.message }, 400);
    }
    throw e;
  }

  const at = new Date();
  const settled = await Promise.allSettled([toTelegram(q), toMail(q, at), toDatabase(q)]);
  const results: SinkResult[] = settled.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { sink: ["telegram", "mail", "db"][i], ok: false, detail: String(r.reason).slice(0, 120) },
  );

  // 로그에 문의 내용·연락처를 남기지 않는다. 어디가 됐는지만 남긴다.
  console.log(
    "inquiry",
    q.product,
    results.map((r) => `${r.sink}=${r.ok ? "ok" : r.detail ?? "fail"}`).join(" "),
  );

  if (results.some((r) => r.ok)) return json({ ok: true }, 200);

  /*
    세 곳 모두 실패. 받은 것을 잃었으므로 **반드시 사용자에게 알린다.**
    여기서 성공을 돌려주면 문의가 사라진 걸 아무도 모른다.
  */
  return json(
    { ok: false, error: "지금 문의를 접수할 수 없습니다. 인스타그램 DM 으로 연락 주세요." },
    503,
  );
}
