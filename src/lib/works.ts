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
  featured: boolean;
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
      featured: s.featured,
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
      featured: a.featured,
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

/*
  홈에 내보낼 대표작. featured 는 DB 의 편집 의도고 /admin 에서 켜고 끈다.

  상한을 두는 이유: 홈의 이 자리는 작업을 '맛보는' 자리이고 목록은 /work 가
  쥔다. 대표작을 전부 켜두면 홈이 /work 를 그대로 복제해 버려서, 스크롤을
  늘리고도 새로 보여주는 게 없다. 그래서 켠 개수가 넘치면 앞에서 자른다 —
  편집 의도(sort_order)가 무엇이 먼저인지 이미 말해주고 있다.

  하나도 안 켜져 있으면 빈 배열을 돌려주고, 홈은 이 구역을 아예 그리지
  않는다. 제목만 남고 내용이 없는 섹션보다 없는 편이 낫다.
*/
export function selectFeatured(works: Work[], limit = 6): Work[] {
  return works.filter((w) => w.featured).slice(0, limit);
}

export function getFeaturedWorks(limit = 6): Work[] {
  return selectFeatured(getWorks(), limit);
}
