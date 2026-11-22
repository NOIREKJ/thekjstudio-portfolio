import { clean, formatMail, formatTelegram, Rejected } from "../../api/inquiry";

const ok = { contact: "kj@example.com", message: "편곡 문의드립니다" };

/* ── 봇 판정 ─────────────────────────────────────────────────────────── */

/*
  봇에게는 성공처럼 보여야 한다. "막혔다" 고 알려 주면 다음엔 피해서 온다.
  그래서 silent 다 — 사용자 화면에는 성공이 뜨지만 아무것도 보내지 않는다.
*/
test("허니팟이 채워지면 조용히 버린다", () => {
  try {
    clean({ ...ok, hp: "http://spam.example" });
    throw new Error("던져야 한다");
  } catch (e) {
    expect(e).toBeInstanceOf(Rejected);
    expect((e as Rejected).silent).toBe(true);
  }
});

test("3초 안에 제출되면 조용히 버린다", () => {
  expect(() => clean({ ...ok, elapsedMs: 900 })).toThrow(Rejected);
  expect(() => clean({ ...ok, elapsedMs: 3001 })).not.toThrow();
});

test("경과 시간이 아예 없으면 통과시킨다 — 못 보낸 것과 봇은 다르다", () => {
  expect(() => clean(ok)).not.toThrow();
  expect(() => clean({ ...ok, elapsedMs: "이상한값" })).not.toThrow();
});

/* ── 필수값 ──────────────────────────────────────────────────────────── */

/*
  이쪽은 silent 가 아니다. 사람이 빠뜨린 것이므로 알려 줘야 고칠 수 있다.
*/
test("연락처·내용이 없으면 사용자에게 알린다", () => {
  for (const bad of [{ message: "내용만" }, { contact: "연락처만" }, { contact: "  ", message: "  " }]) {
    try {
      clean(bad);
      throw new Error("던져야 한다");
    } catch (e) {
      expect(e).toBeInstanceOf(Rejected);
      expect((e as Rejected).silent).toBe(false);
    }
  }
});

/* ── 정규화 ──────────────────────────────────────────────────────────── */

test("모르는 제품은 other 로 떨어뜨린다 — 문의를 잃지 않는다", () => {
  expect(clean({ ...ok, product: "koinon" }).product).toBe("koinon");
  expect(clean({ ...ok, product: "엉뚱한것" }).product).toBe("other");
  expect(clean(ok).product).toBe("other");
});

test("빈 이름·유입은 null 로 — 빈 문자열을 DB 에 넣지 않는다", () => {
  const q = clean({ ...ok, name: "   ", source: "" });
  expect(q.name).toBeNull();
  expect(q.source).toBeNull();
});

/*
  거부하지 않고 자른다. 긴 글을 쓴 사람의 문의를 통째로 잃는 것이 더 나쁘다.
*/
test("너무 긴 내용은 거부하지 않고 자른다", () => {
  const q = clean({ contact: "x@y.z", message: "가".repeat(9000) });
  expect(q.message.length).toBe(5000);
});

test("payload 는 한 겹만 받고 빈 값·중첩은 버린다", () => {
  const q = clean({
    ...ok,
    payload: { 교회명: "한일교회", 교인수: 1000, 빈칸: "", 없음: null, 중첩: { a: 1 } },
  });
  expect(q.payload).toEqual({ 교회명: "한일교회", 교인수: 1000 });
});

test("payload 가 객체가 아니면 빈 객체로", () => {
  expect(clean({ ...ok, payload: "문자열" }).payload).toEqual({});
  expect(clean({ ...ok, payload: [1, 2] }).payload).toEqual({});
});

/* ── 메시지 ──────────────────────────────────────────────────────────── */

test("텔레그램 알림에 제품·연락처·내용이 들어간다", () => {
  const msg = formatTelegram(clean({ ...ok, product: "koinon", name: "김준", source: "/work/koinon" }));
  expect(msg).toContain("KOINON 도입 문의");
  expect(msg).toContain("김준");
  expect(msg).toContain("kj@example.com");
  expect(msg).toContain("/work/koinon");
});

/*
  메일은 DB 가 막혔을 때의 유일한 기록이다. 되돌려 넣을 수 있어야 한다.
*/
test("메일 본문 끝의 JSON 으로 백필할 수 있다", () => {
  const at = new Date("2026-11-22T01:02:03.000Z");
  const { subject, text } = formatMail(clean({ ...ok, product: "music", name: "김준" }), at);
  expect(subject).toContain("음악·편곡 문의");

  const json = text.slice(text.lastIndexOf("\n") + 1);
  const back = JSON.parse(json);
  expect(back.contact).toBe("kj@example.com");
  expect(back.product).toBe("music");
  expect(back.created_at).toBe("2026-11-22T01:02:03.000Z");
});

test("이름이 없으면 제목에 연락처를 쓴다", () => {
  expect(formatMail(clean(ok), new Date()).subject).toContain("kj@example.com");
});
