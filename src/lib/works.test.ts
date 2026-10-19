import { buildWorks, selectFeatured } from "./works";
import type { AppContent, SongContent } from "./content-types";

const song = (over: Partial<SongContent> = {}): SongContent => ({
  id: "s", slug: "consolation", title: "위로", year: 2024, note: "C4",
  sound: null, cover: null, body: "본문 C", bodyEn: null, listen: [], featured: true,
  sortOrder: 0, ...over,
});

const app = (over: Partial<AppContent> = {}): AppContent => ({
  id: "a", slug: "noire", title: "NOIRE", year: 2026, note: "E4",
  cover: null, body: "본문 N", bodyEn: null, screens: [], links: [], featured: true,
  sortOrder: 0, ...over,
});

test("곡과 앱을 한 배열로 합친다", () => {
  const works = buildWorks([song()], [app()]);
  expect(works.map((w) => w.slug).sort()).toEqual(["consolation", "noire"]);
});

test("어느 테이블에서 왔는지가 kind 가 된다", () => {
  const works = buildWorks([song()], [app()]);
  expect(works.find((w) => w.slug === "consolation")!.kind).toBe("music");
  expect(works.find((w) => w.slug === "noire")!.kind).toBe("app");
});

test("sort_order 오름차순으로 정렬한다", () => {
  const works = buildWorks(
    [song({ slug: "later", sortOrder: 20 })],
    [app({ slug: "earlier", sortOrder: 10 })],
  );
  expect(works.map((w) => w.slug)).toEqual(["earlier", "later"]);
});

test("sort_order 가 같으면 최신 연도가 먼저", () => {
  const works = buildWorks(
    [song({ slug: "old", year: 2020, sortOrder: 0 })],
    [app({ slug: "new", year: 2026, sortOrder: 0 })],
  );
  expect(works.map((w) => w.slug)).toEqual(["new", "old"]);
});

test("null 인 cover·sound 는 undefined 가 된다 — 기존 화면 코드가 그렇게 읽는다", () => {
  const works = buildWorks([song({ cover: null, sound: null })], []);
  expect(works[0].cover).toBeUndefined();
  expect(works[0].sound).toBeUndefined();
});

test("값이 있으면 그대로 싣는다", () => {
  const works = buildWorks(
    [song({ cover: "/c.png", sound: "/audio/x.mp3" })],
    [],
  );
  expect(works[0].cover).toBe("/c.png");
  expect(works[0].sound).toBe("/audio/x.mp3");
});

test("앱의 screens 를 캡션째로 옮긴다", () => {
  const works = buildWorks([], [
    app({ screens: [{ src: "/a.png", caption: "로그인" }, { src: "/b.png", caption: "" }] }),
  ]);
  expect(works[0].screens).toEqual([
    { src: "/a.png", caption: "로그인" },
    { src: "/b.png", caption: "" },
  ]);
});

test("곡의 listen 을 옮긴다", () => {
  const works = buildWorks(
    [song({ listen: [{ label: "Spotify", url: "https://sp.example/a" }] })],
    [],
  );
  expect(works[0].listen).toEqual([{ label: "Spotify", url: "https://sp.example/a" }]);
});

test("앱은 listen 대신 links 를 쓴다", () => {
  const works = buildWorks([], [
    app({ links: [{ label: "App Store", url: "https://as.example/a" }] }),
  ]);
  expect(works[0].listen).toEqual([{ label: "App Store", url: "https://as.example/a" }]);
});

test("featured 를 그대로 싣는다 — 홈이 대표작을 고르는 근거다", () => {
  const works = buildWorks(
    [song({ slug: "on", featured: true })],
    [app({ slug: "off", featured: false })],
  );
  expect(works.find((w) => w.slug === "on")!.featured).toBe(true);
  expect(works.find((w) => w.slug === "off")!.featured).toBe(false);
});

test("대표작은 featured 만 고르고 편집 순서를 지킨다", () => {
  const works = buildWorks(
    [song({ slug: "second", featured: true, sortOrder: 20 })],
    [
      app({ slug: "first", featured: true, sortOrder: 10 }),
      app({ slug: "hidden", featured: false, sortOrder: 15 }),
    ],
  );
  expect(selectFeatured(works).map((w) => w.slug)).toEqual(["first", "second"]);
});

test("대표작이 상한을 넘으면 앞에서 자른다 — 홈이 /work 를 복제하지 않게", () => {
  const many = Array.from({ length: 9 }, (_, i) =>
    app({ slug: `a${i}`, featured: true, sortOrder: i }),
  );
  expect(selectFeatured(buildWorks([], many), 4).map((w) => w.slug))
    .toEqual(["a0", "a1", "a2", "a3"]);
});

test("하나도 안 켜져 있으면 빈 배열 — 홈은 그 구역을 아예 그리지 않는다", () => {
  const works = buildWorks([song({ featured: false })], [app({ featured: false })]);
  expect(selectFeatured(works)).toEqual([]);
});

test("영어 본문이 있으면 bodyEn 으로 싣고, 없으면 undefined", () => {
  const works = buildWorks(
    [song({ slug: "hasEn", bodyEn: "English body" })],
    [app({ slug: "noEn", bodyEn: null })],
  );
  expect(works.find((w) => w.slug === "hasEn")!.bodyEn).toBe("English body");
  expect(works.find((w) => w.slug === "noEn")!.bodyEn).toBeUndefined();
});
