import raw from "../content/credits.json";

export type Credit = {
  id: string;
  artist: string;
  workTitle: string;
  album: string | null;
  roles: string[];
  year: number | null;
  url: string | null;
  sortOrder: number;
};

// 명시 필드 화이트리스트(spread 금지) — content-types 의 계약만 담는다.
export function getCredits(): Credit[] {
  return (raw as Credit[])
    .map((r) => ({
      id: r.id,
      artist: r.artist,
      workTitle: r.workTitle,
      album: r.album ?? null,
      roles: Array.isArray(r.roles) ? r.roles : [],
      year: r.year ?? null,
      url: r.url ?? null,
      sortOrder: r.sortOrder ?? 0,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
