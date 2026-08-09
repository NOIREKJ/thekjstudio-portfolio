import { primaryGenre, availableGenres, filterAndSortLps } from "./lpFilter";
import type { Lp } from "./lp";

const lp = (id: string, artist: string, genre: string | null, year: number | null): Lp => ({
  id, artist, title: id, label: null, catalogNo: null, releaseYear: year, country: null,
  genre, format: '12"', speed: "33", cover: null, appleMusicUrl: null, sortOrder: 0,
});

test("primaryGenre: 첫 토큰, 빈 값은 기타", () => {
  expect(primaryGenre("Jazz, Post Bop, Modal")).toBe("Jazz");
  expect(primaryGenre("Funk / Soul, Disco")).toBe("Funk / Soul");
  expect(primaryGenre("Pop")).toBe("Pop");
  expect(primaryGenre(null)).toBe("기타");
  expect(primaryGenre("")).toBe("기타");
});

test("availableGenres: 빈도 내림차순", () => {
  const list = [lp("a", "A", "Jazz", 2000), lp("b", "B", "Jazz, X", 2001), lp("c", "C", "Pop", 1999)];
  expect(availableGenres(list)).toEqual(["Jazz", "Pop"]);
});

test("filterAndSortLps: 장르 필터 + 연도 정렬", () => {
  const list = [lp("a", "A", "Jazz", 2000), lp("b", "B", "Pop", 1990), lp("c", "C", "Jazz", 2010)];
  const jazzNew = filterAndSortLps(list, { genre: "Jazz", sort: "year-desc" });
  expect(jazzNew.map((x) => x.id)).toEqual(["c", "a"]);
  const allOld = filterAndSortLps(list, { genre: null, sort: "year-asc" });
  expect(allOld.map((x) => x.id)).toEqual(["b", "a", "c"]);
});

test("filterAndSortLps: 아티스트 정렬", () => {
  const list = [lp("a", "Zorn", "Jazz", 2000), lp("b", "Adderley", "Jazz", 1960)];
  expect(filterAndSortLps(list, { genre: null, sort: "artist" }).map((x) => x.artist)).toEqual(["Adderley", "Zorn"]);
});
