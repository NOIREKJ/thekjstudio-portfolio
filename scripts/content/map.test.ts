import { mapApp, mapGear, mapLp, mapSong } from "./map";

test("snake_case 컬럼을 화면이 쓰는 이름으로 옮긴다", () => {
  const song = mapSong({
    id: "s1", slug: "consolation", title: "위로", year: 2024, note: "D4",
    sound_path: null, cover_path: "/images/a.png", body: "본문",
    listen: [{ label: "Spotify", url: "https://sp.example/a" }],
    featured: true, sort_order: 10,
  });
  expect(song).toEqual({
    id: "s1", slug: "consolation", title: "위로", year: 2024, note: "D4",
    sound: null, cover: "/images/a.png", body: "본문",
    listen: [{ label: "Spotify", url: "https://sp.example/a" }],
    featured: true, sortOrder: 10,
  });
});

test("jsonb 가 null 로 와도 빈 배열이 된다", () => {
  const app = mapApp({
    id: "a1", slug: "noire", title: "NOIRE", year: 2026, note: "C4",
    cover_path: null, body: "본문", screens: null, links: null,
    featured: false, sort_order: 0,
  });
  expect(app.screens).toEqual([]);
  expect(app.links).toEqual([]);
});

test("LP 는 재산 정보를 담을 자리가 없다", () => {
  const lp = mapLp({
    id: "l1", artist: "Bill Evans", title: "Waltz for Debby", label: "Riverside",
    catalog_no: "RLP-399", release_year: 1962, country: "US", genre: "Jazz",
    format: '12"', speed: "33", cover: "https://x.example/c.jpg",
    apple_music_url: null, sort_order: 0,
  });
  expect(Object.keys(lp).sort()).toEqual([
    "appleMusicUrl", "artist", "catalogNo", "country", "cover", "format",
    "genre", "id", "label", "releaseYear", "sortOrder", "speed", "title",
  ]);
});

test("장비는 이름과 분류만 나온다", () => {
  const gear = mapGear({ id: "g1", name: "Genelec 8030", category: "모니터", sort_order: 0 });
  expect(gear).toEqual({ id: "g1", name: "Genelec 8030", category: "모니터", sortOrder: 0 });
});
