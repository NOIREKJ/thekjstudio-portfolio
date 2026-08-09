import { buildRackDiagram, groupByCategory } from "./rackDiagram";
import type { Gear } from "./gear";

const g = (id: string, category: string, rackU: number | null, rackMounted: boolean, sortOrder = 0): Gear =>
  ({ id, name: id.toUpperCase(), category, sortOrder, rackU, rackMounted });

test("buildRackDiagram: rackU 순으로 행, 빈 U 는 null", () => {
  const rows = buildRackDiagram([g("a", "x", 0, true), g("c", "x", 2, true), g("d", "x", null, false)]);
  expect(rows.map((r) => r.u)).toEqual([0, 1, 2]);
  expect(rows[0].gear?.id).toBe("a");
  expect(rows[1].gear).toBeNull(); // 빈 U
  expect(rows[2].gear?.id).toBe("c");
});

test("buildRackDiagram: 장착 장비 없으면 빈 배열", () => {
  expect(buildRackDiagram([g("a", "x", null, false)])).toEqual([]);
});

test("groupByCategory: 첫 등장 순서로 묶는다", () => {
  const groups = groupByCategory([
    g("a", "오디오", null, false, 0),
    g("b", "악기", null, false, 1),
    g("c", "오디오", null, false, 2),
  ]);
  expect(groups.map((x) => x.category)).toEqual(["오디오", "악기"]);
  expect(groups[0].items.map((i) => i.id)).toEqual(["a", "c"]);
});
