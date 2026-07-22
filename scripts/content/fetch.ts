/*
  PostgREST 를 직접 부른다. supabase-js 를 쓰지 않는 이유는
  빌드 스크립트 하나 때문에 사이트에 런타임 의존성을 늘리지 않기 위해서다.

  publishable 키를 쓴다. 굽는 대상이 전부 public_* 뷰뿐이고 그 뷰에는
  anon 에게 SELECT 권한이 있으므로 이걸로 충분하다. RLS 를 우회하는
  service_role 키를 빌드 환경에 두지 않는 편이 안전하다.
*/
export type Row = Record<string, unknown>;

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
    throw new Error(`${view} 조회 실패: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as Row[];
}
