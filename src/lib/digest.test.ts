import {
  combine, DELETE_CAP, deletionMessage, overdueMessage, planDeletion, sortOverdue, weeklyMessage,
  RETENTION_DAYS,
} from "../../api/leads-digest";

const NOW = new Date("2026-11-22T00:00:00.000Z");
const lead = (id: string, daysOld: number, over: Partial<Record<string, string | null>> = {}) => ({
  id,
  created_at: new Date(NOW.getTime() - daysOld * 86_400_000).toISOString(),
  product: "koinon", name: `담당자${id}`, contact: `${id}@x.kr`, stage: "new",
  ...over,
});

/* ── 미응답 ─────────────────────────────────────────────────────────── */

/*
  조용한 날에 알림이 오면 다음부터 안 읽게 된다. 할 말이 없으면 보내지 않는다.
*/
test("늦은 게 없으면 아무 말도 하지 않는다", () => {
  expect(overdueMessage([], NOW)).toBeNull();
  expect(weeklyMessage([])).toBeNull();
  expect(combine([null, null])).toBeNull();
});

test("가장 오래 방치된 것이 맨 위에 온다", () => {
  const got = sortOverdue([lead("b", 4), lead("a", 30), lead("c", 10)]);
  expect(got.map((r) => r.id)).toEqual(["a", "c", "b"]);
});

test("며칠 됐는지와 누구인지를 적는다", () => {
  const msg = overdueMessage([lead("a", 9)], NOW)!;
  expect(msg).toContain("1건");
  expect(msg).toContain("9일");
  expect(msg).toContain("KOINON");
  expect(msg).toContain("담당자a");
});

test("이름이 없으면 연락처로 대신한다", () => {
  expect(overdueMessage([lead("a", 5, { name: null })], NOW)!).toContain("a@x.kr");
});

/*
  알림 하나가 수십 줄이면 읽히지 않는다. 15건까지만 적고 나머지는 숫자로.
*/
test("너무 많으면 15건까지만 적고 나머지는 센다", () => {
  const many = Array.from({ length: 23 }, (_, i) => lead(String(i), i + 4));
  const msg = overdueMessage(many, NOW)!;
  expect(msg).toContain("23건");
  expect(msg).toContain("외 8건");
  expect(msg.split("\n").length).toBe(1 + 15 + 1);
});

/* ── 주간 집계 ──────────────────────────────────────────────────────── */

test("단계를 공정 순서대로 늘어놓는다", () => {
  const msg = weeklyMessage([
    { stage: "won", n: 1 }, { stage: "new", n: 3 }, { stage: "talking", n: 2 },
  ])!;
  expect(msg).toContain("리드 6건");
  expect(msg.indexOf("미응답")).toBeLessThan(msg.indexOf("협의 중"));
  expect(msg.indexOf("협의 중")).toBeLessThan(msg.indexOf("성사"));
  expect(msg).not.toContain("연락함"); // 0건인 단계는 적지 않는다
});

/* ── 파기 ───────────────────────────────────────────────────────────── */

test("지울 게 없으면 아무 말도 하지 않는다", () => {
  expect(planDeletion(0, NOW)).toEqual({ act: "none" });
  expect(deletionMessage({ act: "none" })).toBeNull();
});

test("기준일은 보유 기간만큼 과거다", () => {
  const plan = planDeletion(3, NOW);
  expect(plan.act).toBe("delete");
  if (plan.act === "none") throw new Error("unreachable");
  const days = (NOW.getTime() - new Date(plan.cutoff).getTime()) / 86_400_000;
  expect(days).toBe(RETENTION_DAYS);
});

/*
  삭제는 되돌릴 수 없다. 숫자가 갑자기 커졌다면 지울 때가 된 게 아니라
  기준이 잘못됐을 가능성이 더 크다 — 지우지 않고 사람을 부른다.
*/
test("한 번에 너무 많으면 지우지 않고 알린다", () => {
  const plan = planDeletion(DELETE_CAP + 1, NOW);
  expect(plan.act).toBe("hold");
  expect(deletionMessage(plan)).toContain("보류");
  expect(planDeletion(DELETE_CAP, NOW).act).toBe("delete");
});

test("지웠으면 몇 건을 왜 지웠는지 말한다", () => {
  const msg = deletionMessage(planDeletion(4, NOW))!;
  expect(msg).toContain("4건");
  expect(msg).toContain("파기");
});

test("할 말이 여럿이면 빈 줄로 잇는다", () => {
  expect(combine(["가", null, "나"])).toBe("가\n\n나");
});
