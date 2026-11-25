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
  // 하위 폴더까지 본다. api/admin/*.ts 처럼 중첩된 라우트도 같은 제약을 받는데,
  // 한 단계만 훑으면 그것들이 조용히 빠져나간다.
  async function handlerFiles(dir: string, prefix = ""): Promise<string[]> {
    const out: string[] = [];
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) out.push(...(await handlerFiles(join(dir, e.name), rel)));
      else if (e.name.endsWith(".ts") && !e.name.endsWith(".test.ts")) out.push(rel);
    }
    return out;
  }

  const dir = join(process.cwd(), "api");
  const files = await handlerFiles(dir);
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

/*
  Vercel 은 `export default` 를 Node 스타일 `(req, res) => void` 로 본다.
  Web 스타일로 `Response` 를 return 하면 그 값이 **버려지고** 응답이 쓰이지 않아
  요청이 매달린다 — 504 또는 무응답. 로컬에서는 핸들러를 직접 호출하니 멀쩡해
  보이고, 빌드·타입체크·테스트가 전부 통과한다. 배포해야만 드러난다.

    WARN: default export returned a `Response`.
          The default-export signature is `(req, res) => void` — returns are ignored.
*/
test("api/ 핸들러는 export default 가 아니라 이름 있는 HTTP 메서드를 쓴다", async () => {
  const { readdir, readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  // 하위 폴더까지 본다. api/admin/*.ts 처럼 중첩된 라우트도 같은 제약을 받는데,
  // 한 단계만 훑으면 그것들이 조용히 빠져나간다.
  async function handlerFiles(dir: string, prefix = ""): Promise<string[]> {
    const out: string[] = [];
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) out.push(...(await handlerFiles(join(dir, e.name), rel)));
      else if (e.name.endsWith(".ts") && !e.name.endsWith(".test.ts")) out.push(rel);
    }
    return out;
  }

  const dir = join(process.cwd(), "api");
  const files = await handlerFiles(dir);
  expect(files.length).toBeGreaterThan(0);

  const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
  for (const f of files) {
    const src = await readFile(join(dir, f), "utf8");
    expect(/^\s*export\s+default\b/m.test(src), `${f}: export default 금지`).toBe(false);
    const has = METHODS.some((m) =>
      new RegExp(`^\\s*export\\s+(?:async\\s+)?function\\s+${m}\\b`, "m").test(src),
    );
    expect(has, `${f}: GET/POST 같은 이름 있는 메서드 export 가 없다`).toBe(true);
  }
});
