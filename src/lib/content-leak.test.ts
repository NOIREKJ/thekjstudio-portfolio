/*
  구워진 콘텐츠에 재산 정보가 섞여 들어갔는지 본다.
  공개 뷰의 컬럼 목록이 1차 방어선이고 이것이 2차 방어선이다.
  사람의 주의력에 재산 목록을 맡기지 않는다.
*/
import apps from "../content/apps.json";
import arrangements from "../content/arrangements.json";
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
  "arrangements.json": arrangements,
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

/*
  키 이름만 보는 위 검사로는 못 잡는 누출이 하나 더 있다 — 값 안에 들어간
  내부 경로다. 2026-11-22 에 SSD 적재 기록을 arrangement_note(공개 뷰 컬럼)에
  써서 "친구들/김준/…" 이 상세 페이지에 그대로 찍혔다. 기록은 scan_note 로
  옮겼지만, 같은 실수가 다시 들어오면 여기서 잡는다.
*/
const FORBIDDEN_IN_VALUES = [
  "친구들/",          // SSD 작업 폴더 구조
  "/Volumes/",        // 로컬 드라이브 경로
  "/Users/",          // 홈 디렉터리 경로
  "SSD 스캔",         // 적재 기록 문구
  "ssd:",             // 합성 동기화 키
];

function collectStrings(value: unknown, found: string[]): void {
  if (typeof value === "string") { found.push(value); return; }
  if (Array.isArray(value)) { for (const e of value) collectStrings(e, found); return; }
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) collectStrings(child, found);
  }
}

for (const [file, content] of Object.entries(BAKED)) {
  test(`${file} 에 내부 경로·적재 기록이 없다`, () => {
    const strings: string[] = [];
    collectStrings(content, strings);
    const leaked = strings.filter((s) =>
      FORBIDDEN_IN_VALUES.some((f) => s.includes(f)),
    );
    expect(leaked).toEqual([]);
  });
}

test("값 수집기가 중첩 구조까지 훑는다", () => {
  const found: string[] = [];
  collectStrings([{ a: { b: ["친구들/김준"] } }], found);
  expect(found).toContain("친구들/김준");
});

test("키 수집기가 중첩 구조까지 훑는다", () => {
  const keys = new Set<string>();
  collectKeys([{ a: { b: [{ user_id: 1 }] } }], keys);
  expect(keys.has("user_id")).toBe(true);
});
