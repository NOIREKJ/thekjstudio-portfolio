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
