import {
  assignSlugs, blocksToMarkdown, parseBodyLabels, sheetObjectName,
  slugify, stripLeadingEmoji, toStatus, toVisibility,
} from "./transform";

/* ── 작업 상태 ───────────────────────────────────────────────────────── */

test("단계 이모지를 떼고 코드로 옮긴다", () => {
  expect(toStatus("💡 아이디어")).toBe("idea");
  expect(toStatus("🎹 편곡중")).toBe("arranging");
  expect(toStatus("🎼 악보제작")).toBe("sheet");
  expect(toStatus("🎙️ 녹음·촬영")).toBe("recording");
  expect(toStatus("🚀 완성·배포")).toBe("done");
});

test("이모지가 없어도, 공백이 더 있어도 읽는다", () => {
  expect(toStatus("완성·배포")).toBe("done");
  expect(toStatus("  🚀   완성·배포  ")).toBe("done");
});

/*
  노션에서 옵션 이름에 오타가 하나 나면 그 곡이 사이트에서 사라지거나 엉뚱한
  묶음에 들어간다. 기본값으로 넘기면 아무도 모른다 — 멈추는 편이 낫다.
*/
test("모르는 상태는 기본값으로 넘기지 않고 던진다", () => {
  expect(() => toStatus("완성")).toThrow(/모르는 작업 상태/);
  expect(() => toStatus("")).toThrow();
  expect(() => toStatus(null)).toThrow();
  expect(() => toStatus(undefined)).toThrow();
});

test("stripLeadingEmoji 는 앞쪽 그림문자만 걷어낸다", () => {
  expect(stripLeadingEmoji("🎚️ Key / BPM")).toBe("Key / BPM");
  expect(stripLeadingEmoji("Key / BPM")).toBe("Key / BPM");
});

/* ── 공개 범위 ───────────────────────────────────────────────────────── */

test("공개만 public, 나머지는 전부 private", () => {
  expect(toVisibility("공개")).toBe("public");
  expect(toVisibility("비공개")).toBe("private");
  expect(toVisibility("")).toBe("private");
  expect(toVisibility(null)).toBe("private");
  expect(toVisibility(undefined)).toBe("private");
});

/* ── 슬러그 ──────────────────────────────────────────────────────────── */

test("라틴이 있으면 그걸로 슬러그를 만든다", () => {
  expect(slugify("위로 (Consolation) - Live Ver.", "p1")).toBe("consolation-live-ver");
  expect(slugify("Leap (Piano Solo)", "p2")).toBe("leap-piano-solo");
});

test("한글만 있으면 페이지 id 해시로 간다 — 제목을 고쳐도 링크가 안 바뀐다", () => {
  const a = slugify("감사와 찬양드리며", "page-xyz");
  const b = slugify("감사와 찬양 드리며 (수정)", "page-xyz");
  expect(a).toMatch(/^arr-[0-9a-f]{10}$/);
  expect(b).toBe(a);
});

test("이미 있는 슬러그는 건드리지 않는다 — 공유된 링크가 죽으면 안 된다", () => {
  const got = assignSlugs([
    { pageId: "p1", title: "완전히 다른 제목으로 바꿈", existingSlug: "old-slug" },
  ]);
  expect(got.get("p1")).toBe("old-slug");
});

test("새 슬러그끼리 겹치면 뒤에 번호를 붙인다", () => {
  const got = assignSlugs([
    { pageId: "p1", title: "Leap" },
    { pageId: "p2", title: "Leap" },
    { pageId: "p3", title: "Leap" },
  ]);
  expect([got.get("p1"), got.get("p2"), got.get("p3")]).toEqual(["leap", "leap-2", "leap-3"]);
});

test("새 슬러그가 기존 슬러그와 겹쳐도 비켜간다", () => {
  const got = assignSlugs([
    { pageId: "old", title: "Leap", existingSlug: "leap" },
    { pageId: "new", title: "Leap" },
  ]);
  expect(got.get("new")).toBe("leap-2");
});

/* ── 본문 라벨 ───────────────────────────────────────────────────────── */

const BODY = [
  "- **🎚️ Key / BPM** — A♭ Major · 72 BPM",
  "- **📝 편곡 메모** — 인트로·브릿지 리하모니 확장",
  "- **🎹 편성 & 사용 장비** — Nord Stage 3 · Apollo x8",
  "- **🎼 송폼 & 편곡 포인트** — AABA, 2절부터 스트링",
  "- **🎬 유튜브 / 데모 오디오 링크** — https://youtu.be/abcdefg",
  "- **📝 작업 비하인드** — 하루 만에 끝냈다",
].join("\n");

test("본문 라벨에서 값을 읽는다", () => {
  expect(parseBodyLabels(BODY)).toEqual({
    keyBpm: "A♭ Major · 72 BPM",
    arrangementNote: "인트로·브릿지 리하모니 확장",
    gearSetup: "Nord Stage 3 · Apollo x8",
    songform: "AABA, 2절부터 스트링",
    youtubeUrl: "https://youtu.be/abcdefg",
    behindStory: "하루 만에 끝냈다",
  });
});

/*
  📝 가 두 번 쓰인다(편곡 메모 / 작업 비하인드). 이모지로 가르면 둘이 섞인다.
*/
test("같은 이모지를 쓰는 두 라벨을 글자로 가른다", () => {
  const got = parseBodyLabels("- **📝 작업 비하인드** — 뒷이야기\n- **📝 편곡 메모** — 요약");
  expect(got.behindStory).toBe("뒷이야기");
  expect(got.arrangementNote).toBe("요약");
});

test('"미정" 같은 자리표시는 값이 아니라 빈칸으로 본다', () => {
  const got = parseBodyLabels("- **🎚️ Key / BPM** — 미정\n- **📝 편곡 메모** — -");
  expect(got.keyBpm).toBeNull();
  expect(got.arrangementNote).toBeNull();
});

test("라벨이 없으면 그 값만 null 이고 나머지는 산다", () => {
  const got = parseBodyLabels("- **📝 편곡 메모** — 요약만 있음");
  expect(got.arrangementNote).toBe("요약만 있음");
  expect(got.gearSetup).toBeNull();
  expect(got.keyBpm).toBeNull();
});

test("구분자가 콜론이어도 읽는다", () => {
  expect(parseBodyLabels("🎚️ Key / BPM: 120 BPM").keyBpm).toBe("120 BPM");
});

/* ── 블록 → 마크다운 ─────────────────────────────────────────────────── */

const rt = (s: string) => ({ rich_text: [{ plain_text: s }] });

test("아는 블록만 글로 옮긴다", () => {
  const md = blocksToMarkdown([
    { type: "heading_2", heading_2: rt("편곡 노트") },
    { type: "paragraph", paragraph: rt("본문 한 줄") },
    { type: "bulleted_list_item", bulleted_list_item: rt("피아노") },
    { type: "numbered_list_item", numbered_list_item: rt("인트로") },
    { type: "quote", quote: rt("인용") },
  ]);
  expect(md).toBe("## 편곡 노트\n본문 한 줄\n- 피아노\n1. 인트로\n> 인용");
});

test("모르는 블록은 건너뛴다 — 화면이 안 그리는 걸 글로 남기지 않는다", () => {
  const md = blocksToMarkdown([
    { type: "image", image: {} },
    { type: "paragraph", paragraph: rt("남는 건 이것뿐") },
    { type: "child_database", child_database: {} },
  ]);
  expect(md).toBe("남는 건 이것뿐");
});

test("빈 문단은 버린다", () => {
  expect(blocksToMarkdown([{ type: "paragraph", paragraph: rt("   ") }])).toBe("");
});

test("하위 블록은 들여쓴다", () => {
  const md = blocksToMarkdown([
    {
      type: "bulleted_list_item", bulleted_list_item: rt("상위"), has_children: true,
      children: [{ type: "bulleted_list_item", bulleted_list_item: rt("하위") }],
    },
  ]);
  expect(md).toBe("- 상위\n  - 하위");
});

/* ── 악보 파일 이름 ──────────────────────────────────────────────────── */

test("악보 오브젝트 이름은 슬러그 + 확장자", () => {
  expect(sheetObjectName("consolation", "위로 (스트링).PDF")).toBe("consolation.pdf");
  expect(sheetObjectName("leap", "leap.mid")).toBe("leap.mid");
});

test("확장자를 못 찾으면 pdf 로 본다", () => {
  expect(sheetObjectName("x", "확장자없음")).toBe("x.pdf");
});
