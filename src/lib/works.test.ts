import { buildWorks } from "./works";

const modules = {
  "/src/works/noire.md": `---\ntitle: "NOIRE"\nkind: app\nnote: E4\nyear: 2026\n---\n본문 N`,
  "/src/works/consolation.md": `---\ntitle: "위로"\nkind: music\nnote: C4\nyear: 2024\n---\n본문 C`,
};

test("파일명에서 slug를 뽑는다", () => {
  const works = buildWorks(modules);
  expect(works.map((w) => w.slug).sort()).toEqual(["consolation", "noire"]);
});

test("음 높이 오름차순으로 정렬한다 (왼쪽이 낮은음)", () => {
  expect(buildWorks(modules).map((w) => w.slug)).toEqual(["consolation", "noire"]);
});

test("음악과 앱이 좌우로 갈라지지 않는다", () => {
  const kinds = buildWorks({
    "/src/works/a.md": `---\ntitle: "A"\nkind: app\nnote: C4\nyear: 2026\n---\n본문`,
    "/src/works/b.md": `---\ntitle: "B"\nkind: music\nnote: D4\nyear: 2024\n---\n본문`,
    "/src/works/c.md": `---\ntitle: "C"\nkind: app\nnote: E4\nyear: 2026\n---\n본문`,
  }).map((w) => w.kind);
  expect(kinds).toEqual(["app", "music", "app"]);
});

test("frontmatter를 타입이 있는 필드로 옮긴다", () => {
  const noire = buildWorks(modules).find((w) => w.slug === "noire")!;
  expect(noire.title).toBe("NOIRE");
  expect(noire.kind).toBe("app");
  expect(noire.note).toBe("E4");
  expect(noire.year).toBe(2026);
  expect(noire.body).toBe("본문 N");
  expect(noire.sound).toBeUndefined();
});

test("sound가 있으면 그대로 싣는다", () => {
  const works = buildWorks({
    "/src/works/x.md": `---\ntitle: "X"\nkind: music\nnote: C4\nyear: 2024\nsound: /audio/x.mp3\n---\n본문`,
  });
  expect(works[0].sound).toBe("/audio/x.mp3");
});

test("cover와 캡션 달린 screens를 읽는다", () => {
  const works = buildWorks({
    "/src/works/x.md": `---\ntitle: "X"\nkind: app\nnote: C4\nyear: 2026\ncover: /c.png\nscreens: /a.png|로그인, /b.png|결제 홈\n---\n본문`,
  });
  expect(works[0].cover).toBe("/c.png");
  expect(works[0].screens).toEqual([
    { src: "/a.png", caption: "로그인" },
    { src: "/b.png", caption: "결제 홈" },
  ]);
});

test("캡션이 없는 screen은 빈 캡션이 된다", () => {
  const works = buildWorks({
    "/src/works/x.md": `---\ntitle: "X"\nkind: app\nnote: C4\nyear: 2026\nscreens: /a.png\n---\n본문`,
  });
  expect(works[0].screens).toEqual([{ src: "/a.png", caption: "" }]);
});

test("listen은 '이름|주소' 목록이다", () => {
  const works = buildWorks({
    "/src/works/x.md": `---\ntitle: "X"\nkind: music\nnote: C4\nyear: 2024\nlisten: Spotify|https://sp.example/a, YouTube|https://yt.example/b\n---\n본문`,
  });
  expect(works[0].listen).toEqual([
    { label: "Spotify", url: "https://sp.example/a" },
    { label: "YouTube", url: "https://yt.example/b" },
  ]);
});

test("cover·screens가 없으면 비어 있다", () => {
  const works = buildWorks({
    "/src/works/x.md": `---\ntitle: "X"\nkind: music\nnote: C4\nyear: 2024\n---\n본문`,
  });
  expect(works[0].cover).toBeUndefined();
  expect(works[0].screens).toEqual([]);
});

test("필수 필드가 없으면 어느 파일인지 알려주며 실패한다", () => {
  expect(() => buildWorks({ "/src/works/bad.md": `---\ntitle: "X"\n---\n본문` })).toThrow(
    /bad\.md/,
  );
});
