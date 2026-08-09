import { getGear } from "./gear";

test("장비를 sortOrder 순으로, 재산정보 없이", () => {
  const g = getGear();
  expect(g.length).toBeGreaterThan(0);
  for (let i = 1; i < g.length; i++) {
    expect(g[i].sortOrder).toBeGreaterThanOrEqual(g[i - 1].sortOrder);
  }
  const k = g[0] as Record<string, unknown>;
  for (const f of ["purchasePrice", "currentPrice", "serialNumber", "location", "userId", "householdId"]) {
    expect(k[f]).toBeUndefined();
  }
});

test("랙 배치 필드(rackU·rackMounted)를 싣는다", () => {
  const g = getGear();
  expect(g.some((x) => x.rackMounted)).toBe(true);
  for (const x of g) {
    expect(typeof x.rackMounted).toBe("boolean");
    expect(x.rackU === null || typeof x.rackU === "number").toBe(true);
  }
});
