import { createClient } from "@supabase/supabase-js";

// 어드민 전용 런타임 클라이언트. 공개 anon 키를 쓰며, 실제 보호는 DB 의 RLS 가 한다
// (가족 household 구성원만 읽기/쓰기, INSERT 는 user_id = auth.uid() 강제).
// 공개 사이트는 여전히 빌드타임에 구운 JSON 을 쓴다 — 이 클라이언트는 /admin 에서만 로드된다.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabase =
  url && key
    ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
    : null;

export function supabaseReady(): boolean {
  return supabase !== null;
}
