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
  sound?: string;
  year: number;
  cover?: string;
  screens: Screen[];
  listen: ListenLink[];
  body: string;
  bodyEn?: string;
  sortOrder: number;
};

const orUndefined = (value: string | null): string | undefined =>
  value === null ? undefined : value;

export function buildWorks(songs: SongContent[], apps: AppContent[]): Work[] {
  const works: Work[] = [
    ...songs.map((s) => ({
      slug: s.slug,
      title: s.title,
      kind: "music" as const,
      sound: orUndefined(s.sound),
      year: s.year,
      cover: orUndefined(s.cover),
      screens: [],
      listen: s.listen,
      body: s.body,
      bodyEn: orUndefined(s.bodyEn),
      sortOrder: s.sortOrder,
    })),
    ...apps.map((a) => ({
      slug: a.slug,
      title: a.title,
      kind: "app" as const,
      sound: undefined,
      year: a.year,
      cover: orUndefined(a.cover),
      screens: a.screens,
      // 앱의 바깥 링크는 곡의 '듣기'와 자리가 같다. 화면 코드가 하나만 알면 되게 합친다.
      listen: a.links,
      body: a.body,
      bodyEn: orUndefined(a.bodyEn),
      sortOrder: a.sortOrder,
    })),
  ];

  // 편집 의도대로 sort_order 오름차순. 같으면 최신 연도가 먼저.
  return works.sort((a, b) => a.sortOrder - b.sortOrder || b.year - a.year);
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
