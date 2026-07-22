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
