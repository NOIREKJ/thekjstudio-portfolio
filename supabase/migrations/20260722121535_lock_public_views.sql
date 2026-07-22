-- Supabase 는 public 스키마 신규 객체에 anon/authenticated 전 권한을 기본 부여한다
-- (pg_default_acl). 그래서 grant 만으로는 부족하고, 먼저 회수해야 한다.
--
-- 이 뷰들은 단일 테이블 + where 절이라 자동 갱신 가능 뷰가 되고,
-- security_invoker = false 라서 쓰기가 RLS 를 우회해 원본 테이블에 그대로 꽂힌다.
-- 읽기 전용이어야 한다.
revoke all on public.public_songs, public.public_apps, public.public_credits,
              public.public_performances, public.public_lp, public.public_gear
  from anon, authenticated;

grant select on public.public_songs, public.public_apps, public.public_credits,
                public.public_performances, public.public_lp, public.public_gear
  to anon, authenticated;
