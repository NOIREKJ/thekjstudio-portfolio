/*
  빌드 전에 콘텐츠를 굽는다.

  키가 없거나(설정 누락) 조회가 가용성 문제(네트워크 장애, 5xx, 429)로
  실패하면 실패하지 않고 커밋된 JSON 을 그대로 쓴다. 이유:
  - 키 없이도 npm run dev 가 돌아야 한다
  - Supabase 가 죽어도 배포가 되어야 한다
  - git 디프로 콘텐츠 변경이 보여야 한다

  단, 이 폴백은 "Supabase 에 못 닿았을 때"만이다. 401/403/404 같은 나머지
  4xx 는 접속 문제가 아니라 설정 결함(키 로테이션 누락, 뷰 이름 오타, grant
  유실 등)이므로 폴백하지 않고 항상 빌드를 깬다 — 조용히 넘어가면 "콘텐츠를
  갱신했다고 믿는데 실제로는 옛 JSON 이 배포된" 상태가 신호 없이 만들어진다.
  (판별은 content/fetch.ts 의 shouldFallback 참고.)

  조회는 성공했는데 내용이 잘못된 경우 — songs+apps 합산 0건 — 도 마찬가지로
  데이터/설정 결함이므로 폴백하지 않고 항상 빌드를 깬다.
*/
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { credentials, fetchView, shouldFallback, HttpError, type Row } from "./content/fetch";
import { mapApp, mapCredit, mapGear, mapLp, mapPerformance, mapSong } from "./content/map";
import { assertContentNotEmpty } from "./content/validate";

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

  // 여기서는 원시 행만 모은다. 매핑(source.map)은 이 경계 밖에서 한다 —
  // 매퍼가 던지는 예외까지 이 try 가 삼키면 데이터 결함이 가용성 문제로
  // 오분류돼 조용히 폴백된다. 지금 매퍼는 String()/Number() 라 던지지
  // 않지만, 나중에 검증이 들어가도 이 경계는 그대로 유효해야 한다.
  const rawRows: Record<string, Row[]> = {};
  try {
    for (const source of SOURCES) {
      const rows = await fetchView(source.view, creds);
      rawRows[source.file] = rows;
      console.log(`  ${source.view} → ${rows.length}건`);
    }
  } catch (error) {
    if (!shouldFallback(error)) {
      // 401/403/404 같은 나머지 4xx 는 접속 문제가 아니라 설정 문제다.
      // 키 로테이션 누락, 뷰 이름 오타, grant 유실 등 — 조용히 폴백하면
      // "콘텐츠를 갱신했다고 믿는데 실제로는 옛 JSON 이 배포된" 상태가
      // 아무 신호 없이 만들어진다. 그래서 폴백하지 않고 항상 빌드를 깬다.
      const status = error instanceof HttpError ? error.status : "?";
      throw new Error(
        `설정 문제로 콘텐츠 조회가 실패했습니다 (HTTP ${status}). ` +
          "이건 접속 문제가 아니라 설정 문제입니다 — SUPABASE_PUBLISHABLE_KEY, " +
          "뷰 이름/grant 를 확인하세요. 원인: " +
          `${(error as Error).message}`,
      );
    }
    // 여기부터는 가용성 문제(네트워크 오류, 5xx, 429). 키는 있지만
    // Supabase 에 못 닿았거나 Supabase 쪽이 일시적으로 문제인 상황이다.
    // 이건 데이터 결함이 아니므로, 커밋된 JSON 이 있으면 그걸로 폴백한다.
    const songs = resolve(OUT_DIR, "songs.json");
    if (!existsSync(songs)) {
      throw error;
    }
    console.warn(
      `⚠ Supabase 조회에 실패했습니다 (${(error as Error).message}). ` +
        "가용성 문제로 보고, 커밋된 src/content/*.json 을 그대로 씁니다.",
    );
    return;
  }

  const baked: Record<string, unknown[]> = {};
  for (const source of SOURCES) {
    baked[source.file] = rawRows[source.file].map((row) => source.map(row));
  }

  // 여기서부터는 조회에 성공한 뒤의 검사다. 가용성 문제가 아니라 실제 데이터
  // 결함이므로 커밋된 JSON 이 있어도 폴백하지 않고 항상 빌드를 깬다.

  assertContentNotEmpty({
    songs: (baked.songs as unknown[]).length,
    apps: (baked.apps as unknown[]).length,
  });

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
