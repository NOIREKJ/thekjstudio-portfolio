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
    key: "studiorack_records",
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
    key: "studiorack_items",
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
];
