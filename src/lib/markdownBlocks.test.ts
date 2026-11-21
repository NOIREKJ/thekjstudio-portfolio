import { parseBlocks } from "./markdownBlocks";

test("비거나 null 이면 블록이 없다", () => {
  expect(parseBlocks(null)).toEqual([]);
  expect(parseBlocks("")).toEqual([]);
  expect(parseBlocks("\n\n   \n")).toEqual([]);
});

test("## 은 h3, ### 이하는 h4 — 페이지 h1 아래 층을 지킨다", () => {
  expect(parseBlocks("## 편곡 노트\n\n### 1절")).toEqual([
    { kind: "heading", level: 3, text: "편곡 노트" },
    { kind: "heading", level: 4, text: "1절" },
  ]);
});

test("빈 줄로 나뉜 문단은 따로 선다", () => {
  expect(parseBlocks("첫 문단\n\n둘째 문단")).toEqual([
    { kind: "paragraph", text: "첫 문단" },
    { kind: "paragraph", text: "둘째 문단" },
  ]);
});

test("문단 안의 줄바꿈은 살린다 — 가사·코드 진행이 한 줄씩이다", () => {
  expect(parseBlocks("Am7\nD9\nGmaj7")).toEqual([
    { kind: "paragraph", text: "Am7\nD9\nGmaj7" },
  ]);
});

test("글머리 목록을 한 묶음으로 모은다", () => {
  expect(parseBlocks("- 피아노\n- 베이스\n* 드럼")).toEqual([
    { kind: "list", ordered: false, items: ["피아노", "베이스", "드럼"] },
  ]);
});

test("번호 목록은 ordered 로", () => {
  expect(parseBlocks("1. 인트로\n2) 벌스")).toEqual([
    { kind: "list", ordered: true, items: ["인트로", "벌스"] },
  ]);
});

test("글머리에서 번호로 바뀌면 다른 목록이다", () => {
  expect(parseBlocks("- 하나\n1. 둘")).toEqual([
    { kind: "list", ordered: false, items: ["하나"] },
    { kind: "list", ordered: true, items: ["둘"] },
  ]);
});

test("인용은 > 를 떼고 모은다", () => {
  expect(parseBlocks("> 첫 줄\n> 둘째 줄")).toEqual([
    { kind: "quote", text: "첫 줄\n둘째 줄" },
  ]);
});

test("소제목이 열려 있던 묶음을 닫는다", () => {
  expect(parseBlocks("- 하나\n## 다음")).toEqual([
    { kind: "list", ordered: false, items: ["하나"] },
    { kind: "heading", level: 3, text: "다음" },
  ]);
});

/*
  아는 모양이 아니면 전부 문단으로 떨어진다. 이미지·HTML·표를 따로 다루지
  않는 것은 의도다 — 렌더 경로를 좁게 둔다. 문단으로 떨어진 글자는 React 가
  이스케이프하므로 그대로 보일 뿐 실행되지 않는다.
*/
test("이미지·HTML·표는 블록으로 인정하지 않고 문단으로 떨어뜨린다", () => {
  expect(parseBlocks("![alt](x.png)")).toEqual([
    { kind: "paragraph", text: "![alt](x.png)" },
  ]);
  expect(parseBlocks("<script>alert(1)</script>")).toEqual([
    { kind: "paragraph", text: "<script>alert(1)</script>" },
  ]);
  expect(parseBlocks("| a | b |")).toEqual([
    { kind: "paragraph", text: "| a | b |" },
  ]);
});

test("윈도 줄바꿈(CRLF)도 같게 다룬다", () => {
  expect(parseBlocks("## 제목\r\n\r\n본문")).toEqual([
    { kind: "heading", level: 3, text: "제목" },
    { kind: "paragraph", text: "본문" },
  ]);
});

test("섞인 본문을 순서대로 쪼갠다", () => {
  expect(parseBlocks("## 편성\n\n- 피아노\n- 스트링\n\n> 2절부터 커진다")).toEqual([
    { kind: "heading", level: 3, text: "편성" },
    { kind: "list", ordered: false, items: ["피아노", "스트링"] },
    { kind: "quote", text: "2절부터 커진다" },
  ]);
});
