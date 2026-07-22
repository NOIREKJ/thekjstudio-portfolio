import { buildWorks } from "./works";
import type { AppContent, SongContent } from "./content-types";

const song = (over: Partial<SongContent> = {}): SongContent => ({
  id: "s", slug: "consolation", title: "위로", year: 2024, note: "C4",
  sound: null, cover: null, body: "본문 C", listen: [], featured: true,
  sortOrder: 0, ...over,
});

const app = (over: Partial<AppContent> = {}): AppContent => ({
  id: "a", slug: "noire", title: "NOIRE", year: 2026, note: "E4",
  cover: null, body: "본문 N", screens: [], links: [], featured: true,
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

test("음 높이 오름차순으로 정렬한다 (왼쪽이 낮은음)", () => {
  const works = buildWorks([song({ note: "C4" })], [app({ note: "E4" })]);
  expect(works.map((w) => w.slug)).toEqual(["consolation", "noire"]);
});

test("음악과 앱이 좌우로 갈라지지 않는다", () => {
  const kinds = buildWorks(
    [song({ slug: "b", note: "D4" })],
    [app({ slug: "a", note: "C4" }), app({ slug: "c", note: "E4" })],
  ).map((w) => w.kind);
  expect(kinds).toEqual(["app", "music", "app"]);
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

test("음이 없는 항목은 건반이 될 수 없으므로 제외된다", () => {
  const works = buildWorks([song({ note: null })], [app()]);
  expect(works.map((w) => w.slug)).toEqual(["noire"]);
});
