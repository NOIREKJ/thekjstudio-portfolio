-- arrangement_note 는 공개 뷰에 들어가는 '카드 부제'다. 2026-11-22 SSD 적재 때
-- 거기에 스캔 기록(원본 경로 등)을 넣었는데, 그대로 공개 페이지에 내부 폴더
-- 구조가 찍혔다. 기록은 뷰에 없는 컬럼으로 옮기고 콘텐츠 자리는 비운다.
alter table public.arrangements add column if not exists scan_note text;

comment on column public.arrangements.scan_note is
  '적재·스캔 기록. public_arrangements 뷰에 넣지 말 것 — 내부 경로가 들어 있다.';

update public.arrangements
   set scan_note = arrangement_note,
       arrangement_note = null
 where arrangement_note is not null
   and (arrangement_note like 'SSD 스캔%' or arrangement_note like '노션 트래커 원본%');
