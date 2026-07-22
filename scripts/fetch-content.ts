/*
  빌드 전에 콘텐츠를 굽는다.

  키가 없거나(설정 누락) 조회가 실패하면(가용성 문제 — 네트워크 장애, 401, 500 등)
  실패하지 않고 커밋된 JSON 을 그대로 쓴다. 이유:
  - 키 없이도 npm run dev 가 돌아야 한다
  - Supabase 가 죽어도 배포가 되어야 한다
  - git 디프로 콘텐츠 변경이 보여야 한다

  단, 이 폴백은 "Supabase 에 못 닿았을 때"만이다. 조회는 성공했는데
  내용이 잘못된 경우 — 건반 규칙(validateFeatured) 위반, songs+apps 합산 0건 —
  는 가용성 문제가 아니라 실제 데이터 결함이므로 폴백하지 않고 항상 빌드를 깬다.
*/
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { credentials, fetchView, type Row } from "./content/fetch";
import { mapApp, mapCredit, mapGear, mapLp, mapPerformance, mapSong } from "./content/map";
import { assertContentNotEmpty, validateFeatured } from "./content/validate";

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
  try {
    for (const source of SOURCES) {
      const rows = await fetchView(source.view, creds);
      baked[source.file] = rows.map((row) => source.map(row));
      console.log(`  ${source.view} → ${rows.length}건`);
    }
  } catch (error) {
    // 조회 실패 = 가용성 문제. 키는 있지만 Supabase 에 못 닿은 상황이다.
    // 이건 데이터 결함이 아니므로, 커밋된 JSON 이 있으면 그걸로 폴백한다.
    const songs = resolve(OUT_DIR, "songs.json");
    if (!existsSync(songs)) {
      throw error;
    }
    console.warn(
      `⚠ Supabase 조회에 실패했습니다 (${(error as Error).message}). ` +
        "키는 있지만 접속이 안 되는 것으로 보고, 커밋된 src/content/*.json 을 그대로 씁니다.",
    );
    return;
  }

  // 여기서부터는 조회에 성공한 뒤의 검사다. 가용성 문제가 아니라 실제 데이터
  // 결함이므로 커밋된 JSON 이 있어도 폴백하지 않고 항상 빌드를 깬다.

  assertContentNotEmpty({
    songs: (baked.songs as unknown[]).length,
    apps: (baked.apps as unknown[]).length,
  });

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
