import type { ArrangementContent, ArrangementStatus } from "./content-types";
import {
  canSell, filterArrangements, getArrangements, isWip, sortArrangements, youtubeEmbed,
} from "./arrangements";

function make(
  over: Partial<ArrangementContent> & { slug: string; status: ArrangementStatus },
): ArrangementContent {
  return {
    id: over.slug, title: over.slug, originalArtist: null, genre: null,
    keyBpm: null, note: null, sheetUrl: null, purchaseUrl: null, youtubeUrl: null,
    gearSetup: null, songform: null, behindStory: null, body: null,
    notionUrl: null, sortOrder: 0, ...over,
  };
}

const items = [
  make({ slug: "a", status: "idea" }),
  make({ slug: "b", status: "arranging" }),
  make({ slug: "c", status: "sheet" }),
  make({ slug: "d", status: "recording" }),
  make({ slug: "e", status: "done" }),
];

test("작업중 묶음은 done 을 빼고 나머지 네 단계를 모은다", () => {
  expect(filterArrangements(items, "wip").map((a) => a.slug)).toEqual(["a", "b", "c", "d"]);
});

test("완성 묶음은 done 만", () => {
  expect(filterArrangements(items, "done").map((a) => a.slug)).toEqual(["e"]);
});

test("전체는 손대지 않는다", () => {
  expect(filterArrangements(items, "all")).toHaveLength(5);
});

test("두 묶음을 합치면 전체가 된다 — 어느 단계도 사라지지 않는다", () => {
  const wip = filterArrangements(items, "wip").length;
  const done = filterArrangements(items, "done").length;
  expect(wip + done).toBe(items.length);
});

test("isWip 은 done 에만 false", () => {
  const statuses: ArrangementStatus[] = ["idea", "arranging", "sheet", "recording"];
  for (const s of statuses) expect(isWip(s)).toBe(true);
  expect(isWip("done")).toBe(false);
});

/*
  CTA 규칙. 편곡중인 곡에 구매 버튼이 붙으면 아직 못 주는 것을 파는 셈이다.
*/
test("완성이 아니면 링크가 있어도 팔지 않는다", () => {
  const wip = make({ slug: "x", status: "arranging", sheetUrl: "https://e.com/s.pdf" });
  expect(canSell(wip)).toBe(false);
});

test("완성이고 링크가 있으면 판다", () => {
  expect(canSell(make({ slug: "y", status: "done", sheetUrl: "https://e.com/s.pdf" }))).toBe(true);
  expect(canSell(make({ slug: "z", status: "done", purchaseUrl: "https://e.com/p" }))).toBe(true);
});

test("완성이어도 링크가 없으면 CTA 를 달지 않는다", () => {
  expect(canSell(make({ slug: "w", status: "done" }))).toBe(false);
});

test("정렬은 sort_order 오름차순, 같으면 제목 순", () => {
  const unsorted = [
    make({ slug: "late", status: "idea", title: "B", sortOrder: 5 }),
    make({ slug: "tieB", status: "idea", title: "Z", sortOrder: 1 }),
    make({ slug: "tieA", status: "idea", title: "A", sortOrder: 1 }),
  ];
  expect(sortArrangements(unsorted).map((a) => a.slug)).toEqual(["tieA", "tieB", "late"]);
});

test("정렬이 원본 배열을 바꾸지 않는다", () => {
  const input = [
    make({ slug: "b", status: "idea", sortOrder: 2 }),
    make({ slug: "a", status: "idea", sortOrder: 1 }),
  ];
  sortArrangements(input);
  expect(input.map((a) => a.slug)).toEqual(["b", "a"]);
});

/* 유튜브 주소 — 알아볼 수 없으면 null 이어야 섹션이 그려지지 않는다 */
test("유튜브 주소를 nocookie 임베드로 바꾼다", () => {
  const want = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ";
  expect(youtubeEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(want);
  expect(youtubeEmbed("https://youtu.be/dQw4w9WgXcQ")).toBe(want);
  expect(youtubeEmbed("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(want);
});

test("유튜브가 아니거나 비면 null", () => {
  expect(youtubeEmbed(null)).toBeNull();
  expect(youtubeEmbed("")).toBeNull();
  expect(youtubeEmbed("https://vimeo.com/123")).toBeNull();
  expect(youtubeEmbed("그냥 글자")).toBeNull();
  expect(youtubeEmbed("https://www.youtube.com/")).toBeNull();
});

/*
  구운 JSON 자체를 본다. 비공개 곡이 섞여 들어오면 뷰가 깨졌다는 뜻이고,
  그건 화면 코드가 아니라 여기서 잡아야 한다.
*/
test("구운 arrangements.json 의 상태가 모두 아는 값이다", () => {
  const known: ArrangementStatus[] = ["idea", "arranging", "sheet", "recording", "done"];
  for (const a of getArrangements()) {
    expect(known).toContain(a.status);
  }
});

test("구운 arrangements.json 에 slug 가 빠진 곡이 없다 — 상세 링크가 깨진다", () => {
  for (const a of getArrangements()) {
    expect(a.slug).toBeTruthy();
  }
});

test("구운 arrangements.json 의 slug 가 서로 겹치지 않는다", () => {
  const slugs = getArrangements().map((a) => a.slug);
  expect(new Set(slugs).size).toBe(slugs.length);
});
