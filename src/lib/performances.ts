import raw from "../content/performances.json";

export type Performance = {
  id: string;
  title: string;
  venue: string | null;
  date: string | null;
  poster: string | null;
  role: string | null;
  url: string | null;
  sortOrder: number;
};

// 명시 필드 화이트리스트(spread 금지). 최신 공연이 먼저 오도록 sortOrder 오름차순.
export function getPerformances(): Performance[] {
  return (raw as Performance[])
    .map((r) => ({
      id: r.id,
      title: r.title,
      venue: r.venue ?? null,
      date: r.date ?? null,
      poster: r.poster ?? null,
      role: r.role ?? null,
      url: r.url ?? null,
      sortOrder: r.sortOrder ?? 0,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
