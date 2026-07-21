import { parseFrontmatter } from "./frontmatter";

export type WorkKind = "music" | "app";

export type Work = {
  slug: string;
  title: string;
  kind: WorkKind;
  note: string;
  sound?: string;
  year: number;
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
      body,
    };
  });

  return works.sort((a, b) => b.year - a.year || a.slug.localeCompare(b.slug));
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
