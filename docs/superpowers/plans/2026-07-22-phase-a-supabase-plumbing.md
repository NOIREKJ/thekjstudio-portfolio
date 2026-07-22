# 단계 A — Supabase 배관 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사이트의 콘텐츠 단일 진실을 Supabase로 옮기되, **화면은 지금과 완전히 동일하게 동작한다.**

**Architecture:** Supabase에 콘텐츠 테이블을 만들고, 안전한 컬럼만 담은 공개 뷰 6개를 그 위에 얹는다. 빌드 시 Node 스크립트가 publishable 키로 **뷰만** 조회해 `src/content/*.json`으로 굽고, 그 JSON을 git에 커밋한다. `src/lib/works.ts`는 마크다운 glob 대신 이 JSON을 읽는다. 브라우저로는 어떤 Supabase 키도 나가지 않는다.

**Tech Stack:** Supabase(PostgreSQL 17) · PostgREST · TypeScript · Node 24 · tsx · Vite 8 · Vitest 4 · React 19

## Global Constraints

- Supabase 프로젝트는 **`KJ Data App`** — project id `eiiifadgwbxfutallmsq`, region `ap-southeast-1`. `Hanil Church` 프로젝트(`omnpkfyzqzihksawyxfr`)는 **어떤 이유로도 건드리지 않는다.**
- `studiorack_records` · `studiorack_items` · `discogs_cache` · `profiles` · `households` · `household_members` 는 **이름을 바꾸지 않고, 기존 컬럼을 수정·삭제하지 않는다.** iOS RackVault가 이 테이블로 돌고 있다. 컬럼 **추가만** 허용된다.
- 모든 신규 테이블의 `visibility` 기본값은 **`'private'`**.
- 신규 테이블의 RLS는 기존 household 패턴을 그대로 따른다 — `household_id in (select public.my_household_ids())`.
- 건반에 쓸 수 있는 음은 **`C4 D4 E4 G4 A4 C5 D5`** 일곱 개뿐이다. 따라서 `featured` 상한은 **7**이며, `note`는 수동 지정하고 중복될 수 없다.
- 빌드 스크립트는 **원본 테이블을 절대 조회하지 않는다.** `public_*` 뷰만 읽는다.
- 빌드는 **publishable 키**(`sb_publishable_…`)를 쓴다. `service_role` 키는 쓰지 않는다 — 굽는 대상이 전부 공개 뷰뿐이라 RLS를 우회할 이유가 없고, 그런 키를 Vercel 빌드 환경에 두지 않는 편이 안전하다. 환경변수 이름은 `SUPABASE_URL` · `SUPABASE_PUBLISHABLE_KEY`. `VITE_` 접두사를 붙이지 않는다(붙이면 Vite가 번들에 인라인한다).
- 마이그레이션 SQL은 MCP로 적용하더라도 **반드시 `supabase/migrations/` 에 파일로 남긴다.**
- 커밋 메시지는 한국어. 기존 저장소 관례를 따른다.

---

## File Structure

**신규**

| 경로 | 책임 |
|---|---|
| `supabase/migrations/20260722000001_content_tables.sql` | 기존 테이블 컬럼 추가 + 신규 4테이블 + RLS |
| `supabase/migrations/20260722000002_public_views.sql` | 공개 뷰 6개 + 권한 |
| `supabase/migrations/20260722000003_seed_from_markdown.sql` | 기존 md 5건 이관 |
| `src/lib/content-types.ts` | 구운 JSON의 타입. `scripts/`와 `src/`가 공유하는 유일한 계약 |
| `scripts/content/map.ts` | PostgREST 행 → 콘텐츠 타입 변환 (순수) |
| `scripts/content/map.test.ts` | 위 테스트 |
| `scripts/content/validate.ts` | `featured`·`note` 규칙 검사 (순수) |
| `scripts/content/validate.test.ts` | 위 테스트 |
| `scripts/content/fetch.ts` | PostgREST 조회 (I/O) |
| `scripts/fetch-content.ts` | 진입점 — 조회 → 변환 → 검증 → 파일 쓰기 |
| `src/content/*.json` | 구워진 콘텐츠 6종. **git에 커밋한다** |
| `src/lib/content-leak.test.ts` | 누출 회귀 테스트 |

**수정**

| 경로 | 변경 |
|---|---|
| `src/lib/works.ts` | md glob → JSON 소비. **공개 API(`getWorks` `getWork` `Work`)는 그대로 유지** |
| `src/lib/works.test.ts` | md 문자열 입력 → 콘텐츠 객체 입력 |
| `package.json` | `tsx` devDependency, `build` 스크립트에 fetch 단계 추가 |
| `tsconfig.json` | `include`에 `scripts` 추가 |
| `.gitignore` | `.env` 추가 |

**삭제**

| 경로 | 이유 |
|---|---|
| `src/works/*.md` (5건) | 내용은 시드 마이그레이션에 보존된다 |
| `src/lib/frontmatter.ts` · `src/lib/frontmatter.test.ts` | 마크다운 frontmatter를 더 이상 파싱하지 않는다 |

**손대지 않음:** `src/routes/*` · `src/components/*` · `src/audio/*` · `src/lib/note.ts` · `src/lib/meta.ts`
단계 A에서 이 파일들이 바뀌었다면 그것은 범위를 벗어난 것이다.

---

### Task 1: 콘텐츠 테이블과 RLS

**Files:**
- Create: `supabase/migrations/20260722000001_content_tables.sql`

**Interfaces:**
- Consumes: 기존 함수 `public.my_household_ids()` (SETOF uuid, SECURITY DEFINER), `public.my_default_household_id()` (uuid)
- Produces: 테이블 `public.songs` `public.apps` `public.credits` `public.performances`; `studiorack_records`·`studiorack_items`에 `visibility`·`sort_order` 컬럼; 트리거 함수 `public.touch_updated_at()`

- [ ] **Step 1: 마이그레이션 파일을 작성한다**

`supabase/migrations/20260722000001_content_tables.sql`:

```sql
-- 기존 StudioRack 테이블: 컬럼 추가만 한다. 기존 컬럼은 건드리지 않는다.
alter table public.studiorack_records
  add column if not exists visibility text not null default 'private'
    check (visibility in ('public','private')),
  add column if not exists sort_order integer not null default 0;

alter table public.studiorack_items
  add column if not exists visibility text not null default 'private'
    check (visibility in ('public','private')),
  add column if not exists sort_order integer not null default 0;

-- updated_at 자동 갱신
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.songs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id),
  household_id  uuid not null default public.my_default_household_id()
                  references public.households(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  visibility    text not null default 'private'
                  check (visibility in ('public','private')),
  sort_order    integer not null default 0,
  slug          text not null unique,
  title         text not null,
  year          integer not null check (year between 1900 and 2200),
  note          text,
  sound_path    text,
  cover_path    text,
  body          text not null default '',
  listen        jsonb not null default '[]'::jsonb,
  featured      boolean not null default false,
  -- 건반이 되려면 음이 있어야 한다. 음 없는 건반은 소리가 안 난다.
  constraint songs_featured_needs_note check (not featured or note is not null)
);

create table public.apps (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id),
  household_id  uuid not null default public.my_default_household_id()
                  references public.households(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  visibility    text not null default 'private'
                  check (visibility in ('public','private')),
  sort_order    integer not null default 0,
  slug          text not null unique,
  title         text not null,
  year          integer not null check (year between 1900 and 2200),
  note          text,
  cover_path    text,
  body          text not null default '',
  screens       jsonb not null default '[]'::jsonb,
  links         jsonb not null default '[]'::jsonb,
  featured      boolean not null default false,
  constraint apps_featured_needs_note check (not featured or note is not null)
);

create table public.credits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id),
  household_id  uuid not null default public.my_default_household_id()
                  references public.households(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  visibility    text not null default 'private'
                  check (visibility in ('public','private')),
  sort_order    integer not null default 0,
  artist        text not null,
  work_title    text not null,
  album         text,
  roles         text[] not null default '{}',
  year          integer check (year between 1900 and 2200),
  url           text
);

create table public.performances (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id),
  household_id  uuid not null default public.my_default_household_id()
                  references public.households(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  visibility    text not null default 'private'
                  check (visibility in ('public','private')),
  sort_order    integer not null default 0,
  title         text not null,
  venue         text,
  date          date,
  poster_path   text,
  role          text,
  url           text
);

create trigger songs_touch before update on public.songs
  for each row execute function public.touch_updated_at();
create trigger apps_touch before update on public.apps
  for each row execute function public.touch_updated_at();
create trigger credits_touch before update on public.credits
  for each row execute function public.touch_updated_at();
create trigger performances_touch before update on public.performances
  for each row execute function public.touch_updated_at();

-- RLS: 기존 studiorack_* 와 똑같은 household 패턴을 따른다.
alter table public.songs        enable row level security;
alter table public.apps         enable row level security;
alter table public.credits      enable row level security;
alter table public.performances enable row level security;

do $$
declare t text;
begin
  foreach t in array array['songs','apps','credits','performances'] loop
    execute format($f$
      create policy "가족 %1$s 읽기" on public.%1$I for select
        using (household_id in (select public.my_household_ids()));
      create policy "가족 %1$s 쓰기" on public.%1$I for insert
        with check (household_id in (select public.my_household_ids())
                    and user_id = auth.uid());
      create policy "가족 %1$s 수정" on public.%1$I for update
        using (household_id in (select public.my_household_ids()))
        with check (household_id in (select public.my_household_ids()));
      create policy "가족 %1$s 삭제" on public.%1$I for delete
        using (household_id in (select public.my_household_ids()));
    $f$, t);
  end loop;
end $$;
```

- [ ] **Step 2: 마이그레이션을 적용한다**

Supabase MCP 도구 `apply_migration` 을 쓴다.
- `project_id`: `eiiifadgwbxfutallmsq`
- `name`: `content_tables`
- `query`: 위 파일 내용 전체

- [ ] **Step 3: 적용 결과를 검증한다**

`execute_sql` 로 실행:

```sql
select table_name from information_schema.tables
where table_schema='public'
  and table_name in ('songs','apps','credits','performances')
order by table_name;
```
기대: 4행 — `apps` `credits` `performances` `songs`

```sql
select column_name from information_schema.columns
where table_schema='public' and table_name='studiorack_records'
  and column_name in ('visibility','sort_order') order by column_name;
```
기대: 2행 — `sort_order` `visibility`

```sql
select tablename, count(*) from pg_policies
where schemaname='public' and tablename in ('songs','apps','credits','performances')
group by tablename order by tablename;
```
기대: 4행, 각각 count = 4

```sql
select count(*) from public.studiorack_records where visibility='private';
```
기대: 25 — 기존 데이터가 전부 비공개로 시작한다

- [ ] **Step 4: 커밋**

```bash
git add supabase/migrations/20260722000001_content_tables.sql
git commit -m "DB: 콘텐츠 테이블 4종과 공개 플래그 추가

songs·apps·credits·performances 를 만들고, 기존 studiorack_* 에는
visibility·sort_order 만 더한다. 기존 컬럼은 건드리지 않는다 —
iOS RackVault 가 아직 이 테이블로 돌고 있다.

visibility 기본값은 private. 실수로 공개되는 것보다
실수로 안 보이는 편이 낫다."
```

---

### Task 2: 공개 뷰와 권한

**Files:**
- Create: `supabase/migrations/20260722000002_public_views.sql`

**Interfaces:**
- Consumes: Task 1의 테이블들
- Produces: 뷰 `public_songs` `public_apps` `public_credits` `public_performances` `public_lp` `public_gear`. 각 뷰는 `id` 를 첫 컬럼으로 갖는다

- [ ] **Step 1: 마이그레이션 파일을 작성한다**

`supabase/migrations/20260722000002_public_views.sql`:

```sql
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
```

- [ ] **Step 2: 마이그레이션을 적용한다**

`apply_migration` — `project_id`: `eiiifadgwbxfutallmsq`, `name`: `public_views`

- [ ] **Step 3: 뷰가 민감 컬럼을 갖고 있지 않은지 검증한다**

```sql
select table_name, string_agg(column_name, ', ' order by ordinal_position) as cols
from information_schema.columns
where table_schema='public' and table_name like 'public\_%'
group by table_name order by table_name;
```
기대: `public_lp` 의 컬럼 목록에 `purchase_price` `current_price` `purchase_date` `market_price_usd` `market_listings` `market_checked_at` `location` `notes` `media_condition` `sleeve_condition` `discogs_release_id` `user_id` `household_id` 가 **하나도 없어야 한다.**
기대: `public_gear` 의 컬럼은 정확히 `id, name, category, sort_order` 네 개다.

- [ ] **Step 4: anon 이 원본 테이블에 접근할 수 없는지 검증한다**

```sql
select table_name, privilege_type from information_schema.role_table_grants
where grantee='anon' and table_schema='public'
  and table_name in ('studiorack_records','studiorack_items','songs','apps','credits','performances');
```
기대: **0행.** 한 행이라도 나오면 이 태스크는 실패다.

- [ ] **Step 5: 커밋**

```bash
git add supabase/migrations/20260722000002_public_views.sql
git commit -m "DB: 공개 뷰 6종 — 재산 정보가 나가는 길을 막는다

RLS 는 행 단위 보안이라 '이 LP 는 공개' 라고 표시하는 순간
구입가·일련번호·보관 위치까지 같이 조회된다. 그래서 안전한 컬럼만
명시적으로 나열한 뷰를 만들고 anon 의 원본 테이블 권한을 회수한다.

select * 를 쓰지 않는다 — 나중에 민감한 컬럼이 추가돼도
자동으로 새지 않아야 한다."
```

---

### Task 3: 기존 마크다운 5건을 DB로 옮긴다

**Files:**
- Create: `supabase/migrations/20260722000003_seed_from_markdown.sql`
- Read (변경 없음): `src/works/consolation.md` `streetlight.md` `noire.md` `koinon.md` `hanilpay.md`

**Interfaces:**
- Consumes: Task 1의 `songs` `apps` 테이블
- Produces: `songs` 2행, `apps` 3행. 전부 `visibility='public'`, `featured=true`. `note`는 기존 md 값을 그대로 쓴다 — `consolation` D4, `streetlight` G4, `noire` C4, `koinon` A4, `hanilpay` E4

- [ ] **Step 1: 마이그레이션 파일을 작성한다**

기존 md 5건의 본문을 **한 글자도 바꾸지 않고** 옮긴다. `user_id`·`household_id`는 UUID를 하드코딩하지 않고 `household_members`에서 찾는다.

`supabase/migrations/20260722000003_seed_from_markdown.sql`:

```sql
-- src/works/*.md 5건의 이관. 본문은 원문 그대로다.
-- 이 파일이 마크다운 원문의 보존본이 된다 — 저장소에서 md 를 지운 뒤에도 여기 남는다.
do $$
declare
  owner_user  uuid;
  owner_house uuid;
begin
  select user_id, household_id into owner_user, owner_house
  from public.household_members order by joined_at asc limit 1;

  if owner_user is null then
    raise exception '가구 구성원이 없습니다. 시드를 넣을 소유자를 정할 수 없습니다.';
  end if;

  insert into public.songs
    (user_id, household_id, visibility, sort_order, slug, title, year, note,
     cover_path, body, listen, featured)
  values
    (owner_user, owner_house, 'public', 10, 'consolation', '위로 (Consolation)', 2024, 'D4',
     '/images/projects/noire/horizontal-kj-01.png',
     E'깊은 밤, 혼자라고 느껴지는 이들에게 전하는 포옹 같은 발라드입니다.\n\n'
     E'살다 보면 아무 이유 없이 어둠에 잠기거나, 지친 하루 끝에 철저히 혼자라고 느껴지는 순간이 있습니다. 그럴 때 "힘내"라는 말 대신 "맘껏 울어도 돼, 내가 곁에 있을게"라는 말을 전하고 싶었습니다.\n\n'
     E'서정적인 피아노 선율과 감성적인 보컬 라인 위에, 혼자가 아니라는 안도감을 담았습니다.\n\n'
     E'프로듀스·작곡·편곡 — 김준\n작사 — 김준, 양한솔\n노래 — 최병준\n믹싱·마스터링 — 찬뮤직 (CHAN MUSIC Ent.)',
     '[{"label":"Spotify","url":"https://open.spotify.com/user/31waehtdbctb5mqpag7pmrmnmhte"},
       {"label":"Apple Music","url":"https://music.apple.com/profile/K_Joon_P"},
       {"label":"YouTube","url":"https://www.youtube.com/@K_Joon_P"},
       {"label":"SoundCloud","url":"https://on.soundcloud.com/5UnKPuPovp5dgfz96"}]'::jsonb,
     true),
    (owner_user, owner_house, 'public', 20, 'streetlight', '가로등 (Streetlight)', 2024, 'G4',
     '/images/projects/noire/horizontal-kj-02.png',
     E'지친 하루 끝, 언제나 같은 자리에서 길을 비추는 가로등 같은 발라드입니다.\n\n'
     E'어두운 밤길을 걷다 문득 받은 작은 위로에서 시작한 곡입니다. 가로등은 아무 말 없이 곁을 지키는 존재처럼 늘 그 자리에 서 있습니다. 그 따뜻한 빛을 잔잔한 피아노와 새벽 공기 같은 사운드로 옮겼습니다.\n\n'
     E'외롭고 흔들리는 마음이 천천히 위로받는 과정을 담았습니다. 듣는 사람도 각자의 밤에서 작은 쉼을 얻기를 바랍니다.\n\n'
     E'프로듀스·작곡·편곡 — 김준\n작사 — 김준, 김지선\n노래 — 이해솔\n믹싱·마스터링 — 찬뮤직 (CHAN MUSIC Ent.)',
     '[{"label":"Spotify","url":"https://open.spotify.com/user/31waehtdbctb5mqpag7pmrmnmhte"},
       {"label":"Apple Music","url":"https://music.apple.com/profile/K_Joon_P"},
       {"label":"YouTube","url":"https://www.youtube.com/@K_Joon_P"},
       {"label":"SoundCloud","url":"https://on.soundcloud.com/5UnKPuPovp5dgfz96"}]'::jsonb,
     true);

  insert into public.apps
    (user_id, household_id, visibility, sort_order, slug, title, year, note,
     cover_path, body, screens, featured)
  values
    (owner_user, owner_house, 'public', 10, 'noire', 'NOIRE', 2026, 'C4',
     '/images/projects/noire/horizontal-1-noire.png',
     E'자산, 시간, 루틴 — 중요한 것들을 한자리에 두는 개인 비서 앱입니다.\n\n'
     E'흩어져 있는 것들은 관리 대상이 아니라 불안의 재료가 됩니다. NOIRE는 그것들을 하나의 조용한 공간에 모읍니다.\n\n'
     E'미니멀한 다크 인터페이스를 골랐습니다. 도구는 사라지고 중요한 것만 남게 하기 위해서입니다.\n\n'
     E'현재 개발 중입니다.',
     '[]'::jsonb, true),
    (owner_user, owner_house, 'public', 20, 'hanilpay', '한일페이 (HANIL Pay)', 2026, 'E4',
     '/images/projects/hanil-pay/hanilpay.png',
     E'현금이나 카드 없이, 스마트폰 하나로 교회 안 카페와 매점을 이용하는 한일교회 전용 간편결제 서비스입니다.\n\n'
     E'성도 쪽은 단순합니다. 로그인하고, 결제하고, 끝. 사용처는 지도에서 확인하고, 내역은 앱에서 바로 봅니다.\n\n'
     E'보이지 않는 쪽이 이 프로젝트의 절반입니다. 회원과 충전을 관리하고, 가맹점을 등록하고, 매출을 정산하는 관리자 시스템까지 — 결제 인프라 전체를 직접 만들었습니다.\n\n'
     E'지갑을 뒤적이는 시간이 사라지면 남는 것은 교제입니다. 그걸 위해 만들었습니다.',
     '[{"src":"/images/projects/hanil-pay/home-screen_1.png","caption":"간편 로그인"},
       {"src":"/images/projects/hanil-pay/home-screen_2.png","caption":"메인 결제 홈"},
       {"src":"/images/projects/hanil-pay/home-screen_8.png","caption":"사용처 지도 연동"},
       {"src":"/images/projects/hanil-pay/home-screen_9.png","caption":"가맹점 상세 정보"},
       {"src":"/images/projects/hanil-pay/home-screen_3.png","caption":"관리자 대시보드"},
       {"src":"/images/projects/hanil-pay/home-screen_4.png","caption":"회원 및 충전 관리"},
       {"src":"/images/projects/hanil-pay/home-screen_5.png","caption":"가맹점 등록"},
       {"src":"/images/projects/hanil-pay/home-screen_6.png","caption":"통계 및 정산"}]'::jsonb,
     true),
    (owner_user, owner_house, 'public', 30, 'koinon', 'KOINON (코이논)', 2026, 'A4',
     '/images/projects/hanil-church/main-icon.png',
     E'예배, 소통, 신앙 관리를 하나로 모은 한일교회 통합 iOS 네이티브 앱입니다.\n\n'
     E'실시간 예배 스트리밍과 VOD, 스마트 교인 요람, 교회 캘린더와 행정, 마이페이지 — 흩어져 있던 것들이 한 앱 안에서 유기적으로 연결됩니다.\n\n'
     E'이름은 ''코이노니아(교제)''에서 왔습니다. 기능이 많아질수록 화면은 단순해져야 한다고 믿고, 남녀노소 누구나 헤매지 않도록 절제해서 설계했습니다.\n\n'
     E'한일페이와 이어져 결제까지 한 흐름으로 연결됩니다.',
     '[{"src":"/images/projects/hanil-church/home-screen1.png","caption":"메인 대시보드"},
       {"src":"/images/projects/hanil-church/home-screen2.png","caption":"실시간 예배 & VOD"},
       {"src":"/images/projects/hanil-church/home-screen3.png","caption":"스마트 교인 요람"},
       {"src":"/images/projects/hanil-church/home-screen4.png","caption":"교회 캘린더"},
       {"src":"/images/projects/hanil-church/home-screen5.png","caption":"마이페이지"}]'::jsonb,
     true);
end $$;
```

- [ ] **Step 2: 마이그레이션을 적용한다**

`apply_migration` — `name`: `seed_from_markdown`

- [ ] **Step 3: 공개 뷰로 5건이 나오는지 검증한다**

```sql
select slug, note, featured from public.public_songs order by sort_order;
```
기대: `consolation` D4 true / `streetlight` G4 true

```sql
select slug, note, featured, jsonb_array_length(screens) as screens
from public.public_apps order by sort_order;
```
기대: `noire` C4 true 0 / `hanilpay` E4 true 8 / `koinon` A4 true 5

```sql
select count(*) as featured_total from
  (select note from public.public_songs where featured
   union all select note from public.public_apps where featured) t;
```
기대: 5 — 상한 7 이내

```sql
select note, count(*) from
  (select note from public.public_songs where featured
   union all select note from public.public_apps where featured) t
group by note having count(*) > 1;
```
기대: **0행** — 음이 중복되지 않는다

- [ ] **Step 4: 본문이 원문과 같은지 눈으로 대조한다**

```sql
select slug, left(body, 40) as head, length(body) as len from public.public_songs
union all select slug, left(body, 40), length(body) from public.public_apps
order by slug;
```
각 `head`를 대응하는 `src/works/<slug>.md`의 첫 문장과 비교한다. 한 글자라도 다르면 고친다.

- [ ] **Step 5: 커밋**

```bash
git add supabase/migrations/20260722000003_seed_from_markdown.sql
git commit -m "DB: 기존 작업물 5건을 DB로 옮긴다

src/works/*.md 의 본문을 한 글자도 바꾸지 않고 songs 2건, apps 3건으로
옮긴다. note 도 기존 값 그대로다 — 건반 배치가 달라지면 안 된다.

소유자 UUID 는 하드코딩하지 않고 household_members 에서 찾는다."
```

---

### Task 4: 콘텐츠 타입과 순수 변환·검증 로직

**Files:**
- Create: `src/lib/content-types.ts`
- Create: `scripts/content/map.ts`, `scripts/content/map.test.ts`
- Create: `scripts/content/validate.ts`, `scripts/content/validate.test.ts`
- Modify: `tsconfig.json`, `package.json`

**Interfaces:**
- Consumes: 없음 (순수 로직)
- Produces:
  - 타입 `SongContent` `AppContent` `CreditContent` `PerformanceContent` `LpContent` `GearContent` `ListenLink` `Screen` (`src/lib/content-types.ts`)
  - `mapSong(row): SongContent` · `mapApp(row): AppContent` · `mapCredit(row): CreditContent` · `mapPerformance(row): PerformanceContent` · `mapLp(row): LpContent` · `mapGear(row): GearContent` (`scripts/content/map.ts`)
  - `PENTATONIC: readonly string[]` · `validateFeatured(items: FeaturedCheck[]): void` (`scripts/content/validate.ts`)
  - `type FeaturedCheck = { slug: string; note: string | null; featured: boolean }`

- [ ] **Step 1: tsx 를 설치하고 tsconfig 에 scripts 를 포함시킨다**

```bash
npm install -D tsx
```

`tsconfig.json` 의 `include` 를 바꾼다:

```jsonc
  "include": ["src", "scripts", "vite.config.ts"]
```

- [ ] **Step 2: 콘텐츠 타입을 정의한다**

`src/lib/content-types.ts`:

```ts
/*
  구운 콘텐츠 JSON 의 모양. scripts/ 와 src/ 가 공유하는 유일한 계약이다.
  DB 컬럼 이름(snake_case)이 아니라 화면이 쓰는 이름을 쓴다 —
  변환은 scripts/content/map.ts 한 곳에서만 일어난다.
*/
export type ListenLink = { label: string; url: string };
export type Screen = { src: string; caption: string };

export type SongContent = {
  id: string;
  slug: string;
  title: string;
  year: number;
  note: string | null;
  sound: string | null;
  cover: string | null;
  body: string;
  listen: ListenLink[];
  featured: boolean;
  sortOrder: number;
};

export type AppContent = {
  id: string;
  slug: string;
  title: string;
  year: number;
  note: string | null;
  cover: string | null;
  body: string;
  screens: Screen[];
  links: ListenLink[];
  featured: boolean;
  sortOrder: number;
};

export type CreditContent = {
  id: string;
  artist: string;
  workTitle: string;
  album: string | null;
  roles: string[];
  year: number | null;
  url: string | null;
  sortOrder: number;
};

export type PerformanceContent = {
  id: string;
  title: string;
  venue: string | null;
  date: string | null;
  poster: string | null;
  role: string | null;
  url: string | null;
  sortOrder: number;
};

export type LpContent = {
  id: string;
  artist: string;
  title: string;
  label: string | null;
  catalogNo: string | null;
  releaseYear: number | null;
  country: string | null;
  genre: string | null;
  format: string;
  speed: string;
  cover: string | null;
  appleMusicUrl: string | null;
  sortOrder: number;
};

export type GearContent = {
  id: string;
  name: string;
  category: string;
  sortOrder: number;
};
```

- [ ] **Step 3: 변환 테스트를 먼저 쓴다 (실패해야 한다)**

`scripts/content/map.test.ts`:

```ts
import { mapApp, mapGear, mapLp, mapSong } from "./map";

test("snake_case 컬럼을 화면이 쓰는 이름으로 옮긴다", () => {
  const song = mapSong({
    id: "s1", slug: "consolation", title: "위로", year: 2024, note: "D4",
    sound_path: null, cover_path: "/images/a.png", body: "본문",
    listen: [{ label: "Spotify", url: "https://sp.example/a" }],
    featured: true, sort_order: 10,
  });
  expect(song).toEqual({
    id: "s1", slug: "consolation", title: "위로", year: 2024, note: "D4",
    sound: null, cover: "/images/a.png", body: "본문",
    listen: [{ label: "Spotify", url: "https://sp.example/a" }],
    featured: true, sortOrder: 10,
  });
});

test("jsonb 가 null 로 와도 빈 배열이 된다", () => {
  const app = mapApp({
    id: "a1", slug: "noire", title: "NOIRE", year: 2026, note: "C4",
    cover_path: null, body: "본문", screens: null, links: null,
    featured: false, sort_order: 0,
  });
  expect(app.screens).toEqual([]);
  expect(app.links).toEqual([]);
});

test("LP 는 재산 정보를 담을 자리가 없다", () => {
  const lp = mapLp({
    id: "l1", artist: "Bill Evans", title: "Waltz for Debby", label: "Riverside",
    catalog_no: "RLP-399", release_year: 1962, country: "US", genre: "Jazz",
    format: '12"', speed: "33", cover: "https://x.example/c.jpg",
    apple_music_url: null, sort_order: 0,
  });
  expect(Object.keys(lp).sort()).toEqual([
    "appleMusicUrl", "artist", "catalogNo", "country", "cover", "format",
    "genre", "id", "label", "releaseYear", "sortOrder", "speed", "title",
  ]);
});

test("장비는 이름과 분류만 나온다", () => {
  const gear = mapGear({ id: "g1", name: "Genelec 8030", category: "모니터", sort_order: 0 });
  expect(gear).toEqual({ id: "g1", name: "Genelec 8030", category: "모니터", sortOrder: 0 });
});
```

- [ ] **Step 4: 테스트가 실패하는지 확인한다**

Run: `npx vitest run scripts/content/map.test.ts`
Expected: FAIL — `Failed to resolve import "./map"`

- [ ] **Step 5: 변환기를 구현한다**

`scripts/content/map.ts`:

```ts
import type {
  AppContent, CreditContent, GearContent, ListenLink, LpContent,
  PerformanceContent, Screen, SongContent,
} from "../../src/lib/content-types";

type Row = Record<string, unknown>;

/*
  이미지 경로는 손대지 않고 그대로 흘려보낸다. 스펙 §4의 규칙
  ("/images/…" 는 저장소 파일, "http…" 는 Supabase Storage)은
  <img src> 가 둘 다 그대로 처리하므로 코드가 필요 없다.
  여기에 URL 조립기를 만들지 말 것.
*/
const str = (v: unknown): string => (v == null ? "" : String(v));
const nullable = (v: unknown): string | null => (v == null ? null : String(v));
const num = (v: unknown): number => Number(v ?? 0);
const nullableNum = (v: unknown): number | null => (v == null ? null : Number(v));

function links(v: unknown): ListenLink[] {
  if (!Array.isArray(v)) return [];
  return v.map((e) => ({ label: str((e as Row).label), url: str((e as Row).url) }));
}

function screens(v: unknown): Screen[] {
  if (!Array.isArray(v)) return [];
  return v.map((e) => ({ src: str((e as Row).src), caption: str((e as Row).caption) }));
}

export function mapSong(row: Row): SongContent {
  return {
    id: str(row.id),
    slug: str(row.slug),
    title: str(row.title),
    year: num(row.year),
    note: nullable(row.note),
    sound: nullable(row.sound_path),
    cover: nullable(row.cover_path),
    body: str(row.body),
    listen: links(row.listen),
    featured: Boolean(row.featured),
    sortOrder: num(row.sort_order),
  };
}

export function mapApp(row: Row): AppContent {
  return {
    id: str(row.id),
    slug: str(row.slug),
    title: str(row.title),
    year: num(row.year),
    note: nullable(row.note),
    cover: nullable(row.cover_path),
    body: str(row.body),
    screens: screens(row.screens),
    links: links(row.links),
    featured: Boolean(row.featured),
    sortOrder: num(row.sort_order),
  };
}

export function mapCredit(row: Row): CreditContent {
  return {
    id: str(row.id),
    artist: str(row.artist),
    workTitle: str(row.work_title),
    album: nullable(row.album),
    roles: Array.isArray(row.roles) ? row.roles.map(str) : [],
    year: nullableNum(row.year),
    url: nullable(row.url),
    sortOrder: num(row.sort_order),
  };
}

export function mapPerformance(row: Row): PerformanceContent {
  return {
    id: str(row.id),
    title: str(row.title),
    venue: nullable(row.venue),
    date: nullable(row.date),
    poster: nullable(row.poster_path),
    role: nullable(row.role),
    url: nullable(row.url),
    sortOrder: num(row.sort_order),
  };
}

export function mapLp(row: Row): LpContent {
  return {
    id: str(row.id),
    artist: str(row.artist),
    title: str(row.title),
    label: nullable(row.label),
    catalogNo: nullable(row.catalog_no),
    releaseYear: nullableNum(row.release_year),
    country: nullable(row.country),
    genre: nullable(row.genre),
    format: str(row.format),
    speed: str(row.speed),
    cover: nullable(row.cover),
    appleMusicUrl: nullable(row.apple_music_url),
    sortOrder: num(row.sort_order),
  };
}

export function mapGear(row: Row): GearContent {
  return {
    id: str(row.id),
    name: str(row.name),
    category: str(row.category),
    sortOrder: num(row.sort_order),
  };
}
```

- [ ] **Step 6: 테스트가 통과하는지 확인한다**

Run: `npx vitest run scripts/content/map.test.ts`
Expected: PASS — 4 tests

- [ ] **Step 7: 검증 테스트를 먼저 쓴다 (실패해야 한다)**

`scripts/content/validate.test.ts`:

```ts
import { PENTATONIC, validateFeatured } from "./validate";

const ok = (slug: string, note: string | null, featured = true) => ({ slug, note, featured });

test("쓸 수 있는 음은 일곱 개뿐이다", () => {
  expect(PENTATONIC).toEqual(["C4", "D4", "E4", "G4", "A4", "C5", "D5"]);
});

test("일곱 개까지는 통과한다", () => {
  expect(() =>
    validateFeatured(PENTATONIC.map((n, i) => ok(`w${i}`, n))),
  ).not.toThrow();
});

test("여덟 번째를 켜면 실패한다", () => {
  const items = [...PENTATONIC.map((n, i) => ok(`w${i}`, n)), ok("overflow", "F4")];
  expect(() => validateFeatured(items)).toThrow(/7개/);
});

test("음이 겹치면 어느 것끼리 겹치는지 알려주며 실패한다", () => {
  expect(() => validateFeatured([ok("a", "C4"), ok("b", "C4")])).toThrow(/C4/);
});

test("5음 음계 밖의 음은 실패한다", () => {
  expect(() => validateFeatured([ok("a", "F4")])).toThrow(/F4/);
});

test("featured 인데 음이 없으면 실패한다", () => {
  expect(() => validateFeatured([ok("a", null)])).toThrow(/a/);
});

test("featured 가 아니면 음이 없어도 되고 음계 밖이어도 된다", () => {
  expect(() => validateFeatured([ok("a", null, false), ok("b", "F4", false)])).not.toThrow();
});
```

- [ ] **Step 8: 테스트가 실패하는지 확인한다**

Run: `npx vitest run scripts/content/validate.test.ts`
Expected: FAIL — `Failed to resolve import "./validate"`

- [ ] **Step 9: 검증기를 구현한다**

`scripts/content/validate.ts`:

```ts
/*
  건반은 하나의 5음 음계 안에서만 성립한다. 아무렇게나 눌러도 불협이 되지 않는 것이
  이 사이트의 핵심 장치이므로 음을 임의로 늘릴 수 없다.

  DB 제약이 아니라 빌드 검사로 두는 이유: 앱에서 여덟 번째를 켜는 순간
  실패해야 할 것은 앱의 저장이 아니라 사이트의 배포다.
*/
export const PENTATONIC = ["C4", "D4", "E4", "G4", "A4", "C5", "D5"] as const;

export type FeaturedCheck = {
  slug: string;
  note: string | null;
  featured: boolean;
};

export function validateFeatured(items: FeaturedCheck[]): void {
  const featured = items.filter((i) => i.featured);

  if (featured.length > PENTATONIC.length) {
    throw new Error(
      `건반은 최대 7개입니다. 지금 ${featured.length}개가 켜져 있습니다: ` +
        featured.map((i) => i.slug).join(", "),
    );
  }

  const noteless = featured.filter((i) => !i.note);
  if (noteless.length > 0) {
    throw new Error(
      `건반이 되려면 음이 있어야 합니다. 음이 없는 항목: ` +
        noteless.map((i) => i.slug).join(", "),
    );
  }

  const allowed: readonly string[] = PENTATONIC;
  const outside = featured.filter((i) => !allowed.includes(i.note!));
  if (outside.length > 0) {
    throw new Error(
      `5음 음계(${PENTATONIC.join(" ")}) 밖의 음입니다: ` +
        outside.map((i) => `${i.slug}=${i.note}`).join(", "),
    );
  }

  const byNote = new Map<string, string[]>();
  for (const item of featured) {
    const slugs = byNote.get(item.note!) ?? [];
    slugs.push(item.slug);
    byNote.set(item.note!, slugs);
  }
  const collisions = [...byNote.entries()].filter(([, slugs]) => slugs.length > 1);
  if (collisions.length > 0) {
    throw new Error(
      `음이 겹칩니다: ` +
        collisions.map(([note, slugs]) => `${note} — ${slugs.join(", ")}`).join(" / "),
    );
  }
}
```

- [ ] **Step 10: 테스트가 통과하는지 확인한다**

Run: `npx vitest run scripts/content/`
Expected: PASS — 11 tests (map 4 + validate 7)

- [ ] **Step 11: 타입 검사를 돌린다**

Run: `npx tsc --noEmit`
Expected: 오류 없음

- [ ] **Step 12: 커밋**

```bash
git add tsconfig.json package.json package-lock.json src/lib/content-types.ts scripts/content/
git commit -m "콘텐츠 타입과 순수 변환·검증 로직

DB 컬럼 이름과 화면이 쓰는 이름 사이의 변환을 한 곳에 모은다.
건반 규칙(5음 음계 일곱 개, 음 중복 불가)은 순수 함수로 두어
네트워크 없이 테스트한다."
```

---

### Task 5: 콘텐츠를 굽는 빌드 스크립트

**Files:**
- Create: `scripts/content/fetch.ts`, `scripts/fetch-content.ts`
- Create: `src/content/songs.json` `apps.json` `credits.json` `performances.json` `lp.json` `gear.json` (스크립트가 생성)
- Modify: `package.json`, `.gitignore`

**Interfaces:**
- Consumes: Task 4의 `map*` 함수와 `validateFeatured`; Task 2의 공개 뷰
- Produces: `fetchView(view: string): Promise<Row[]>` (`scripts/content/fetch.ts`); `src/content/*.json` 6개 파일

- [ ] **Step 1: .env 를 gitignore 에 넣는다**

`.gitignore` 에 한 줄 추가:

```
.env
```

- [ ] **Step 2: 조회 모듈을 만든다**

`scripts/content/fetch.ts`:

```ts
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
    `${creds.url}/rest/v1/${view}?select=*&order=sort_order.asc`,
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
```

- [ ] **Step 3: 진입점을 만든다**

`scripts/fetch-content.ts`:

```ts
/*
  빌드 전에 콘텐츠를 굽는다.

  키가 없으면 실패하지 않고 커밋된 JSON 을 그대로 쓴다. 이유:
  - 키 없이도 npm run dev 가 돌아야 한다
  - Supabase 가 죽어도 배포가 되어야 한다
  - git 디프로 콘텐츠 변경이 보여야 한다
*/
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { credentials, fetchView, type Row } from "./content/fetch";
import { mapApp, mapCredit, mapGear, mapLp, mapPerformance, mapSong } from "./content/map";
import { validateFeatured } from "./content/validate";

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../src/content");

type Source = { view: string; file: string; map: (row: Row) => unknown };

const SOURCES: Source[] = [
  { view: "public_songs", file: "songs", map: mapSong },
  { view: "public_apps", file: "apps", map: mapApp },
  { view: "public_credits", file: "credits", map: mapCredit },
  { view: "public_performances", file: "performances", map: mapPerformance },
  { view: "public_lp", file: "lp", map: mapLp },
  { view: "public_gear", file: "gear", map: mapGear },
];

async function main(): Promise<void> {
  const creds = credentials();

  if (!creds) {
    const songs = resolve(OUT_DIR, "songs.json");
    if (!existsSync(songs)) {
      throw new Error(
        "SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY 가 없고 커밋된 콘텐츠도 없습니다. " +
          "둘 중 하나는 있어야 빌드할 수 있습니다.",
      );
    }
    console.warn("⚠ Supabase 키가 없습니다. 커밋된 src/content/*.json 을 그대로 씁니다.");
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const baked: Record<string, unknown[]> = {};
  for (const source of SOURCES) {
    const rows = await fetchView(source.view, creds);
    baked[source.file] = rows.map((row) => source.map(row));
    console.log(`  ${source.view} → ${rows.length}건`);
  }

  // 건반 규칙은 굽기 전에 검사한다. 조용히 불협화음이 나는 것보다 빌드가 깨지는 편이 낫다.
  validateFeatured([
    ...(baked.songs as { slug: string; note: string | null; featured: boolean }[]),
    ...(baked.apps as { slug: string; note: string | null; featured: boolean }[]),
  ]);

  for (const source of SOURCES) {
    writeFileSync(
      resolve(OUT_DIR, `${source.file}.json`),
      JSON.stringify(baked[source.file], null, 2) + "\n",
      "utf8",
    );
  }

  console.log("✓ src/content/*.json 을 구웠습니다.");
}

main().catch((error) => {
  console.error(`✕ 콘텐츠를 굽지 못했습니다: ${(error as Error).message}`);
  process.exit(1);
});
```

- [ ] **Step 4: build 스크립트를 연결한다**

`package.json` 의 `scripts` 를 바꾼다:

```jsonc
  "scripts": {
    "dev": "vite",
    "content": "tsx scripts/fetch-content.ts",
    "build": "tsx scripts/fetch-content.ts && tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
```

- [ ] **Step 5: 로컬 `.env` 를 만든다**

publishable 키는 공개용이므로 대시보드를 열 필요 없이 그대로 쓴다.
저장소 루트에 `.env` 를 만든다 (gitignore 되어 있다):

```
SUPABASE_URL=https://eiiifadgwbxfutallmsq.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_9wmIMWbMQ1NP-3wky1lV9g_LpId0Pif
```

Vercel 등록은 **사용자가 직접 한다.** 다음을 그대로 전달할 것:

> Vercel 대시보드 → 프로젝트 → Settings → Environment Variables 에 위 두 값을
> Production·Preview 둘 다 등록하세요. 비밀 키가 아니라 공개용 키이므로
> 유출 위험은 없지만, 회전(rotation)이 가능하도록 환경변수로 둡니다.
>
> 등록하지 않아도 배포는 됩니다 — 커밋된 `src/content/*.json` 으로 빌드되고,
> 다만 콘텐츠가 갱신되지 않습니다.
>
> 이어서 Vercel → Settings → Git → **Deploy Hooks** 에서 훅을 하나 만드세요.
> 이름 `content-refresh`, 브랜치 `main`. 생성된 URL을 알려주시면 계획에 기록합니다.
> (앞으로 앱에서 항목을 등록할 때 이 URL을 치면 사이트가 다시 구워집니다. 앱 쪽 구현은 스펙 3입니다.)

- [ ] **Step 5-1: Deploy Hook 이 실제로 도는지 확인한다**

**훅 URL은 저장소에 커밋하지 않는다.** 인증 없이 POST만으로 배포가 트리거되므로
사실상 비밀키다. `.env`(gitignore됨)에 `VERCEL_DEPLOY_HOOK` 으로 둔다:

```
VERCEL_DEPLOY_HOOK=https://api.vercel.com/v1/integrations/deploy/<프로젝트>/<토큰>
```

(2026-07-23 발급 완료 — 값은 로컬 `.env` 에 있다. Vercel 프로젝트 `prj_6uN7t…`, 브랜치 `main`.)

```bash
set -a; . ./.env; set +a
curl -s -X POST "$VERCEL_DEPLOY_HOOK" -w "\nHTTP %{http_code}\n" | head -c 400
```
Expected: `{"job":{"id":"...","state":"PENDING",...}}` 형태의 JSON, HTTP 201

Vercel 대시보드의 Deployments 에 새 배포가 뜨는지 확인한다. 이것이 스펙 §6의 갱신 경로이며,
여기서 **수동 호출로만** 검증한다. 자동 호출은 앱의 책임이다(스펙 3).

- [ ] **Step 6: 스크립트를 돌린다**

Run: `npm run content`
Expected:
```
  public_songs → 2건
  public_apps → 3건
  public_credits → 0건
  public_performances → 0건
  public_lp → 0건
  public_gear → 0건
✓ src/content/*.json 을 구웠습니다.
```

`public_lp` 가 0건인 것이 맞다 — LP 25건은 전부 `visibility='private'` 이다.
단계 B에서 공개로 바꾼다.

- [ ] **Step 7: 구워진 내용을 확인한다**

Run: `node -e "const s=require('./src/content/songs.json');console.log(s.map(x=>x.slug+' '+x.note).join(' | '))"`
Expected: `consolation D4 | streetlight G4`

- [ ] **Step 8: 커밋**

```bash
git add .gitignore package.json scripts/content/fetch.ts scripts/fetch-content.ts src/content/
git commit -m "빌드 시 Supabase 공개 뷰를 JSON 으로 굽는다

원본 테이블이 아니라 public_* 뷰만 읽는다. 그리고 anon 권한으로 읽는다 —
RLS 를 우회하는 키를 빌드 환경에 두지 않는다.

구운 JSON 은 커밋한다 — 키 없이도 dev 가 돌고, 디프로 변경이 보이고,
Supabase 가 죽어도 빌드가 산다. 배포가 DB 가용성에 인질로 잡히면 안 된다."
```

---

### Task 6: 누출 회귀 테스트

**Files:**
- Create: `src/lib/content-leak.test.ts`

**Interfaces:**
- Consumes: Task 5가 만든 `src/content/*.json`
- Produces: 없음 (테스트 전용). 이 테스트는 이후 모든 변경에 대해 계속 돈다

- [ ] **Step 1: 테스트를 쓴다**

`src/lib/content-leak.test.ts`:

```ts
/*
  구워진 콘텐츠에 재산 정보가 섞여 들어갔는지 본다.
  공개 뷰의 컬럼 목록이 1차 방어선이고 이것이 2차 방어선이다.
  사람의 주의력에 재산 목록을 맡기지 않는다.
*/
import apps from "../content/apps.json";
import credits from "../content/credits.json";
import gear from "../content/gear.json";
import lp from "../content/lp.json";
import performances from "../content/performances.json";
import songs from "../content/songs.json";

const FORBIDDEN = [
  "purchase_price", "purchasePrice",
  "current_price", "currentPrice",
  "purchase_date", "purchaseDate",
  "serial_number", "serialNumber",
  "market_price", "marketPrice",
  "market_listings", "marketListings",
  "location",
  "household_id", "householdId",
  "user_id", "userId",
];

const BAKED: Record<string, unknown> = {
  "songs.json": songs,
  "apps.json": apps,
  "credits.json": credits,
  "performances.json": performances,
  "lp.json": lp,
  "gear.json": gear,
};

function collectKeys(value: unknown, found: Set<string>): void {
  if (Array.isArray(value)) {
    for (const entry of value) collectKeys(entry, found);
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      found.add(key);
      collectKeys(child, found);
    }
  }
}

for (const [file, content] of Object.entries(BAKED)) {
  test(`${file} 에 재산 정보가 없다`, () => {
    const keys = new Set<string>();
    collectKeys(content, keys);
    const leaked = FORBIDDEN.filter((f) => keys.has(f));
    expect(leaked).toEqual([]);
  });
}

test("금지 목록 자체가 비어 있지 않다 — 테스트가 껍데기가 되지 않게", () => {
  expect(FORBIDDEN.length).toBeGreaterThan(10);
});

test("키 수집기가 중첩 구조까지 훑는다", () => {
  const keys = new Set<string>();
  collectKeys([{ a: { b: [{ user_id: 1 }] } }], keys);
  expect(keys.has("user_id")).toBe(true);
});
```

- [ ] **Step 2: 테스트를 돌린다**

Run: `npx vitest run src/lib/content-leak.test.ts`
Expected: PASS — 8 tests

- [ ] **Step 3: 테스트가 진짜로 잡는지 확인한다 (일부러 깨뜨린다)**

`src/content/gear.json` 을 임시로 다음과 같이 바꾼다:

```json
[{ "id": "x", "name": "테스트", "category": "테스트", "sortOrder": 0, "purchase_price": 1000 }]
```

Run: `npx vitest run src/lib/content-leak.test.ts`
Expected: **FAIL** — `gear.json 에 재산 정보가 없다` 가 `["purchase_price"]` 로 실패

- [ ] **Step 4: 원상복구한다**

Run: `git checkout src/content/gear.json && npx vitest run src/lib/content-leak.test.ts`
Expected: PASS — 8 tests

이 단계를 건너뛰지 말 것. **한 번도 실패해본 적 없는 안전장치는 안전장치가 아니다.**

- [ ] **Step 5: 커밋**

```bash
git add src/lib/content-leak.test.ts
git commit -m "누출 회귀 테스트 — 구운 JSON 에 재산 정보가 있으면 빌드를 깬다

공개 뷰의 컬럼 목록이 1차 방어선이고 이것이 2차 방어선이다.
일부러 깨뜨려서 실제로 잡는 것을 확인했다."
```

---

### Task 7: works.ts 를 JSON 소비로 바꾸고 마크다운을 걷어낸다

**Files:**
- Modify: `src/lib/works.ts`
- Modify: `src/lib/works.test.ts`
- Delete: `src/lib/frontmatter.ts`, `src/lib/frontmatter.test.ts`, `src/works/*.md` (5건)

**Interfaces:**
- Consumes: Task 4의 `SongContent`·`AppContent`, Task 5의 `src/content/songs.json`·`apps.json`
- Produces: **기존과 동일한** 공개 API — `type Work`, `type WorkKind`, `type Screen`, `type ListenLink`, `getWorks(): Work[]`, `getWork(slug): Work | undefined`, `buildWorks(songs, apps): Work[]`
- **`src/routes/*` 와 `src/components/*` 는 한 줄도 바뀌지 않는다.** 바뀌었다면 범위를 벗어난 것이다

- [ ] **Step 1: 테스트를 먼저 고친다 (실패해야 한다)**

`src/lib/works.test.ts` 를 통째로 교체한다:

```ts
import { buildWorks } from "./works";
import type { AppContent, SongContent } from "./content-types";

const song = (over: Partial<SongContent> = {}): SongContent => ({
  id: "s", slug: "consolation", title: "위로", year: 2024, note: "C4",
  sound: null, cover: null, body: "본문 C", listen: [], featured: true,
  sortOrder: 0, ...over,
});

const app = (over: Partial<AppContent> = {}): AppContent => ({
  id: "a", slug: "noire", title: "NOIRE", year: 2026, note: "E4",
  cover: null, body: "본문 N", screens: [], links: [], featured: true,
  sortOrder: 0, ...over,
});

test("곡과 앱을 한 배열로 합친다", () => {
  const works = buildWorks([song()], [app()]);
  expect(works.map((w) => w.slug).sort()).toEqual(["consolation", "noire"]);
});

test("어느 테이블에서 왔는지가 kind 가 된다", () => {
  const works = buildWorks([song()], [app()]);
  expect(works.find((w) => w.slug === "consolation")!.kind).toBe("music");
  expect(works.find((w) => w.slug === "noire")!.kind).toBe("app");
});

test("음 높이 오름차순으로 정렬한다 (왼쪽이 낮은음)", () => {
  const works = buildWorks([song({ note: "C4" })], [app({ note: "E4" })]);
  expect(works.map((w) => w.slug)).toEqual(["consolation", "noire"]);
});

test("음악과 앱이 좌우로 갈라지지 않는다", () => {
  const kinds = buildWorks(
    [song({ slug: "b", note: "D4" })],
    [app({ slug: "a", note: "C4" }), app({ slug: "c", note: "E4" })],
  ).map((w) => w.kind);
  expect(kinds).toEqual(["app", "music", "app"]);
});

test("null 인 cover·sound 는 undefined 가 된다 — 기존 화면 코드가 그렇게 읽는다", () => {
  const works = buildWorks([song({ cover: null, sound: null })], []);
  expect(works[0].cover).toBeUndefined();
  expect(works[0].sound).toBeUndefined();
});

test("값이 있으면 그대로 싣는다", () => {
  const works = buildWorks(
    [song({ cover: "/c.png", sound: "/audio/x.mp3" })],
    [],
  );
  expect(works[0].cover).toBe("/c.png");
  expect(works[0].sound).toBe("/audio/x.mp3");
});

test("앱의 screens 를 캡션째로 옮긴다", () => {
  const works = buildWorks([], [
    app({ screens: [{ src: "/a.png", caption: "로그인" }, { src: "/b.png", caption: "" }] }),
  ]);
  expect(works[0].screens).toEqual([
    { src: "/a.png", caption: "로그인" },
    { src: "/b.png", caption: "" },
  ]);
});

test("곡의 listen 을 옮긴다", () => {
  const works = buildWorks(
    [song({ listen: [{ label: "Spotify", url: "https://sp.example/a" }] })],
    [],
  );
  expect(works[0].listen).toEqual([{ label: "Spotify", url: "https://sp.example/a" }]);
});

test("앱은 listen 대신 links 를 쓴다", () => {
  const works = buildWorks([], [
    app({ links: [{ label: "App Store", url: "https://as.example/a" }] }),
  ]);
  expect(works[0].listen).toEqual([{ label: "App Store", url: "https://as.example/a" }]);
});

test("음이 없는 항목은 건반이 될 수 없으므로 제외된다", () => {
  const works = buildWorks([song({ note: null })], [app()]);
  expect(works.map((w) => w.slug)).toEqual(["noire"]);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npx vitest run src/lib/works.test.ts`
Expected: FAIL — `buildWorks` 가 인자 두 개를 받지 않는다는 타입/런타임 오류

- [ ] **Step 3: works.ts 를 다시 쓴다**

`src/lib/works.ts` 를 통째로 교체한다:

```ts
import { noteToFrequency } from "./note";
import type { AppContent, SongContent } from "./content-types";
import songsJson from "../content/songs.json";
import appsJson from "../content/apps.json";

export type WorkKind = "music" | "app";

export type Screen = { src: string; caption: string };
export type ListenLink = { label: string; url: string };

export type Work = {
  slug: string;
  title: string;
  kind: WorkKind;
  note: string;
  sound?: string;
  year: number;
  cover?: string;
  screens: Screen[];
  listen: ListenLink[];
  body: string;
};

const orUndefined = (value: string | null): string | undefined =>
  value === null ? undefined : value;

export function buildWorks(songs: SongContent[], apps: AppContent[]): Work[] {
  const works: Work[] = [
    ...songs.map((s) => ({
      slug: s.slug,
      title: s.title,
      kind: "music" as const,
      note: s.note ?? "",
      sound: orUndefined(s.sound),
      year: s.year,
      cover: orUndefined(s.cover),
      screens: [],
      listen: s.listen,
      body: s.body,
    })),
    ...apps.map((a) => ({
      slug: a.slug,
      title: a.title,
      kind: "app" as const,
      note: a.note ?? "",
      sound: undefined,
      year: a.year,
      cover: orUndefined(a.cover),
      screens: a.screens,
      // 앱의 바깥 링크는 곡의 '듣기'와 자리가 같다. 화면 코드가 하나만 알면 되게 합친다.
      listen: a.links,
      body: a.body,
    })),
  ];

  // 음 높이 오름차순. 왼쪽이 낮은음, 오른쪽이 높은음 — 악기의 순서다.
  // 연도순으로 두면 음악(2024)과 앱(2026)이 좌우로 갈라져 버린다.
  // 두 세계는 섞여 있어야 하므로, 섞이도록 음을 배정하고 음 높이로 정렬한다.
  return works
    .filter((w) => w.note !== "")
    .sort((a, b) => noteToFrequency(a.note) - noteToFrequency(b.note));
}

let cached: Work[] | null = null;

export function getWorks(): Work[] {
  if (!cached) {
    // JSON 임포트의 추론 타입은 파일 내용에 따라 흔들린다(빈 배열이면 never[]).
    // 계약은 content-types.ts 가 쥐고 있고, 실제 모양은 굽는 쪽에서 보장한다.
    cached = buildWorks(
      songsJson as unknown as SongContent[],
      appsJson as unknown as AppContent[],
    );
  }
  return cached;
}

export function getWork(slug: string): Work | undefined {
  return getWorks().find((w) => w.slug === slug);
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npx vitest run src/lib/works.test.ts`
Expected: PASS — 10 tests

- [ ] **Step 5: 마크다운 흔적을 지운다**

```bash
git rm src/lib/frontmatter.ts src/lib/frontmatter.test.ts
git rm src/works/consolation.md src/works/streetlight.md \
       src/works/noire.md src/works/koinon.md src/works/hanilpay.md
```

- [ ] **Step 6: 전체 테스트와 타입 검사를 돌린다**

Run: `npm test`
Expected: PASS — 모든 테스트. 특히 다음이 **반드시** 통과해야 한다:
- `src/routes/Home.test.tsx` 4건 — 건반이 보이고, NOIRE·위로를 눌러 패널이 열리고, `/work/consolation` 링크가 생긴다
- `src/components/Keyboard.test.tsx`
- `src/components/useLetterKeys.test.tsx`
- `src/audio/engine.test.ts`

Run: `npx tsc --noEmit`
Expected: 오류 없음. `frontmatter` 를 참조하는 곳이 남아 있으면 여기서 잡힌다.

- [ ] **Step 7: 빌드가 통과하는지 확인한다**

Run: `npm run build`
Expected: 콘텐츠 6종을 다시 굽고, 타입 검사를 지나고, `dist/` 가 생성된다

- [ ] **Step 8: 눈으로 확인한다 — 이 단계의 통과 기준이다**

Run: `npm run dev`

브라우저에서 확인할 것:
- 건반이 **5개** 보인다
- 왼쪽부터 `noire`(C4) `consolation`(D4) `hanilpay`(E4) `streetlight`(G4) `koinon`(A4) 순이다
- 건반을 누르면 소리가 나고 패널이 열린다
- 상세 페이지 5개가 모두 열리고 **본문이 이전과 똑같다**
- 한일페이 상세에 화면 8장, KOINON 상세에 화면 5장이 보인다
- 위로·가로등 상세에 듣기 링크 4개가 보인다

**하나라도 다르면 이 태스크는 실패다.** 단계 A는 화면을 바꾸지 않는다.

- [ ] **Step 9: 커밋**

```bash
git add -A
git commit -m "콘텐츠 출처를 마크다운에서 DB 로 바꾼다 — 화면은 그대로

works.ts 의 공개 API(getWorks·getWork·Work)는 한 글자도 바꾸지 않는다.
routes/ 와 components/ 는 손대지 않았다. 단계 A 의 통과 기준은
'화면이 지금과 완전히 동일하게 동작한다' 이다.

마크다운 원문은 시드 마이그레이션에 보존되어 있다."
```

---

## 단계 A 완료 판정

전부 초록불이어야 단계 B로 넘어간다.

- [ ] `npm test` 전부 통과
- [ ] `npx tsc --noEmit` 오류 없음
- [ ] `npm run build` 성공
- [ ] 건반 5개, 순서 `noire · consolation · hanilpay · streetlight · koinon`
- [ ] 상세 페이지 5개의 본문이 이전과 글자 단위로 동일
- [ ] `src/routes/` 와 `src/components/` 의 git 디프가 **비어 있음** (`git diff <시작커밋> --stat -- src/routes src/components` → 출력 없음)
- [ ] `information_schema.role_table_grants` 에서 anon 의 원본 테이블 권한이 0행
- [ ] 누출 테스트를 일부러 깨뜨렸을 때 실제로 실패함을 확인했음

---

## 다음

단계 B(두 관 화면)의 계획은 **단계 A가 초록불이 된 뒤에 쓴다.** 지금 쓰면 A에서 실제로 드러난 인터페이스와 어긋난 추측 문서가 된다.

단계 B가 다룰 것 (스펙 §3, §7):
- 라우트 `/music` `/apps` `/music/{credits,live,lp,gear}`
- 홈: 건반을 `featured` 로 한정, 아래 두 관 입구
- 음악관 세로 스택 5섹션 (섹션마다 고유 형식)
- 앱관 카드 격자
- LP 25건을 `visibility='public'` 으로 전환
- 메타 태그 · sitemap 갱신
