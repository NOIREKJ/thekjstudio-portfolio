/*
  PostgREST 를 직접 부른다. supabase-js 를 쓰지 않는 이유는
  빌드 스크립트 하나 때문에 사이트에 런타임 의존성을 늘리지 않기 위해서다.

  publishable 키를 쓴다. 굽는 대상이 전부 public_* 뷰뿐이고 그 뷰에는
  anon 에게 SELECT 권한이 있으므로 이걸로 충분하다. RLS 를 우회하는
  service_role 키를 빌드 환경에 두지 않는 편이 안전하다.
*/
export type Row = Record<string, unknown>;

/*
  응답은 받았지만 실패한 경우(4xx/5xx) 던진다. status 가 실려 있으므로
  호출 쪽에서 "가용성 문제"와 "설정 결함"을 구분할 수 있다. 응답 자체가
  없는 네트워크 오류(fetch 가 reject 된 경우)는 이 클래스를 쓰지 않는다 —
  그 경우 status 가 없다는 사실 자체가 신호이기 때문이다.
*/
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

/*
  가용성 문제(폴백해도 되는 것)와 설정 결함(폴백하면 안 되는 것)을 가른다.

  - 응답 자체가 없는 네트워크 오류(HttpError 가 아님) → 가용성 문제로 취급.
  - 5xx, 429 → Supabase 쪽 일시적 문제로 취급. 폴백한다.
  - 그 외 4xx(401 키 무효, 403 권한 없음, 404 뷰 없음 등) → 설정 결함.
    조용히 넘어가면 "콘텐츠를 갱신했다고 믿는데 실제로는 옛 JSON 이 배포된"
    상태가 신호 없이 만들어지므로 폴백하지 않는다.
*/
export function shouldFallback(error: unknown): boolean {
  if (error instanceof HttpError) {
    return error.status >= 500 || error.status === 429;
  }
  return true;
}

export function credentials(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/+$/, ""), key };
}

export async function fetchView(
  view: string,
  creds: { url: string; key: string },
): Promise<Row[]> {
  const res = await fetch(
    `${creds.url}/rest/v1/${view}?select=*&order=sort_order.asc,id.asc`,
    {
      headers: {
        apikey: creds.key,
        Authorization: `Bearer ${creds.key}`,
        Accept: "application/json",
      },
    },
  );

  if (!res.ok) {
    throw new HttpError(res.status, `${view} 조회 실패: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as Row[];
}
