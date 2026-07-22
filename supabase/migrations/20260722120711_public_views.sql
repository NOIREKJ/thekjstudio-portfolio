-- 이 파일이 "무엇이 공개인가"의 유일한 정의다.
-- select * 를 쓰지 않는다. 나중에 민감한 컬럼이 추가돼도 자동으로 새지 않게 하기 위해서다.

create or replace view public.public_songs as
  select id, slug, title, year, note, sound_path, cover_path, body,
         listen, featured, sort_order
  from public.songs where visibility = 'public';

create or replace view public.public_apps as
  select id, slug, title, year, note, cover_path, body,
         screens, links, featured, sort_order
  from public.apps where visibility = 'public';

create or replace view public.public_credits as
  select id, artist, work_title, album, roles, year, url, sort_order
  from public.credits where visibility = 'public';

create or replace view public.public_performances as
  select id, title, venue, date, poster_path, role, url, sort_order
  from public.performances where visibility = 'public';

-- 재산 정보는 여기서 잘린다. purchase_price / current_price / purchase_date /
-- market_price_usd / market_listings / market_checked_at / location / notes /
-- media_condition / sleeve_condition / discogs_release_id / user_id / household_id
create or replace view public.public_lp as
  select id, artist, title, label, catalog_no, release_year, country, genre,
         format, speed, image_path as cover, apple_music_url, sort_order
  from public.studiorack_records where visibility = 'public';

-- purchase_price / current_price / serial_number / location / is_new / notes 제외
create or replace view public.public_gear as
  select id, name, category, sort_order
  from public.studiorack_items where visibility = 'public';

-- 뷰는 소유자(postgres) 권한으로 실행되어야 원본 행을 읽을 수 있다.
-- 행 필터는 뷰의 where 절이, 컬럼 필터는 뷰의 select 목록이 담당한다.
-- Supabase 보안 조언기가 이것을 "security definer view" 로 경고하지만 의도된 설계다.
alter view public.public_songs        set (security_invoker = false);
alter view public.public_apps         set (security_invoker = false);
alter view public.public_credits      set (security_invoker = false);
alter view public.public_performances set (security_invoker = false);
alter view public.public_lp           set (security_invoker = false);
alter view public.public_gear         set (security_invoker = false);

-- anon 은 원본 테이블에 손댈 수 없다. 뷰만 읽는다.
revoke all on public.songs, public.apps, public.credits, public.performances,
              public.studiorack_records, public.studiorack_items
  from anon;

grant select on public.public_songs, public.public_apps, public.public_credits,
                public.public_performances, public.public_lp, public.public_gear
  to anon, authenticated;
