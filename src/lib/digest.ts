/*
  일일 리드 점검의 순수 로직 — 무엇이 늦었는지, 무엇을 지울 때가 됐는지.

  네트워크·비밀은 `api/leads-digest.ts` 가 들고 있다.
*/
import { RETENTION_DAYS, retentionLabel } from "./privacy";

/** 이만큼 답이 없으면 늦은 것으로 본다. 영업에서 실제로 돈을 잃는 지점이다. */
export const OVERDUE_DAYS = 3;

/*
  한 번에 이보다 많이 지우게 되면 **지우지 않고 알리기만 한다.**
  삭제는 되돌릴 수 없다. 숫자가 갑자기 커졌다면 기준이 잘못됐을 가능성이 더 크다.
*/
export const DELETE_CAP = 200;

export type Lead = {
  id: string;
  created_at: string;
  product: string;
  name: string | null;
  contact: string;
  stage: string;
};

const DAY = 86_400_000;
export const daysAgo = (now: Date, days: number): Date => new Date(now.getTime() - days * DAY);
const ageDays = (now: Date, iso: string): number =>
  Math.floor((now.getTime() - new Date(iso).getTime()) / DAY);

const LABEL: Record<string, string> = { koinon: "KOINON", music: "음악·편곡", other: "기타" };

/** 늦은 순서대로 — 가장 오래 방치된 것이 맨 위에 와야 한다. */
export function sortOverdue(rows: Lead[]): Lead[] {
  return [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function overdueMessage(rows: Lead[], now: Date): string | null {
  if (rows.length === 0) return null;
  const lines = sortOverdue(rows).slice(0, 15).map((r) => {
    const who = r.name ?? r.contact;
    return `· ${ageDays(now, r.created_at)}일 — ${LABEL[r.product] ?? r.product} · ${who}`;
  });
  const more = rows.length > 15 ? [`… 외 ${rows.length - 15}건`] : [];
  return [
    `⏳ 답을 안 한 문의 ${rows.length}건 (${OVERDUE_DAYS}일 넘음)`,
    ...lines,
    ...more,
  ].join("\n");
}

export type StageCount = { stage: string; n: number };

const STAGE_LABEL: Record<string, string> = {
  new: "미응답", contacted: "연락함", talking: "협의 중", won: "성사", lost: "종료",
};
const STAGE_ORDER = ["new", "contacted", "talking", "won", "lost"];

export function weeklyMessage(counts: StageCount[]): string | null {
  const total = counts.reduce((s, c) => s + c.n, 0);
  if (total === 0) return null;
  const by = new Map(counts.map((c) => [c.stage, c.n]));
  const parts = STAGE_ORDER.filter((s) => by.get(s)).map((s) => `${STAGE_LABEL[s]} ${by.get(s)}`);
  return `📊 리드 ${total}건 — ${parts.join(" · ")}`;
}

export type DeletePlan =
  | { act: "none" }
  | { act: "delete"; cutoff: string; n: number }
  | { act: "hold"; cutoff: string; n: number; why: string };

/*
  파기 대상은 **종료된(won·lost) 문의 중 처리 완료일로부터 보유 기간이 지난 것**이다.
  단계와 처리 완료일 두 가지를 모두 보는 이유는, 한쪽만 보면 버그 하나로 살아 있는
  리드가 지워질 수 있기 때문이다.
*/
export function planDeletion(n: number, now: Date): DeletePlan {
  const cutoff = daysAgo(now, RETENTION_DAYS).toISOString();
  if (n === 0) return { act: "none" };
  if (n > DELETE_CAP) {
    return {
      act: "hold", cutoff, n,
      why: `한 번에 ${n}건은 너무 많습니다(상한 ${DELETE_CAP}). 기준이 잘못됐을 수 있어 지우지 않았습니다.`,
    };
  }
  return { act: "delete", cutoff, n };
}

export function deletionMessage(plan: DeletePlan): string | null {
  if (plan.act === "none") return null;
  if (plan.act === "hold") return `⚠️ 파기 보류 ${plan.n}건 — ${plan.why}`;
  return `🗑 보유 기간(${retentionLabel()})이 지난 문의 ${plan.n}건을 파기했습니다.`;
}

/** 할 말이 없으면 보내지 않는다. 조용한 날에 알림이 오면 다음부터 안 읽는다. */
export function combine(parts: (string | null)[]): string | null {
  const kept = parts.filter((p): p is string => p !== null && p !== "");
  return kept.length ? kept.join("\n\n") : null;
}
