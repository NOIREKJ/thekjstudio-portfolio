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
