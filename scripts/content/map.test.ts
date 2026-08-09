import { mapApp, mapCredit, mapGear, mapLp, mapPerformance, mapSong } from "./map";

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

test("장비는 이름·분류·랙 배치(rackU·rackMounted)를 담고 재산정보는 없다", () => {
  const gear = mapGear({
    id: "g1", name: "Genelec 8030", category: "모니터", sort_order: 0,
    rack_u: 2, rack_mounted: true,
  });
  expect(gear).toEqual({
    id: "g1", name: "Genelec 8030", category: "모니터", sortOrder: 0,
    rackU: 2, rackMounted: true,
  });
});

test("장비: rack_u 가 없으면 rackU=null, rackMounted=false", () => {
  const gear = mapGear({ id: "g2", name: "MacBook", category: "컴퓨터/Mac", sort_order: 1 });
  expect(gear.rackU).toBeNull();
  expect(gear.rackMounted).toBe(false);
});

test("크레딧: work_title 이 workTitle 로, roles 배열이 그대로 옮겨진다", () => {
  const credit = mapCredit({
    id: "c1", artist: "김준", work_title: "가로등", album: "위로 EP",
    roles: ["작곡", "편곡"], year: 2023, url: "https://example.com/c1",
    sort_order: 3,
  });
  expect(credit).toEqual({
    id: "c1", artist: "김준", workTitle: "가로등", album: "위로 EP",
    roles: ["작곡", "편곡"], year: 2023, url: "https://example.com/c1",
    sortOrder: 3,
  });
});

test("크레딧: roles 가 배열이 아니면 빈 배열이 되고, nullable 필드는 null 이 유지된다", () => {
  const credit = mapCredit({
    id: "c2", artist: "김준", work_title: "무제", album: null,
    roles: null, year: null, url: null, sort_order: 0,
  });
  expect(credit.roles).toEqual([]);
  expect(credit.album).toBeNull();
  expect(credit.year).toBeNull();
  expect(credit.url).toBeNull();
  expect(Object.keys(credit).sort()).toEqual([
    "album", "artist", "id", "roles", "sortOrder", "url", "workTitle", "year",
  ]);
});

test("공연: poster_path 가 poster 로, venue/date/role 은 null 이 유지된다", () => {
  const performance = mapPerformance({
    id: "p1", title: "위로 콘서트", venue: "예술의전당", date: "2024-05-01",
    poster_path: "/images/poster.png", role: "연주", url: "https://example.com/p1",
    sort_order: 1,
  });
  expect(performance).toEqual({
    id: "p1", title: "위로 콘서트", venue: "예술의전당", date: "2024-05-01",
    poster: "/images/poster.png", role: "연주", url: "https://example.com/p1",
    sortOrder: 1,
  });
});

test("공연: venue/date/poster_path/role/url 이 모두 null 이어도 null 이 유지된다", () => {
  const performance = mapPerformance({
    id: "p2", title: "무제 공연", venue: null, date: null,
    poster_path: null, role: null, url: null, sort_order: 0,
  });
  expect(performance.venue).toBeNull();
  expect(performance.date).toBeNull();
  expect(performance.poster).toBeNull();
  expect(performance.role).toBeNull();
  expect(performance.url).toBeNull();
  expect(Object.keys(performance).sort()).toEqual([
    "date", "id", "poster", "role", "sortOrder", "title", "url", "venue",
  ]);
});
