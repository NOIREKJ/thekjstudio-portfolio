/*
  sitemap.xml 을 굽는다. 고정 페이지 + 각 작업물 상세(/work/:slug).
  콘텐츠(songs/apps)에서 slug 를 읽으므로 fetch-content 뒤에 실행해야 한다.
*/
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://www.thekjstudio.com";

function slugs(file: string): string[] {
  try {
    const rows = JSON.parse(readFileSync(resolve(ROOT, "src/content", file), "utf8")) as { slug: string }[];
    return rows.map((r) => r.slug).filter(Boolean);
  } catch {
    return [];
  }
}

const staticPaths = ["/", "/work", "/studio", "/collection", "/about", "/contact"];
const workPaths = [...slugs("songs.json"), ...slugs("apps.json")].map((s) => `/work/${s}`);
const today = new Date().toISOString().slice(0, 10);

const urls = [...staticPaths, ...workPaths]
  .map((p) => `  <url><loc>${BASE}${p}</loc><lastmod>${today}</lastmod></url>`)
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

writeFileSync(resolve(ROOT, "public/sitemap.xml"), xml, "utf8");
console.log(`✓ sitemap.xml (${staticPaths.length + workPaths.length} URLs)`);
