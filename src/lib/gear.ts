import raw from "../content/gear.json";

export type Gear = {
  id: string;
  name: string;
  category: string;
  sortOrder: number;
  rackU: number | null;
  rackMounted: boolean;
};

// 명시 필드 화이트리스트(spread 금지) — 재산정보(가격·시세·시리얼·위치)는 담지 않는다.
export function getGear(): Gear[] {
  return (raw as Gear[])
    .map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      sortOrder: r.sortOrder ?? 0,
      rackU: r.rackU ?? null,
      rackMounted: Boolean(r.rackMounted),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
