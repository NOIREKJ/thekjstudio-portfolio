import type { Gear } from "./gear";

export type RackRow = { u: number; gear: Gear | null };

// 장착된 장비(rackMounted)를 rackU 절대 위치의 세로 랙 행으로. 빈 U 는 gear:null.
// U 0(최상단)부터 최대 U 까지 연속 행을 만들어 실제 랙처럼 보인다.
export function buildRackDiagram(gear: Gear[]): RackRow[] {
  const mounted = gear.filter((g) => g.rackMounted && g.rackU != null);
  if (mounted.length === 0) return [];
  const byU = new Map<number, Gear>();
  let maxU = 0;
  for (const g of mounted) {
    const u = g.rackU as number;
    byU.set(u, g);
    if (u > maxU) maxU = u;
  }
  const rows: RackRow[] = [];
  for (let u = 0; u <= maxU; u++) rows.push({ u, gear: byU.get(u) ?? null });
  return rows;
}

// 장비를 카테고리별로 묶는다. 카테고리 순서는 첫 등장(=sortOrder) 순 유지.
export function groupByCategory(gear: Gear[]): { category: string; items: Gear[] }[] {
  const order: string[] = [];
  const map = new Map<string, Gear[]>();
  for (const g of gear) {
    if (!map.has(g.category)) {
      map.set(g.category, []);
      order.push(g.category);
    }
    map.get(g.category)!.push(g);
  }
  return order.map((c) => ({ category: c, items: map.get(c)! }));
}
