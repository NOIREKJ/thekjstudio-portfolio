/*
  빌드 전에 콘텐츠를 굽는다.

  키가 없으면 실패하지 않고 커밋된 JSON 을 그대로 쓴다. 이유:
  - 키 없이도 npm run dev 가 돌아야 한다
  - Supabase 가 죽어도 배포가 되어야 한다
  - git 디프로 콘텐츠 변경이 보여야 한다
*/
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { credentials, fetchView, type Row } from "./content/fetch";
import { mapApp, mapCredit, mapGear, mapLp, mapPerformance, mapSong } from "./content/map";
import { validateFeatured } from "./content/validate";

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../src/content");

type Source = { view: string; file: string; map: (row: Row) => unknown };

const SOURCES: Source[] = [
  { view: "public_songs", file: "songs", map: mapSong },
  { view: "public_apps", file: "apps", map: mapApp },
  { view: "public_credits", file: "credits", map: mapCredit },
  { view: "public_performances", file: "performances", map: mapPerformance },
  { view: "public_lp", file: "lp", map: mapLp },
  { view: "public_gear", file: "gear", map: mapGear },
];

async function main(): Promise<void> {
  const creds = credentials();

  if (!creds) {
    const songs = resolve(OUT_DIR, "songs.json");
    if (!existsSync(songs)) {
      throw new Error(
        "SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY 가 없고 커밋된 콘텐츠도 없습니다. " +
          "둘 중 하나는 있어야 빌드할 수 있습니다.",
      );
    }
    console.warn("⚠ Supabase 키가 없습니다. 커밋된 src/content/*.json 을 그대로 씁니다.");
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const baked: Record<string, unknown[]> = {};
  for (const source of SOURCES) {
    const rows = await fetchView(source.view, creds);
    baked[source.file] = rows.map((row) => source.map(row));
    console.log(`  ${source.view} → ${rows.length}건`);
  }

  // 건반 규칙은 굽기 전에 검사한다. 조용히 불협화음이 나는 것보다 빌드가 깨지는 편이 낫다.
  validateFeatured([
    ...(baked.songs as { slug: string; note: string | null; featured: boolean }[]),
    ...(baked.apps as { slug: string; note: string | null; featured: boolean }[]),
  ]);

  for (const source of SOURCES) {
    writeFileSync(
      resolve(OUT_DIR, `${source.file}.json`),
      JSON.stringify(baked[source.file], null, 2) + "\n",
      "utf8",
    );
  }

  console.log("✓ src/content/*.json 을 구웠습니다.");
}

main().catch((error) => {
  console.error(`✕ 콘텐츠를 굽지 못했습니다: ${(error as Error).message}`);
  process.exit(1);
});
