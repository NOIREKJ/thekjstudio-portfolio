import { buildWorks } from "./works";

const modules = {
  "/src/works/noire.md": `---\ntitle: "NOIRE"\nkind: app\nnote: E4\nyear: 2026\n---\n본문 N`,
  "/src/works/consolation.md": `---\ntitle: "위로"\nkind: music\nnote: C4\nyear: 2024\n---\n본문 C`,
};

test("파일명에서 slug를 뽑는다", () => {
  const works = buildWorks(modules);
  expect(works.map((w) => w.slug).sort()).toEqual(["consolation", "noire"]);
});

test("연도 내림차순으로 정렬한다", () => {
  expect(buildWorks(modules)[0].slug).toBe("noire");
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

test("필수 필드가 없으면 어느 파일인지 알려주며 실패한다", () => {
  expect(() => buildWorks({ "/src/works/bad.md": `---\ntitle: "X"\n---\n본문` })).toThrow(
    /bad\.md/,
  );
});
