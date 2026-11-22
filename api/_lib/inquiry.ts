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
