import type { ArrangementContent, ArrangementStatus } from "./content-types";
import arrangementsJson from "../content/arrangements.json";

export type Arrangement = ArrangementContent;

/** 목록 필터. 방문자에게는 '하는 중'과 '끝난 것'만 의미가 있다. */
export type ArrangementFilter = "all" | "wip" | "done";

/*
  다섯 단계를 두 묶음으로 줄인다.

  idea·arranging·sheet·recording 은 내부 공정이고, 방문자가 가려 볼 이유는
  "지금 하는 중인가" / "들을 수 있나" 둘뿐이다. 배지에는 다섯 단계를 그대로
  보여주되(작업이 어디까지 왔는지가 이 페이지의 재미다) 필터만 묶는다.

  묶음 정의는 이 파일에만 있다. 화면 코드가 상태 문자열을 직접 비교하면
  단계를 하나 추가할 때 어느 화면이 빠졌는지 알 수 없게 된다.
*/
const WIP_STATUSES: readonly ArrangementStatus[] = [
  "idea", "arranging", "sheet", "recording",
];

export function isWip(status: ArrangementStatus): boolean {
  return WIP_STATUSES.includes(status);
}

export function filterArrangements(
  items: Arrangement[],
  filter: ArrangementFilter,
): Arrangement[] {
  if (filter === "all") return items;
  if (filter === "done") return items.filter((a) => a.status === "done");
  return items.filter((a) => isWip(a.status));
}

/*
  악보·구매 버튼을 달 수 있는지.

  `done` 일 때만 단다 — 편곡중인 곡에 구매 버튼이 붙으면 아직 못 주는 것을
  파는 셈이 된다. `visibility` 는 보지 않는다. 공개 범위는 public_arrangements
  뷰가 유일한 정의이고, 화면이 한 번 더 판단하면 두 곳이 어긋날 수 있다.
*/
export function canSell(a: Arrangement): boolean {
  return a.status === "done" && Boolean(a.sheetUrl || a.purchaseUrl);
}

export function sortArrangements(items: Arrangement[]): Arrangement[] {
  // 편집 의도대로 sort_order 오름차순. 같으면 제목 순으로 안정화한다.
  return [...items].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title),
  );
}

let cached: Arrangement[] | null = null;

export function getArrangements(): Arrangement[] {
  if (!cached) {
    // JSON 임포트의 추론 타입은 파일 내용에 따라 흔들린다(빈 배열이면 never[]).
    // 계약은 content-types.ts 가 쥐고, 실제 모양은 굽는 쪽이 보장한다.
    cached = sortArrangements(arrangementsJson as unknown as ArrangementContent[]);
  }
  return cached;
}

export function getArrangement(slug: string): Arrangement | undefined {
  return getArrangements().find((a) => a.slug === slug);
}

/*
  유튜브 링크를 임베드 주소로 바꾼다.

  youtube-nocookie 를 쓰는 이유는 방문자가 재생하기 전까지 구글 쿠키가
  심기지 않게 하기 위해서다. 알아볼 수 없는 주소는 null 을 돌려줘
  호출 쪽이 섹션을 아예 그리지 않게 한다 — 깨진 iframe 보다 없는 게 낫다.
*/
export function youtubeEmbed(url: string | null): string | null {
  if (!url) return null;
  let id: string | null = null;
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      id = u.pathname.slice(1);
    } else if (u.hostname.endsWith("youtube.com")) {
      id = u.searchParams.get("v") ?? (
        u.pathname.startsWith("/embed/") ? u.pathname.slice("/embed/".length) : null
      );
    }
  } catch {
    return null;
  }
  if (!id || !/^[\w-]{6,}$/.test(id)) return null;
  return `https://www.youtube-nocookie.com/embed/${id}`;
}
