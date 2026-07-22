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
     E'깊은 밤, 혼자라고 느껴지는 이들에게 전하는 포옹 같은 발라드입니다.\n\n' ||
     E'살다 보면 아무 이유 없이 어둠에 잠기거나, 지친 하루 끝에 철저히 혼자라고 느껴지는 순간이 있습니다. 그럴 때 "힘내"라는 말 대신 "맘껏 울어도 돼, 내가 곁에 있을게"라는 말을 전하고 싶었습니다.\n\n' ||
     E'서정적인 피아노 선율과 감성적인 보컬 라인 위에, 혼자가 아니라는 안도감을 담았습니다.\n\n' ||
     E'프로듀스·작곡·편곡 — 김준\n작사 — 김준, 양한솔\n노래 — 최병준\n믹싱·마스터링 — 찬뮤직 (CHAN MUSIC Ent.)',
     '[{"label":"Spotify","url":"https://open.spotify.com/user/31waehtdbctb5mqpag7pmrmnmhte"},
       {"label":"Apple Music","url":"https://music.apple.com/profile/K_Joon_P"},
       {"label":"YouTube","url":"https://www.youtube.com/@K_Joon_P"},
       {"label":"SoundCloud","url":"https://on.soundcloud.com/5UnKPuPovp5dgfz96"}]'::jsonb,
     true),
    (owner_user, owner_house, 'public', 20, 'streetlight', '가로등 (Streetlight)', 2024, 'G4',
     '/images/projects/noire/horizontal-kj-02.png',
     E'지친 하루 끝, 언제나 같은 자리에서 길을 비추는 가로등 같은 발라드입니다.\n\n' ||
     E'어두운 밤길을 걷다 문득 받은 작은 위로에서 시작한 곡입니다. 가로등은 아무 말 없이 곁을 지키는 존재처럼 늘 그 자리에 서 있습니다. 그 따뜻한 빛을 잔잔한 피아노와 새벽 공기 같은 사운드로 옮겼습니다.\n\n' ||
     E'외롭고 흔들리는 마음이 천천히 위로받는 과정을 담았습니다. 듣는 사람도 각자의 밤에서 작은 쉼을 얻기를 바랍니다.\n\n' ||
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
     E'자산, 시간, 루틴 — 중요한 것들을 한자리에 두는 개인 비서 앱입니다.\n\n' ||
     E'흩어져 있는 것들은 관리 대상이 아니라 불안의 재료가 됩니다. NOIRE는 그것들을 하나의 조용한 공간에 모읍니다.\n\n' ||
     E'미니멀한 다크 인터페이스를 골랐습니다. 도구는 사라지고 중요한 것만 남게 하기 위해서입니다.\n\n' ||
     E'현재 개발 중입니다.',
     '[]'::jsonb, true),
    (owner_user, owner_house, 'public', 20, 'hanilpay', '한일페이 (HANIL Pay)', 2026, 'E4',
     '/images/projects/hanil-pay/hanilpay.png',
     E'현금이나 카드 없이, 스마트폰 하나로 교회 안 카페와 매점을 이용하는 한일교회 전용 간편결제 서비스입니다.\n\n' ||
     E'성도 쪽은 단순합니다. 로그인하고, 결제하고, 끝. 사용처는 지도에서 확인하고, 내역은 앱에서 바로 봅니다.\n\n' ||
     E'보이지 않는 쪽이 이 프로젝트의 절반입니다. 회원과 충전을 관리하고, 가맹점을 등록하고, 매출을 정산하는 관리자 시스템까지 — 결제 인프라 전체를 직접 만들었습니다.\n\n' ||
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
     E'예배, 소통, 신앙 관리를 하나로 모은 한일교회 통합 iOS 네이티브 앱입니다.\n\n' ||
     E'실시간 예배 스트리밍과 VOD, 스마트 교인 요람, 교회 캘린더와 행정, 마이페이지 — 흩어져 있던 것들이 한 앱 안에서 유기적으로 연결됩니다.\n\n' ||
     E'이름은 ''코이노니아(교제)''에서 왔습니다. 기능이 많아질수록 화면은 단순해져야 한다고 믿고, 남녀노소 누구나 헤매지 않도록 절제해서 설계했습니다.\n\n' ||
     E'한일페이와 이어져 결제까지 한 흐름으로 연결됩니다.',
     '[{"src":"/images/projects/hanil-church/home-screen1.png","caption":"메인 대시보드"},
       {"src":"/images/projects/hanil-church/home-screen2.png","caption":"실시간 예배 & VOD"},
       {"src":"/images/projects/hanil-church/home-screen3.png","caption":"스마트 교인 요람"},
       {"src":"/images/projects/hanil-church/home-screen4.png","caption":"교회 캘린더"},
       {"src":"/images/projects/hanil-church/home-screen5.png","caption":"마이페이지"}]'::jsonb,
     true);
end $$;
