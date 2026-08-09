import type { Lp } from "./lp";

export type LpSort = "year-desc" | "year-asc" | "artist";

// Discogs 식 다중 장르 문자열의 첫 토큰을 대표 장르로. "Jazz, Post Bop" → "Jazz".
export function primaryGenre(genre: string | null | undefined): string {
  if (!genre) return "기타";
  const first = genre.split(",")[0]?.trim();
  return first || "기타";
}

// 컬렉션에 실제로 있는 대표 장르 목록 — 빈도 내림차순, 동률은 이름 오름차순.
export function availableGenres(lps: Lp[]): string[] {
  const count = new Map<string, number>();
  for (const lp of lps) {
    const g = primaryGenre(lp.genre);
    count.set(g, (count.get(g) ?? 0) + 1);
  }
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([g]) => g);
}

// genre=null 이면 전체. 정렬은 연도/아티스트.
export function filterAndSortLps(lps: Lp[], opts: { genre: string | null; sort: LpSort }): Lp[] {
  const filtered = opts.genre == null ? lps : lps.filter((lp) => primaryGenre(lp.genre) === opts.genre);
  const out = filtered.slice();
  out.sort((a, b) => {
    if (opts.sort === "artist") return a.artist.localeCompare(b.artist);
    const ya = a.releaseYear ?? 0;
    const yb = b.releaseYear ?? 0;
    return opts.sort === "year-asc" ? ya - yb : yb - ya;
  });
  return out;
}
