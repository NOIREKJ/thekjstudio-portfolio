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
