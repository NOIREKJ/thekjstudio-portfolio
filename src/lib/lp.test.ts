import { getLps } from "./lp";

test("LP 를 sortOrder 순으로, 안전 필드만", () => {
  const l = getLps();
  expect(l.length).toBeGreaterThan(0);
  for (let i = 1; i < l.length; i++) {
    expect(l[i].sortOrder).toBeGreaterThanOrEqual(l[i - 1].sortOrder);
  }
  const k = l[0] as Record<string, unknown>;
  for (const f of ["purchasePrice", "currentPrice", "serialNumber", "location", "userId", "householdId"]) {
    expect(k[f]).toBeUndefined();
  }
});

test("표시에 필요한 필드가 있다(artist·title·appleMusicUrl 키 존재)", () => {
  const l = getLps();
  expect(l[0].artist).toBeTruthy();
  expect(l[0].title).toBeTruthy();
  expect("appleMusicUrl" in l[0]).toBe(true);
});
