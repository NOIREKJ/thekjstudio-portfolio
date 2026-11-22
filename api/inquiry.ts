

/*
  ── 아래 블록은 원래 별도 파일이었다 ──────────────────────
  Vercel 이 함수를 번들할 때 **import 한 파일을 함께 넣어 주지 않는다.**
  엔트리포인트만 트랜스파일되어 배포되고, 런타임에 ERR_MODULE_NOT_FOUND
  로 죽는다. src/lib → api/_lib 로 옮겨도 같았다(둘 다 실측).
  그래서 핸들러를 자립형으로 둔다. 테스트는 이 파일에서 직접 import 한다.
*/
/*
  문의 제출의 순수 로직 — 판정·정규화·메시지 작성.

  비밀이나 네트워크는 여기 없다. 전부 `api/inquiry.ts` 가 들고 있고 이 파일은
  테스트할 수 있게 떼어 둔 부분이다.
*/

export const PRODUCTS = ["koinon", "music", "other"] as const;
export type Product = (typeof PRODUCTS)[number];

/** 제출에서 받는 값. 바깥에서 오는 것이므로 전부 unknown 으로 받는다. */
export type RawInquiry = Record<string, unknown>;

export type CleanInquiry = {
  product: Product;
  type: string;
  name: string | null;
  contact: string;
  message: string;
  source: string | null;
  payload: Record<string, unknown>;
};

/** 길이 상한. 넘기면 자른다 — 거부하면 긴 글을 쓴 사람의 문의를 잃는다. */
const CAP = { name: 100, contact: 200, message: 5000, type: 40, source: 120, payloadJson: 20_000 };

export class Rejected extends Error {
  /** 봇으로 판정한 것. 사용자에게는 성공으로 보여 주고 아무것도 하지 않는다. */
  constructor(message: string, readonly silent: boolean) {
    super(message);
  }
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const cut = (s: string, n: number): string => (s.length > n ? s.slice(0, n) : s);

function toProduct(v: unknown): Product {
  const s = str(v);
  return (PRODUCTS as readonly string[]).includes(s) ? (s as Product) : "other";
}

/*
  봇 판정. 둘 다 조용히 버린다 — 봇에게 "막혔다" 고 알려 주면 다음엔 피해 온다.

  ⚠️ 두 신호 모두 **제출한 쪽이 꾸밀 수 있다.** 허니팟은 폼을 긁어 채우는
  단순한 봇만 걸리고, 경과 시간은 클라이언트가 보내는 숫자다. 이건 1차 체에
  불과하다. 진짜 속도 제한은 IP 를 기억할 저장소가 필요한데 지금은 없다
  (서버리스라 메모리가 요청 간에 남지 않는다). 아직 못 막는다는 것을 알고 둔다.
*/
function spamCheck(raw: RawInquiry): void {
  if (str(raw.hp) !== "") throw new Rejected("허니팟", true);
  const elapsed = typeof raw.elapsedMs === "number" ? raw.elapsedMs : NaN;
  if (Number.isFinite(elapsed) && elapsed < 3000) throw new Rejected("너무 빠른 제출", true);
}

/** payload 는 한 겹 객체만 받는다. 중첩을 허용하면 크기를 가늠할 수 없다. */
function toPayload(v: unknown): Record<string, unknown> {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (val === null || val === undefined || val === "") continue;
    if (typeof val === "object") continue; // 중첩은 버린다
    out[cut(k, 60)] = typeof val === "string" ? cut(val, 1000) : val;
  }
  if (JSON.stringify(out).length > CAP.payloadJson) return {};
  return out;
}

export function clean(raw: RawInquiry): CleanInquiry {
  spamCheck(raw);

  const contact = cut(str(raw.contact), CAP.contact);
  const message = cut(str(raw.message), CAP.message);
  // 연락처가 없으면 답을 할 수 없고, 내용이 없으면 문의가 아니다. 사용자에게 알린다.
  if (!contact) throw new Rejected("연락처가 없습니다", false);
  if (!message) throw new Rejected("내용이 없습니다", false);

  const name = cut(str(raw.name), CAP.name);
  const type = cut(str(raw.type), CAP.type) || "other";
  const source = cut(str(raw.source), CAP.source);

  return {
    product: toProduct(raw.product),
    type,
    name: name || null,
    contact,
    message,
    source: source || null,
    payload: toPayload(raw.payload),
  };
}

const LABEL: Record<Product, string> = {
  koinon: "KOINON 도입 문의",
  music: "음악·편곡 문의",
  other: "문의",
};

/** 텔레그램용 — 알림이므로 짧게. 전문은 메일에 있다. */
export function formatTelegram(q: CleanInquiry): string {
  const lines = [
    `📬 ${LABEL[q.product]} (${q.type})`,
    q.name ? `이름: ${q.name}` : null,
    `연락처: ${q.contact}`,
    q.source ? `유입: ${q.source}` : null,
    "",
    cut(q.message, 600),
  ];
  return lines.filter((l) => l !== null).join("\n");
}

/*
  메일용 — **영구 사본이다.** DB 가 막혀 있을 때 이 메일이 유일한 기록이고,
  나중에 DB 로 되돌려 넣을 수 있어야 한다. 그래서 끝에 JSON 을 그대로 붙인다.
*/
export function formatMail(q: CleanInquiry, at: Date): { subject: string; text: string } {
  const payloadLines = Object.entries(q.payload).map(([k, v]) => `  ${k}: ${String(v)}`);
  return {
    subject: `[${LABEL[q.product]}] ${q.name ?? q.contact}`,
    text: [
      `받은 시각: ${at.toISOString()}`,
      `제품: ${q.product} / 종류: ${q.type}`,
      `이름: ${q.name ?? "(없음)"}`,
      `연락처: ${q.contact}`,
      `유입: ${q.source ?? "(없음)"}`,
      "",
      "--- 내용 ---",
      q.message,
      ...(payloadLines.length ? ["", "--- 항목 ---", ...payloadLines] : []),
      "",
      "--- 백필용 JSON (DB 가 막혀 있었다면 이걸로 되돌려 넣을 수 있다) ---",
      JSON.stringify({ ...q, created_at: at.toISOString() }),
    ].join("\n"),
  };
}

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

const env = (k: string): string | undefined => {
  const v = process.env[k];
  return v && v.trim() !== "" ? v.trim() : undefined;
};

/*
  ⏱ 모든 바깥 호출에 시한을 건다.

  라이브에서 504(FUNCTION_INVOCATION_TIMEOUT)로 죽었다. Supabase 가 402 로
  제한된 동안 PostgREST 가 응답을 돌려주지 않아 fetch 가 매달렸고, 함수가
  통째로 멈췄다. 한 경로가 느리다고 **나머지 경로와 응답까지 같이 죽으면
  안 된다** — 이 시스템의 전제가 "하나라도 닿으면 성공" 이기 때문이다.

  시한을 넘기면 그 경로만 실패로 처리되고 나머지는 계속 간다.
*/
const SINK_TIMEOUT_MS = 5000;

async function fetchT(url: string, init: RequestInit = {}, ms = SINK_TIMEOUT_MS): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
}

type SinkResult = { sink: string; ok: boolean; detail?: string };

async function toTelegram(q: CleanInquiry): Promise<SinkResult> {
  const token = env("TELEGRAM_BOT_TOKEN");
  const chat = env("TELEGRAM_CHAT_ID");
  if (!token || !chat) return { sink: "telegram", ok: false, detail: "미설정" };

  const res = await fetchT(`https://api.telegram.org/bot${token}/sendMessage`, {
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
  const res = await fetchT("https://api.resend.com/emails", {
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

  const res = await fetchT(`${url.replace(/\/+$/, "")}/rest/v1/inquiries`, {
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
