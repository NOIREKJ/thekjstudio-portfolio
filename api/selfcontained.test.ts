import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

/*
  배포된 Vercel 함수는 **import 한 로컬 파일을 함께 번들하지 않는다.**
  엔트리포인트만 트랜스파일되어 올라가고, 런타임에 이렇게 죽는다:

    Error [ERR_MODULE_NOT_FOUND]:
      Cannot find module '/var/task/src/lib/inquiry'
      imported from /var/task/api/inquiry.js

  이걸 두 번 겪었다(src/lib → api/_lib 로 옮겼는데도 같았다). 로컬 빌드·테스트·
  타입체크는 **전부 통과한다** — 같은 파일 트리를 보니까. 배포한 뒤 엔드포인트를
  실제로 때려 봐야만 드러난다.

  그래서 여기서 막는다: api/ 의 핸들러는 로컬 상대 import 를 쓰지 않는다.
  공유하고 싶으면 핸들러 안에 두고, 테스트가 거기서 가져다 쓴다.
  (npm 패키지 import 는 node_modules 가 번들되므로 괜찮다.)
*/
test("api/ 핸들러에 로컬 상대 import 가 없다", async () => {
  const dir = join(process.cwd(), "api");
  const files = (await readdir(dir)).filter(
    (f) => f.endsWith(".ts") && !f.endsWith(".test.ts"),
  );
  expect(files.length).toBeGreaterThan(0); // 정규식이 죽으면 조용히 통과해 버린다

  const offenders: string[] = [];
  for (const f of files) {
    const src = await readFile(join(dir, f), "utf8");
    for (const m of src.matchAll(/^\s*(?:import|export)\s[^;]*?from\s+["'](\.[^"']*)["']/gm)) {
      offenders.push(`${f} → ${m[1]}`);
    }
    for (const m of src.matchAll(/\bimport\(\s*["'](\.[^"']*)["']\s*\)/g)) {
      offenders.push(`${f} → import(${m[1]})`);
    }
  }
  expect(offenders, "배포 시 번들되지 않아 런타임에 죽는다").toEqual([]);
});
