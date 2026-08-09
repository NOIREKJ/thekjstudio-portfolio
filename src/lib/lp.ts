import raw from "../content/lp.json";

export type Lp = {
  id: string;
  artist: string;
  title: string;
  label: string | null;
  catalogNo: string | null;
  releaseYear: number | null;
  country: string | null;
  genre: string | null;
  format: string;
  speed: string;
  cover: string | null;
  appleMusicUrl: string | null;
  sortOrder: number;
};

// 명시 필드 화이트리스트(spread 금지) — 재산정보는 lp.json 에 없고, 여기서도 담지 않는다.
export function getLps(): Lp[] {
  return (raw as Lp[])
    .map((r) => ({
      id: r.id,
      artist: r.artist,
      title: r.title,
      label: r.label ?? null,
      catalogNo: r.catalogNo ?? null,
      releaseYear: r.releaseYear ?? null,
      country: r.country ?? null,
      genre: r.genre ?? null,
      format: r.format,
      speed: r.speed,
      cover: r.cover ?? null,
      appleMusicUrl: r.appleMusicUrl ?? null,
      sortOrder: r.sortOrder ?? 0,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
