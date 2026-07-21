import { parseFrontmatter } from "./frontmatter";
import { noteToFrequency } from "./note";

export type WorkKind = "music" | "app";

export type Work = {
  slug: string;
  title: string;
  kind: WorkKind;
  note: string;
  sound?: string;
  year: number;
  images: string[];
  body: string;
};

export function buildWorks(modules: Record<string, string>): Work[] {
  const works = Object.entries(modules).map(([path, raw]) => {
    const slug = path.split("/").pop()!.replace(/\.md$/, "");
    const { data, body } = parseFrontmatter(raw);

    for (const field of ["title", "kind", "note", "year"] as const) {
      if (data[field] === undefined) {
        throw new Error(`${slug}.md: frontmatter에 '${field}'가 없습니다`);
      }
    }
    if (data.kind !== "music" && data.kind !== "app") {
      throw new Error(`${slug}.md: kind는 'music' 또는 'app'이어야 합니다`);
    }

    return {
      slug,
      title: String(data.title),
      kind: data.kind as WorkKind,
      note: String(data.note),
      sound: data.sound === undefined ? undefined : String(data.sound),
      year: Number(data.year),
      images:
        data.images === undefined
          ? []
          : String(data.images)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
      body,
    };
  });

  // 음 높이 오름차순. 왼쪽이 낮은음, 오른쪽이 높은음 — 악기의 순서다.
  // 연도순으로 두면 음악(2024)과 앱(2026)이 좌우로 갈라져 버린다.
  // 두 세계는 섞여 있어야 하므로, 섞이도록 음을 배정하고 음 높이로 정렬한다.
  return works.sort((a, b) => noteToFrequency(a.note) - noteToFrequency(b.note));
}

const modules = import.meta.glob("../works/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

let cached: Work[] | null = null;

export function getWorks(): Work[] {
  if (!cached) cached = buildWorks(modules);
  return cached;
}

export function getWork(slug: string): Work | undefined {
  return getWorks().find((w) => w.slug === slug);
}
