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

/*
  SPA 라 head 가 라우트 사이에 살아남는다. 커버 있는 작업물에서 커버 없는
  작업물로 옮겨가면 앞 페이지의 이미지가 남아 있었다 — twitter:card 는
  summary 로 내려가는데 twitter:image 는 큰 이미지를 가리키는 짝 안 맞는
  상태가 됐다.
*/
test("이미지 없는 라우트로 옮겨가면 앞 페이지의 이미지를 지운다", () => {
  applyMeta({ title: "커버 있음", description: "D", image: "/a.png", origin: "https://x.example" });
  applyMeta({ title: "커버 없음", description: "D" });

  expect(document.head.querySelector('meta[property="og:image"]')).toBeNull();
  expect(document.head.querySelector('meta[name="twitter:image"]')).toBeNull();
  expect(
    document.head.querySelector('meta[name="twitter:card"]')?.getAttribute("content"),
  ).toBe("summary");
});
