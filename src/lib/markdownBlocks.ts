/*
  노션 본문(마크다운)을 **허용한 블록으로만** 쪼갠다.

  왜 라이브러리를 안 쓰는가: 필요한 건 다섯 가지 블록뿐이고, 범용 파서는
  이미지·HTML·링크까지 받아들여 렌더 경로를 넓힌다. 지금 들어오는 건 사람이
  쓴 텍스트지만, 원본이 노션이라 나중에 무엇이 들어올지 코드가 보장할 수 없다.
  그래서 아는 모양만 통과시키고 나머지는 전부 문단으로 떨어뜨린다.

  인라인 마크업(**굵게**, [링크](...))은 **파싱하지 않는다.** 텍스트는 React 가
  그대로 이스케이프하므로 주입 경로가 없고, 링크를 열어주려면 URL 스킴 검사가
  따라와야 해서 좁혀 둔 경로가 다시 넓어진다. 실제 본문에 링크가 필요해지면
  그때 스킴 화이트리스트와 함께 추가한다.
*/
export type Block =
  | { kind: "heading"; level: 3 | 4; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "quote"; text: string };

const HEADING = /^(#{2,6})\s+(.*)$/;
const BULLET = /^[-*+]\s+(.*)$/;
const ORDERED = /^\d+[.)]\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;

export function parseBlocks(src: string | null): Block[] {
  if (!src) return [];
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];

  // 열려 있는 묶음. 같은 종류가 연속되는 동안 모았다가 끊길 때 닫는다.
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];
  let quote: string[] = [];

  const closeList = () => {
    if (list) blocks.push({ kind: "list", ordered: list.ordered, items: list.items });
    list = null;
  };
  const closePara = () => {
    if (para.length) blocks.push({ kind: "paragraph", text: para.join("\n") });
    para = [];
  };
  const closeQuote = () => {
    if (quote.length) blocks.push({ kind: "quote", text: quote.join("\n") });
    quote = [];
  };
  const closeAll = () => { closeList(); closePara(); closeQuote(); };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) { closeAll(); continue; }

    const heading = HEADING.exec(line);
    if (heading) {
      closeAll();
      // 페이지의 h1 은 곡 제목이다. 본문 소제목은 h3 부터 시작해 층을 지킨다 —
      // ## 과 ### 를 h2/h3 로 두면 제목 바로 아래에 같은 급이 생긴다.
      const level = heading[1].length === 2 ? 3 : 4;
      blocks.push({ kind: "heading", level, text: heading[2].trim() });
      continue;
    }

    const quoted = QUOTE.exec(line);
    if (quoted) {
      closeList(); closePara();
      quote.push(quoted[1]);
      continue;
    }

    const bullet = BULLET.exec(line);
    const ordered = ORDERED.exec(line);
    if (bullet || ordered) {
      closePara(); closeQuote();
      const isOrdered = Boolean(ordered);
      const text = (bullet ? bullet[1] : ordered![1]).trim();
      // 글머리에서 번호로(또는 반대로) 바뀌면 다른 목록이다.
      if (list && list.ordered !== isOrdered) closeList();
      if (!list) list = { ordered: isOrdered, items: [] };
      list.items.push(text);
      continue;
    }

    closeList(); closeQuote();
    para.push(line.trim());
  }

  closeAll();
  return blocks;
}
