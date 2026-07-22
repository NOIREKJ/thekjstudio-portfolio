import { HttpError, shouldFallback } from "./fetch";

/*
  네트워크를 타지 않는다 — shouldFallback 은 순수 판별 함수이므로
  HttpError 를 직접 만들어 넣고 폴백 여부만 확인한다.
*/

test("401 은 폴백하지 않는다 — 키 무효/로테이션은 설정 결함이다", () => {
  expect(shouldFallback(new HttpError(401, "unauthorized"))).toBe(false);
});

test("403 은 폴백하지 않는다 — 뷰 grant 유실도 설정 결함이다", () => {
  expect(shouldFallback(new HttpError(403, "forbidden"))).toBe(false);
});

test("404 는 폴백하지 않는다 — 뷰 이름 오타/뷰 없어짐도 설정 결함이다", () => {
  expect(shouldFallback(new HttpError(404, "not found"))).toBe(false);
});

test("다른 4xx(예: 400)도 폴백하지 않는다", () => {
  expect(shouldFallback(new HttpError(400, "bad request"))).toBe(false);
});

test("5xx 는 폴백한다 — Supabase 쪽 가용성 문제다", () => {
  expect(shouldFallback(new HttpError(500, "internal error"))).toBe(true);
  expect(shouldFallback(new HttpError(503, "unavailable"))).toBe(true);
});

test("429 는 폴백한다 — 레이트리밋도 가용성 문제로 취급한다", () => {
  expect(shouldFallback(new HttpError(429, "too many requests"))).toBe(true);
});

test("HttpError 가 아닌 오류(네트워크 오류 등, status 없음)는 폴백한다", () => {
  expect(shouldFallback(new TypeError("fetch failed"))).toBe(true);
  expect(shouldFallback(new Error("아무 오류"))).toBe(true);
});

test("HttpError 는 status 를 그대로 들고 있다", () => {
  const err = new HttpError(404, "public_songs 조회 실패: 404 not found");
  expect(err.status).toBe(404);
  expect(err.message).toMatch(/404/);
});
