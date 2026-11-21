-- 라이브 편곡 아카이브 (/arrangements)
--
-- 노션 `🎼 Arrangement & Sheet Tracker` 가 원본이고 이 테이블은 사본이다(단방향).
-- 동기화 키는 notion_page_id 이며, 노션에서 사라진 곡은 지우지 않고 archived 로 내린다.
-- songs 테이블의 관례를 그대로 따른다 — household 소유 + visibility + sort_order
-- + touch_updated_at 트리거 + public_* 뷰.
--
-- ⚠️ service_role 로 넣을 때는 user_id / household_id 를 반드시 명시해야 한다.
--    기본값이 auth.uid() 라서 service_role 세션에서는 null 이 되어 not null 로 깨진다.

create table public.arrangements (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id),
  household_id     uuid not null default public.my_default_household_id()
                     references public.households(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  synced_at        timestamptz not null default now(),

  notion_page_id   text not null unique,          -- 동기화 upsert 기준
  notion_url       text,                          -- 어드민 "노션에서 수정" 링크

  visibility       text not null default 'private'
                     check (visibility in ('public', 'private')),
  archived         boolean not null default false, -- 노션에서 지워진 곡은 삭제 대신 보관
  sort_order       integer not null default 0,

  title            text not null,
  original_artist  text,
  status           text not null default 'idea'
                     check (status in ('idea', 'arranging', 'sheet', 'recording', 'done')),
  genre            text,
  key_bpm          text,                          -- 본문 🎚️ 라벨 (노션 속성 없음)
  arrangement_note text,                          -- 본문 📝 편곡 메모
  sheet_url        text,
  purchase_url     text,
  slug             text not null unique,           -- /arrangements/:slug
  youtube_url      text,                          -- 본문 🎬 라벨
  gear_setup       text,                          -- 본문 🎹 라벨
  songform         text,                          -- 본문 🎼 라벨
  behind_story     text,                          -- 본문 📝 작업 비하인드
  body_markdown    text                           -- 곡 페이지 본문 전체
);

alter table public.arrangements enable row level security;

create policy "가족 arrangements 읽기" on public.arrangements
  for select using (household_id in (select my_household_ids()));

create policy "가족 arrangements 쓰기" on public.arrangements
  for insert with check (
    household_id in (select my_household_ids()) and user_id = auth.uid()
  );

create policy "가족 arrangements 수정" on public.arrangements
  for update using (household_id in (select my_household_ids()))
          with check (household_id in (select my_household_ids()));

create policy "가족 arrangements 삭제" on public.arrangements
  for delete using (household_id in (select my_household_ids()));

create trigger arrangements_touch before update on public.arrangements
  for each row execute function public.touch_updated_at();

-- 공개 목록이 읽는 경로를 그대로 덮는 인덱스
create index arrangements_public_idx
  on public.arrangements (visibility, archived, sort_order, id);

-- 공개 범위의 유일한 정의. select * 금지 — 컬럼을 명시한다.
create view public.public_arrangements as
  select id,
         slug,
         title,
         original_artist,
         status,
         genre,
         key_bpm,
         arrangement_note,
         sheet_url,
         purchase_url,
         youtube_url,
         gear_setup,
         songform,
         behind_story,
         body_markdown,
         notion_url,
         sort_order
    from public.arrangements
   where visibility = 'public'
     and archived = false;

alter view public.public_arrangements set (security_invoker = false);

-- 순서가 중요하다. pg_default_acl 이 신규 객체에 anon/authenticated 전 권한을
-- 자동 부여하므로 revoke 를 먼저 하고 grant select 를 얹는다.
-- (migrations/README.md "공개 뷰 권한 단언 쿼리" 참고 — 적용 후 0행이어야 한다)
revoke all on public.public_arrangements from anon, authenticated;
grant select on public.public_arrangements to anon, authenticated;
