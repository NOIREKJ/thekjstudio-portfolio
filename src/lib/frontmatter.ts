export type FrontmatterData = Record<string, string | number>;

const FENCE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function parseFrontmatter(raw: string): {
  data: FrontmatterData;
  body: string;
} {
  const match = raw.match(FENCE);
  if (!match) return { data: {}, body: raw.trim() };

  const data: FrontmatterData = {};
  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const colon = trimmed.indexOf(":");
    if (colon === -1) continue;

    const key = trimmed.slice(0, colon).trim();
    let value = trimmed.slice(colon + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
      data[key] = value;
      continue;
    }

    data[key] = /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value;
  }

  return { data, body: raw.slice(match[0].length).trim() };
}
