-- 이 행이 어디서 왔는지. 노션 동기화는 source='notion' 인 행만 다룬다 —
-- 이게 없으면 SSD 에서 긁어온 행이 "노션에서 사라진 곡"으로 보여 전부 archived 된다.
alter table public.arrangements
  add column source text not null default 'notion'
    check (source in ('notion', 'ssd'));

-- 원본 파일이 SSD 어디에 있는지. 사람이 다시 찾아갈 때 쓴다.
alter table public.arrangements add column source_path text;

-- 누구 곡인지 (친구들/<이름>). 노션 DB 에는 이 속성이 없어 여기에만 둔다.
alter table public.arrangements add column owner_name text;

comment on column public.arrangements.source is
  'notion = 노션 트래커가 원본. ssd = KJ SSD 4TB 스캔으로 들어온 행(노션에 대응 페이지 없음).';
