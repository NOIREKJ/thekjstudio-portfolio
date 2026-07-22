/*
  구워진 콘텐츠에 재산 정보가 섞여 들어갔는지 본다.
  공개 뷰의 컬럼 목록이 1차 방어선이고 이것이 2차 방어선이다.
  사람의 주의력에 재산 목록을 맡기지 않는다.
*/
import apps from "../content/apps.json";
import credits from "../content/credits.json";
import gear from "../content/gear.json";
import lp from "../content/lp.json";
import performances from "../content/performances.json";
import songs from "../content/songs.json";

const FORBIDDEN = [
  "purchase_price", "purchasePrice",
  "current_price", "currentPrice",
  "purchase_date", "purchaseDate",
  "serial_number", "serialNumber",
  "market_price", "marketPrice",
  "market_price_usd", "marketPriceUsd",
  "market_listings", "marketListings",
  "location",
  "household_id", "householdId",
  "user_id", "userId",
];

const BAKED: Record<string, unknown> = {
  "songs.json": songs,
  "apps.json": apps,
  "credits.json": credits,
  "performances.json": performances,
  "lp.json": lp,
  "gear.json": gear,
};

function collectKeys(value: unknown, found: Set<string>): void {
  if (Array.isArray(value)) {
    for (const entry of value) collectKeys(entry, found);
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      found.add(key);
      collectKeys(child, found);
    }
  }
}

for (const [file, content] of Object.entries(BAKED)) {
  test(`${file} 에 재산 정보가 없다`, () => {
    const keys = new Set<string>();
    collectKeys(content, keys);
    const leaked = FORBIDDEN.filter((f) => keys.has(f));
    expect(leaked).toEqual([]);
  });
}

test("금지 목록 자체가 비어 있지 않다 — 테스트가 껍데기가 되지 않게", () => {
  expect(FORBIDDEN.length).toBeGreaterThan(10);
});

test("키 수집기가 중첩 구조까지 훑는다", () => {
  const keys = new Set<string>();
  collectKeys([{ a: { b: [{ user_id: 1 }] } }], keys);
  expect(keys.has("user_id")).toBe(true);
});
