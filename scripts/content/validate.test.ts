import { PENTATONIC, validateFeatured } from "./validate";

const ok = (slug: string, note: string | null, featured = true) => ({ slug, note, featured });

test("쓸 수 있는 음은 일곱 개뿐이다", () => {
  expect(PENTATONIC).toEqual(["C4", "D4", "E4", "G4", "A4", "C5", "D5"]);
});

test("일곱 개까지는 통과한다", () => {
  expect(() =>
    validateFeatured(PENTATONIC.map((n, i) => ok(`w${i}`, n))),
  ).not.toThrow();
});

test("여덟 번째를 켜면 실패한다", () => {
  const items = [...PENTATONIC.map((n, i) => ok(`w${i}`, n)), ok("overflow", "F4")];
  expect(() => validateFeatured(items)).toThrow(/7개/);
});

test("음이 겹치면 어느 것끼리 겹치는지 알려주며 실패한다", () => {
  expect(() => validateFeatured([ok("a", "C4"), ok("b", "C4")])).toThrow(/C4/);
});

test("5음 음계 밖의 음은 실패한다", () => {
  expect(() => validateFeatured([ok("a", "F4")])).toThrow(/F4/);
});

test("featured 인데 음이 없으면 실패한다", () => {
  expect(() => validateFeatured([ok("a", null)])).toThrow(/a/);
});

test("featured 가 아니면 음이 없어도 되고 음계 밖이어도 된다", () => {
  expect(() => validateFeatured([ok("a", null, false), ok("b", "F4", false)])).not.toThrow();
});
