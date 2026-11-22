// 어드민에서 다룰 테이블과 필드 정의 — '사이트에 쓰이는 필드'만 노출한다.
// LP·장비의 재산정보(purchase_price·current_price·market_*·serial_number 등)는
// 의도적으로 제외한다(재산정보는 사이트/웹앱에 두지 않는다는 원칙).

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "date"
  | "visibility"
  | "stringArray" // text[] — 줄바꿈으로 구분
  | "json"; // jsonb — 원본 JSON textarea

export type Field = {
  col: string;
  label: string;
  type: FieldType;
  help?: string;
};

export type TableConfig = {
  key: string; // DB 테이블명
  label: string; // 화면 표기
  titleCol: string; // 목록에서 각 행을 대표할 컬럼
  subtitleCol?: string;
  fields: Field[];
  ownerScoped?: boolean; // false 면 INSERT 시 user_id/household_id 를 붙이지 않음 (기본 true)
  /*
    원본이 이 어드민이 아닌 테이블. 추가·저장·삭제 버튼을 감춘다.

    왜 막는가: 노션이 원본인 테이블을 여기서 고치면 다음 동기화가 그 값을
    조용히 덮는다. "고쳤는데 되돌아갔다"가 가장 알아내기 어려운 고장이라,
    편집 경로를 아예 열지 않는다.
  */
  readOnly?: boolean;
  badge?: { col: string; onValue: unknown; onLabel: string; offLabel: string }; // 기본은 visibility
  orderBy?: { col: string; ascending: boolean }; // 기본은 sort_order 오름차순
};

const commonTail: Field[] = [
  { col: "visibility", label: "공개", type: "visibility", help: "public 이어야 사이트에 나옵니다" },
  { col: "sort_order", label: "정렬 순서", type: "number", help: "작을수록 앞에" },
];

export const TABLES: TableConfig[] = [
  {
    key: "songs",
    label: "곡",
    titleCol: "title",
    subtitleCol: "slug",
    fields: [
      { col: "slug", label: "슬러그", type: "text", help: "URL 에 쓰임 (예: consolation)" },
      { col: "title", label: "제목", type: "text" },
      { col: "year", label: "연도", type: "number" },
      { col: "cover_path", label: "커버 경로", type: "text", help: "/images/... 또는 URL" },
      { col: "sound_path", label: "사운드 경로", type: "text" },
      { col: "body", label: "설명 (한국어)", type: "textarea" },
      { col: "body_en", label: "설명 (English)", type: "textarea" },
      { col: "listen", label: "듣기 링크", type: "json", help: '[{"label":"Spotify","url":"..."}]' },
      { col: "featured", label: "대표작", type: "boolean" },
      ...commonTail,
    ],
  },
  {
    key: "apps",
    label: "앱",
    titleCol: "title",
    subtitleCol: "slug",
    fields: [
      { col: "slug", label: "슬러그", type: "text" },
      { col: "title", label: "제목", type: "text" },
      { col: "year", label: "연도", type: "number" },
      { col: "cover_path", label: "커버 경로", type: "text" },
      { col: "body", label: "설명 (한국어)", type: "textarea" },
      { col: "body_en", label: "설명 (English)", type: "textarea" },
      { col: "screens", label: "스크린샷", type: "json", help: '[{"src":"/images/...","caption":"..."}]' },
      { col: "links", label: "링크", type: "json", help: '[{"label":"App Store","url":"..."}]' },
      { col: "featured", label: "대표작", type: "boolean" },
      ...commonTail,
    ],
  },
  {
    key: "credits",
    label: "크레딧",
    titleCol: "work_title",
    subtitleCol: "artist",
    fields: [
      { col: "work_title", label: "작품명", type: "text" },
      { col: "artist", label: "아티스트", type: "text" },
      { col: "album", label: "앨범", type: "text" },
      { col: "roles", label: "역할", type: "stringArray", help: "한 줄에 하나 (예: 편곡 / 건반)" },
      { col: "year", label: "연도", type: "number" },
      { col: "url", label: "링크", type: "text" },
      ...commonTail,
    ],
  },
  {
    key: "performances",
    label: "공연",
    titleCol: "title",
    subtitleCol: "venue",
    fields: [
      { col: "title", label: "공연명", type: "text" },
      { col: "venue", label: "장소", type: "text" },
      { col: "date", label: "날짜", type: "date" },
      { col: "poster_path", label: "포스터 경로", type: "text" },
      { col: "role", label: "역할", type: "text" },
      { col: "url", label: "링크", type: "text" },
      ...commonTail,
    ],
  },
  {
    key: "rv_records",
    label: "LP",
    titleCol: "title",
    subtitleCol: "artist",
    fields: [
      { col: "artist", label: "아티스트", type: "text" },
      { col: "title", label: "제목", type: "text" },
      { col: "label", label: "레이블", type: "text" },
      { col: "catalog_no", label: "카탈로그", type: "text" },
      { col: "release_year", label: "발매연도", type: "number" },
      { col: "country", label: "국가", type: "text" },
      { col: "genre", label: "장르", type: "text" },
      { col: "format", label: "포맷", type: "text", help: '예: 12"' },
      { col: "speed", label: "속도", type: "text", help: "예: 33" },
      { col: "image_path", label: "커버 URL", type: "text" },
      { col: "apple_music_url", label: "Apple Music URL", type: "text" },
      ...commonTail,
    ],
  },
  {
    key: "rv_items",
    label: "장비",
    titleCol: "name",
    subtitleCol: "category",
    fields: [
      { col: "name", label: "이름", type: "text" },
      { col: "category", label: "분류", type: "text" },
      { col: "image_path", label: "이미지 URL", type: "text" },
      { col: "placement", label: "배치", type: "text" },
      { col: "rack_u", label: "랙 U", type: "number" },
      { col: "rack_mounted", label: "랙 마운트", type: "boolean" },
      ...commonTail,
    ],
  },
  {
    key: "arrangements",
    label: "라이브 편곡",
    titleCol: "title",
    subtitleCol: "slug",
    readOnly: true, // 원본은 노션 트래커다 — 아래 '노션 주소'로 가서 고친다
    fields: [
      { col: "notion_url", label: "노션 주소", type: "text", help: "여기서 고치지 말고 이 주소의 노션 페이지에서 고칩니다" },
      { col: "slug", label: "슬러그", type: "text" },
      { col: "title", label: "곡명", type: "text" },
      { col: "original_artist", label: "원곡 / 아티스트", type: "text" },
      { col: "status", label: "작업 상태", type: "text", help: "idea · arranging · sheet · recording · done" },
      { col: "genre", label: "장르·구분", type: "text" },
      { col: "key_bpm", label: "Key / BPM", type: "text" },
      { col: "arrangement_note", label: "편곡 메모", type: "textarea" },
      { col: "sheet_url", label: "악보 URL", type: "text" },
      { col: "purchase_url", label: "Patreon / 판매 링크", type: "text" },
      { col: "youtube_url", label: "유튜브", type: "text" },
      { col: "owner_name", label: "누구 곡", type: "text", help: "친구들/<이름> 에서 온 값" },
      { col: "source", label: "출처", type: "text", help: "notion = 트래커 원본 · ssd = SSD 스캔" },
      ...commonTail,
    ],
  },
  {
    key: "inquiries",
    label: "문의",
    titleCol: "contact",
    subtitleCol: "type",
    ownerScoped: false,
    /*
      뱃지는 '처리완료' 가 아니라 **손이 필요한 것**을 띄운다. 목록을 열었을 때
      알아야 하는 건 끝난 게 무엇인지가 아니라 아직 답을 안 한 게 무엇인지다.
    */
    badge: { col: "stage", onValue: "new", onLabel: "미응답", offLabel: "진행 중" },
    orderBy: { col: "created_at", ascending: false },
    fields: [
      { col: "product", label: "제품", type: "text", help: "koinon · music · other" },
      { col: "type", label: "유형", type: "text", help: "commission · lesson · other" },
      { col: "name", label: "이름", type: "text" },
      { col: "contact", label: "연락처", type: "text" },
      { col: "message", label: "내용", type: "textarea" },
      {
        col: "stage",
        label: "단계",
        type: "text",
        help: "new · contacted · talking · won · lost — new 로 3일 넘기면 알림이 온다",
      },
      { col: "source", label: "유입", type: "text", help: "어느 화면에서 왔는지" },
      { col: "payload", label: "항목", type: "json", help: "제품별 질문 답변" },
    ],
  },
];
