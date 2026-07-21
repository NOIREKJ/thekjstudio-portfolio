import { parseFrontmatter } from "./frontmatter";

test("frontmatter와 본문을 분리한다", () => {
  const raw = `---
title: "위로 (Consolation)"
kind: music
year: 2024
---
첫 문단입니다.`;
  const { data, body } = parseFrontmatter(raw);
  expect(data.title).toBe("위로 (Consolation)");
  expect(data.kind).toBe("music");
  expect(data.year).toBe(2024);
  expect(body).toBe("첫 문단입니다.");
});

test("따옴표는 벗기고 값 안의 콜론은 보존한다", () => {
  const { data } = parseFrontmatter(`---\ntitle: "NOIRE: 개인 비서"\n---\n`);
  expect(data.title).toBe("NOIRE: 개인 비서");
});

test("frontmatter가 없으면 전체가 본문이다", () => {
  const { data, body } = parseFrontmatter("그냥 글");
  expect(data).toEqual({});
  expect(body).toBe("그냥 글");
});

test("빈 줄과 주석 줄은 무시한다", () => {
  const { data } = parseFrontmatter(`---\n\n# 주석\nkind: app\n---\n본문`);
  expect(data).toEqual({ kind: "app" });
});
