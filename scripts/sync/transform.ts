/*
  노션 → Supabase 동기화의 '생각하는 부분'. 네트워크를 모른다 — 전부 순수 함수라
  테스트로 묶어 둘 수 있다. 실제 호출은 notion.ts 와 sync-arrangements.ts 가 한다.
*/
import { createHash } from "node:crypto";
import type { ArrangementStatus } from "../../src/lib/content-types";

/* ── 작업 상태 ───────────────────────────────────────────────────────── */

/*
  노션 옵션에는 단계 이모지가 붙어 있다("🚀 완성·배포"). 이모지와 앞뒤 공백을
  떼고 비교한다. 이모지가 바뀌어도(실제로 바뀐 적이 있다) 매핑이 살아남게.
*/
const STATUS_BY_LABEL: Record<string, ArrangementStatus> = {
  "아이디어": "idea",
  "편곡중": "arranging",
  "악보제작": "sheet",
  "녹음·촬영": "recording",
  "완성·배포": "done",
};

export function stripLeadingEmoji(raw: string): string {
  // 맨 앞의 그림문자·변이 선택자·ZWJ 묶음을 걷어낸다. 한글/라틴 앞까지만.
  return raw
    .replace(/^[\p{Extended_Pictographic}‍️⃣\s]+/u, "")
    .trim();
}

export function toStatus(raw: string | null | undefined): ArrangementStatus {
  const label = stripLeadingEmoji(String(raw ?? ""));
  const status = STATUS_BY_LABEL[label];
  if (!status) {
    /*
      조용히 기본값으로 넘기지 않는다. 노션에서 옵션 이름에 오타가 하나 나면
      그 곡이 사이트에서 엉뚱한 묶음에 들어가거나 사라지는데, 신호가 없으면
      아무도 모른다. 동기화를 멈추면 이전 사이트는 그대로 살아 있다.
    */
    throw new Error(
      `모르는 작업 상태 ${JSON.stringify(raw)} — 아는 값: ` +
        Object.keys(STATUS_BY_LABEL).join(" · "),
    );
  }
  return status;
}

/* ── 공개 범위 ───────────────────────────────────────────────────────── */

/** 빈 값은 private. 실수로 공개되는 쪽보다 실수로 숨는 쪽이 낫다. */
export function toVisibility(raw: string | null | undefined): "public" | "private" {
  return stripLeadingEmoji(String(raw ?? "")) === "공개" ? "public" : "private";
}

/* ── 슬러그 ──────────────────────────────────────────────────────────── */

/*
  슬러그는 한 번 정해지면 바뀌면 안 된다 — 공유된 링크가 죽는다. 그래서
  sync 는 **이미 DB 에 있는 행의 슬러그를 그대로 두고**, 새 행에만 이 함수를
  쓴다(아래 assignSlugs 참고).

  한글 제목은 로마자로 옮기지 않고 해시로 간다. 음차 규칙을 코드에 심으면
  규칙이 조금만 바뀌어도 모든 링크가 한꺼번에 흔들린다. 페이지 id 기반이라
  제목을 고쳐도 슬러그는 그대로다.
*/
export function slugify(title: string, pageId: string): string {
  const ascii = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (ascii.length >= 3) return ascii.slice(0, 60);
  return `arr-${createHash("sha1").update(pageId).digest("hex").slice(0, 10)}`;
}

export type SlugInput = { pageId: string; title: string; existingSlug?: string | null };

/**
 * 페이지마다 슬러그를 확정한다. 기존 슬러그가 있으면 건드리지 않고,
 * 새로 만든 것끼리 겹치면 뒤에 -2, -3 을 붙인다.
 */
export function assignSlugs(rows: SlugInput[]): Map<string, string> {
  const out = new Map<string, string>();
  const taken = new Set<string>();
  for (const r of rows) {
    if (r.existingSlug) { out.set(r.pageId, r.existingSlug); taken.add(r.existingSlug); }
  }
  for (const r of rows) {
    if (out.has(r.pageId)) continue;
    const base = slugify(r.title, r.pageId);
    let slug = base;
    for (let n = 2; taken.has(slug); n += 1) slug = `${base}-${n}`;
    taken.add(slug);
    out.set(r.pageId, slug);
  }
  return out;
}

/* ── 본문 라벨 ───────────────────────────────────────────────────────── */

/*
  곡 페이지 본문은 이런 모양이다:

      - **🎚️ Key / BPM** — 미정
      - **📝 편곡 메모** — 인트로·브릿지 리하모니 확장

  라벨로 찾는다. 📝 가 두 번 쓰이므로(편곡 메모 / 작업 비하인드) 이모지가
  아니라 **글자**로 가른다. 라벨이 사라지면 그 값만 null 이 되고 동기화는
  계속한다 — 본문 전체는 body_markdown 에 남으니 데이터가 사라지진 않는다.
*/
export const BODY_LABELS = {
  keyBpm: "Key / BPM",
  arrangementNote: "편곡 메모",
  gearSetup: "편성 & 사용 장비",
  songform: "송폼 & 편곡 포인트",
  youtubeUrl: "유튜브 / 데모 오디오 링크",
  behindStory: "작업 비하인드",
} as const;

export type BodyField = keyof typeof BODY_LABELS;

/*
  "아직 안 정했다"는 표시는 값이 아니다. 화면에 "미정"을 찍으면 정보가 있는
  척이 되므로 비운다.
*/
const PLACEHOLDERS = new Set(["", "-", "—", "–", "미정", "없음", "tbd", "n/a"]);

function cleanValue(raw: string): string | null {
  const v = raw.trim().replace(/^\*+|\*+$/g, "").trim();
  return PLACEHOLDERS.has(v.toLowerCase()) ? null : v || null;
}

/** 한 줄에서 라벨 뒤의 값을 떼어낸다. 구분자는 —, –, -, : 중 무엇이든. */
function valueAfterLabel(line: string, label: string): string | null {
  const at = line.indexOf(label);
  if (at < 0) return null;
  const rest = line.slice(at + label.length);
  const m = /^\s*(?:\*\*)?\s*[—–\-:]\s*(.*)$/.exec(rest);
  return cleanValue(m ? m[1] : rest);
}

export function parseBodyLabels(markdown: string): Record<BodyField, string | null> {
  const out = {
    keyBpm: null, arrangementNote: null, gearSetup: null,
    songform: null, youtubeUrl: null, behindStory: null,
  } as Record<BodyField, string | null>;

  for (const line of markdown.split("\n")) {
    for (const [field, label] of Object.entries(BODY_LABELS) as [BodyField, string][]) {
      if (out[field] !== null) continue;      // 먼저 나온 것을 쓴다
      const v = valueAfterLabel(line, label);
      if (v !== null) out[field] = v;
    }
  }
  return out;
}

/* ── 노션 블록 → 마크다운 ────────────────────────────────────────────── */

type RichText = { plain_text?: string };
type NotionBlock = {
  type: string;
  has_children?: boolean;
  children?: NotionBlock[];
  [key: string]: unknown;
};

function textOf(block: NotionBlock, key: string): string {
  const body = block[key] as { rich_text?: RichText[] } | undefined;
  return (body?.rich_text ?? []).map((t) => t.plain_text ?? "").join("");
}

/*
  아는 블록만 글로 옮긴다. 이미지·임베드·데이터베이스는 건너뛴다 — 상세
  페이지의 렌더러도 그것들을 그리지 않으므로, 여기서 넣어 봐야 화면에는
  마크업 글자만 남는다.
*/
export function blocksToMarkdown(blocks: NotionBlock[], depth = 0): string {
  const pad = "  ".repeat(depth);
  const out: string[] = [];

  for (const b of blocks) {
    let line: string | null = null;
    switch (b.type) {
      case "heading_1": line = `## ${textOf(b, "heading_1")}`; break;
      case "heading_2": line = `## ${textOf(b, "heading_2")}`; break;
      case "heading_3": line = `### ${textOf(b, "heading_3")}`; break;
      case "paragraph": line = textOf(b, "paragraph"); break;
      case "bulleted_list_item": line = `${pad}- ${textOf(b, "bulleted_list_item")}`; break;
      case "numbered_list_item": line = `${pad}1. ${textOf(b, "numbered_list_item")}`; break;
      case "quote": line = `> ${textOf(b, "quote")}`; break;
      case "to_do": line = `${pad}- ${textOf(b, "to_do")}`; break;
      case "callout": line = `> ${textOf(b, "callout")}`; break;
      case "code": line = textOf(b, "code"); break;
      default: line = null;                    // 모르는 블록은 조용히 건너뛴다
    }
    if (line !== null && line.trim()) out.push(line);
    if (b.children?.length) {
      const nested = blocksToMarkdown(b.children, depth + 1);
      if (nested) out.push(nested);
    }
  }
  return out.join("\n");
}

/* ── 악보 파일 이름 ──────────────────────────────────────────────────── */

/*
  Storage 에 올릴 때 쓸 이름. 노션 파일 이름을 그대로 쓰면 한글·공백·괄호가
  섞여 URL 이 지저분해지고 버킷마다 허용 문자가 달라 터진다. 확장자만 살린다.
*/
export function sheetObjectName(slug: string, originalName: string): string {
  const ext = (/\.([A-Za-z0-9]{1,8})$/.exec(originalName)?.[1] ?? "pdf").toLowerCase();
  return `${slug}.${ext}`;
}
