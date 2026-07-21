import { applyMeta } from "./meta";

beforeEach(() => {
  document.head.innerHTML = "";
  document.title = "";
});

test("제목과 설명을 문서에 반영한다", () => {
  applyMeta({ title: "위로 — the KJ Studio", description: "포옹 같은 발라드" });

  expect(document.title).toBe("위로 — the KJ Studio");
  expect(
    document.head.querySelector('meta[name="description"]')?.getAttribute("content"),
  ).toBe("포옹 같은 발라드");
  expect(
    document.head.querySelector('meta[property="og:title"]')?.getAttribute("content"),
  ).toBe("위로 — the KJ Studio");
});

test("같은 태그를 두 번 만들지 않고 값만 바꾼다", () => {
  applyMeta({ title: "첫 번째", description: "설명 1" });
  applyMeta({ title: "두 번째", description: "설명 2" });

  expect(document.head.querySelectorAll('meta[property="og:title"]')).toHaveLength(1);
  expect(
    document.head.querySelector('meta[property="og:title"]')?.getAttribute("content"),
  ).toBe("두 번째");
});

test("이미지를 주면 절대 주소로 올린다", () => {
  applyMeta({
    title: "T",
    description: "D",
    image: "/images/cover.png",
    origin: "https://thekjstudio.example",
  });

  expect(
    document.head.querySelector('meta[property="og:image"]')?.getAttribute("content"),
  ).toBe("https://thekjstudio.example/images/cover.png");
});

test("이미지가 없으면 og:image를 만들지 않는다", () => {
  applyMeta({ title: "T", description: "D" });
  expect(document.head.querySelector('meta[property="og:image"]')).toBeNull();
});
