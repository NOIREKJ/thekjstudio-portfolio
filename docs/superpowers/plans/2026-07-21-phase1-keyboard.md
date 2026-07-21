# Phase 1 (건반) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 누르면 소리가 나고 작업물이 열리는 진입 화면을 가진 사이트를, 템플릿 유산이 전혀 없는 백지에서 만든다.

**Architecture:** 오디오 엔진은 화면을 전혀 모르는 순수 모듈(AudioContext는 주입받아 테스트 가능)이고, 화면은 `play(id)`만 호출한다. 작업물은 `src/works/*.md` 파일 하나가 건반 하나가 되며, frontmatter 파싱과 음이름→주파수 변환은 각각 독립된 순수 함수다. 상세 페이지는 조용한 문서다.

**Tech Stack:** Vite · React 19 · TypeScript · react-router · Web Audio API (라이브러리 없음) · CSS Modules · Vitest + Testing Library

**설계 문서:** `docs/superpowers/specs/2026-07-21-instrument-site-design.md`

## Global Constraints

모든 태스크의 요구사항에 아래가 암묵적으로 포함된다.

- **소리 없이도 완전히 작동해야 한다.** 소리는 덤이지 관문이 아니다. 음소거 상태·자동재생 차단 상태에서도 모든 정보에 도달할 수 있어야 한다.
- **자동재생 금지 대응.** 첫 사용자 제스처 이전에는 소리를 내지 않는다. 무음 상태에서도 시각 반응은 완전히 살아있어야 한다.
- **키보드 조작.** Tab·화살표로 건반 이동, Enter/Space로 누르기.
- **모바일 멀티터치.** 두 손가락 동시 입력이 화음이 되어야 한다.
- **`prefers-reduced-motion` 존중.** 모션은 줄이되 기능은 유지한다.
- **음소거 토글은 항상 보이는 곳에 둔다.**
- **경계:** 오디오 엔진은 DOM·React를 import하지 않는다. 화면은 AudioContext를 직접 만지지 않는다.
- **작업물 추가 = md 파일 하나 추가.** 코드 수정이 필요하면 설계 위반이다.
- **피아노는 기본값이 아니다.** 건반의 형태는 CSS로만 바뀔 수 있어야 하며, Phase 1 기본형은 색면(color field) 타일이다.
- **상세 페이지에서는 실험하지 않는다.** 읽기 편한 조용한 문서다.
- **Once UI / Magic Portfolio에서 유래한 파일이 한 개도 남지 않아야 한다.**
- **한일페이(HANIL Pay) 제품과 그 웹은 별개 저장소의 별개 제품이다. 어떤 이유로도 건드리지 않는다.** 이 사이트에는 소개 글로만 존재한다.
- 브랜치는 `v2`. `main`은 기존 사이트를 계속 서비스하므로 절대 건드리지 않는다.

## File Structure

| 파일 | 책임 |
|---|---|
| `src/lib/frontmatter.ts` | md 원문 → `{ data, body }`. 순수 함수, 의존성 없음 |
| `src/lib/note.ts` | `"E4"` → 주파수(Hz). 순수 함수 |
| `src/lib/works.ts` | md 글롭 → `Work[]`. 파싱 로직은 `buildWorks()`로 분리해 테스트 |
| `src/audio/engine.ts` | 잠금 해제·프리로드·재생·합성음 폴백·음소거. **화면을 모름** |
| `src/audio/types.ts` | `AudioEngine`, `SoundSpec`, `EngineState` |
| `src/components/Key.tsx` | 건반 하나. 누름 상태와 접근성만 담당 |
| `src/components/Keyboard.tsx` | 건반 배치와 입력(클릭·키보드·터치) 라우팅 |
| `src/components/WorkPanel.tsx` | 눌린 건반의 인라인 미리보기 |
| `src/components/MuteToggle.tsx` | 음소거 토글 |
| `src/routes/Home.tsx` | 진입 화면 조립 + 엔진 수명주기 |
| `src/routes/Work.tsx` | 작업물 상세 (조용한 문서) |
| `src/routes/About.tsx` | 소개 |
| `src/works/*.md` | 작업물 = 건반. 파일 하나가 하나 |

### 상호작용 설계 (구현 전 확정 사항)

**건반을 누르면 즉시 이동하지 않는다.** 누름 = 소리 + 아래 인라인 패널 표시.
패널 안의 링크를 눌러야 상세 페이지로 이동한다.

이유: 누르자마자 이동하면 **화음을 칠 수 없다.** 화음이 이 사이트의 핵심이므로 이동은 두 번째 동작이어야 한다.

### 음 배정 (5음 음계)

C 장조 5음 음계(pentatonic)를 쓴다. **어떤 조합으로 눌러도 불협이 되지 않는다** — 방문자가 마구 눌러도 음악이 되는 것이 이 사이트의 Randomizer다.

| slug | kind | note | 연도 |
|---|---|---|---|
| `consolation` | music | C4 | 2024 |
| `streetlight` | music | D4 | 2024 |
| `noire` | app | E4 | 2026 |
| `hanilpay` | app | G4 | 2026 |
| `koinon` | app | A4 | 2026 |

---

### Task 1: 백지 — 템플릿 제거 및 Vite 셋업

**Files:**
- Delete: `src/` 전체, `public/images/projects/project-01/{avatar-01.jpg,cover-01.jpg,cover-02.jpg,cover-03.jpg,cover-04.jpg,image-03.jpg,video-01.mp4}`, `public/images/og/`, `public/trademarks/`, `next.config.mjs`, `next-env.d.ts`, `package.json`, `package-lock.json`, `tsconfig.json`, `biome.json`, `.eslintrc.json`, `.lintstagedrc.js`, `.agents`, `.vscode/`, `.github/`, `node_modules/`, `README.md`, `LICENSE`, `CLAUDE.md`
- Preserve: `docs/`, `.git/`, `.gitignore`, `public/images/kimjoonmain.jpeg`, `public/images/gallery/`, `public/images/projects/hanil-pay/`, `public/images/projects/hanil-church/`, `public/images/projects/project-01/{horizontal-1-noire.png,horizontal-kj-01.png,horizontal-kj-02.png}`
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/vite-env.d.ts`, `src/test-setup.ts`, `src/styles/global.css`, `src/App.tsx`, `src/smoke.test.tsx`, `LICENSE`, `README.md`

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces: 동작하는 Vite + Vitest 툴체인. 이후 모든 태스크가 `npm test`, `npm run dev`, `npm run build`에 의존한다.

- [ ] **Step 1: 브랜치 확인 — `main`이면 즉시 중단**

```bash
git branch --show-current
```

Expected: `v2`. 다른 값이면 **작업을 멈추고 보고할 것.**

- [ ] **Step 2: 보존할 이미지를 안전한 곳으로 옮긴다**

```bash
mkdir -p /tmp/kj-keep
cp -R public/images/kimjoonmain.jpeg /tmp/kj-keep/
cp -R public/images/gallery /tmp/kj-keep/
mkdir -p /tmp/kj-keep/projects/hanil-pay /tmp/kj-keep/projects/hanil-church /tmp/kj-keep/projects/noire
cp -R public/images/projects/hanil-pay/. /tmp/kj-keep/projects/hanil-pay/
cp -R public/images/projects/hanil-church/. /tmp/kj-keep/projects/hanil-church/
cp public/images/projects/project-01/horizontal-1-noire.png \
   public/images/projects/project-01/horizontal-kj-01.png \
   public/images/projects/project-01/horizontal-kj-02.png \
   /tmp/kj-keep/projects/noire/
ls -R /tmp/kj-keep | head -40
```

Expected: 프로필 1장, 갤러리 8장, hanil-pay 11장, hanil-church 6장, noire 3장.

- [ ] **Step 3: 템플릿 유래물 전량 삭제**

```bash
rm -rf src public node_modules .vscode .github
rm -f next.config.mjs next-env.d.ts package.json package-lock.json \
      tsconfig.json biome.json .eslintrc.json .lintstagedrc.js \
      .agents README.md LICENSE CLAUDE.md
ls -a
```

Expected: `.git`, `.gitignore`, `docs`, `.superpowers` 만 남는다.

- [ ] **Step 4: 보존 이미지를 되돌린다**

```bash
mkdir -p public/images/projects
cp /tmp/kj-keep/kimjoonmain.jpeg public/images/
cp -R /tmp/kj-keep/gallery public/images/
cp -R /tmp/kj-keep/projects/. public/images/projects/
find public -type f | wc -l
```

Expected: `29` (1 + 8 + 11 + 6 + 3).

- [ ] **Step 5: 의존성 설치**

버전은 고정하지 않고 설치 시점의 최신을 쓴다. 설치 후 `package.json`에 기록된 값이 곧 이 프로젝트의 버전이다.

```bash
npm init -y
npm install react@latest react-dom@latest react-router@latest
npm install -D vite@latest @vitejs/plugin-react@latest typescript@latest \
  vitest@latest jsdom@latest @testing-library/react@latest \
  @testing-library/jest-dom@latest @testing-library/user-event@latest \
  @types/react@latest @types/react-dom@latest
```

- [ ] **Step 6: `package.json`의 이름·스크립트·모듈 형식을 교체한다**

`package.json`의 `name`, `private`, `type`, `scripts` 필드를 아래로 바꾼다. `dependencies`/`devDependencies`는 Step 5가 기록한 값을 **그대로 둔다.**

```json
{
  "name": "thekjstudio",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 7: 설정 파일 4개를 만든다**

`vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
});
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

`index.html`:

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>the KJ Studio</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/test-setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 8: 최소 앱 진입점을 만든다**

`src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

`src/styles/global.css`:

```css
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, -apple-system, "Apple SD Gothic Neo", sans-serif; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

`src/App.tsx`:

```tsx
export default function App() {
  return <h1>the KJ Studio</h1>;
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 9: 툴체인이 살아있는지 확인하는 실패 테스트를 쓴다**

`src/smoke.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import App from "./App";

test("앱이 렌더링된다", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "the KJ Studio" })).toBeInTheDocument();
});
```

- [ ] **Step 10: 테스트를 실행해 통과를 확인한다**

Run: `npm test`
Expected: `1 passed`. 실패하면 다음 단계로 넘어가지 말 것 — 툴체인 문제다.

- [ ] **Step 11: 빌드가 되는지 확인한다**

Run: `npm run build`
Expected: 에러 없이 `dist/` 생성.

- [ ] **Step 12: 본인 명의 라이선스와 README를 쓴다**

`LICENSE` (연도와 이름은 그대로 사용):

```
MIT License

Copyright (c) 2026 Joon Kim (the KJ Studio)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**주의:** 코드는 MIT이지만 `public/images/` 이하의 사진·음악·글은 저작물이다. README에 아래를 명시한다.

`README.md`:

```markdown
# the KJ Studio

작곡가이자 앱 개발자 Joon Kim의 개인 사이트.
누르면 소리가 나고 작업이 열리는 진입 화면을 가진다.

## 개발

    npm install
    npm run dev      # 개발 서버
    npm test         # 테스트
    npm run build    # 프로덕션 빌드

설계 문서는 `docs/superpowers/specs/` 에 있다.

## 라이선스

코드는 MIT (`LICENSE`).
`public/images/` 이하의 사진, `src/works/` 의 글, 그리고 사이트에 쓰인
음원은 저작권자에게 권리가 있으며 MIT 범위에 포함되지 않는다.
```

- [ ] **Step 13: 템플릿 유래물이 정말 0개인지 확인한다**

```bash
grep -ril "once-ui\|magic-portfolio\|once ui" . \
  --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=docs --exclude-dir=.superpowers
```

Expected: **출력 없음.** 결과가 나오면 해당 파일을 지우거나 고친 뒤 다시 실행한다.

- [ ] **Step 14: `.gitignore`를 정리하고 커밋한다**

`.gitignore`를 아래로 교체한다:

```
node_modules
dist
.DS_Store
*.local
.superpowers/
```

```bash
git add -A
git commit -m "백지: 템플릿 제거하고 Vite+React+Vitest로 재출발

Once UI / Magic Portfolio 유래 코드·에셋·문서를 전량 제거하고
CC BY-NC 4.0 라이선스를 본인 명의 MIT로 교체했다.
본인이 촬영·제작한 이미지 29장만 보존."
```

---

### Task 2: frontmatter 파서

**Files:**
- Create: `src/lib/frontmatter.ts`
- Test: `src/lib/frontmatter.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `parseFrontmatter(raw: string): { data: Record<string, string | number>; body: string }`
  — Task 3의 `buildWorks()`가 사용한다.

gray-matter를 쓰지 않는 이유: 브라우저에서 `Buffer` 폴리필이 필요하다. 우리에게 필요한 문법은 `key: value` 한 겹뿐이므로 직접 만든다.

- [ ] **Step 1: 실패 테스트를 쓴다**

`src/lib/frontmatter.test.ts`:

```ts
import { parseFrontmatter } from "./frontmatter";

test("frontmatter와 본문을 분리한다", () => {
  const raw = `---
title: "위로 (Consolation)"
kind: music
year: 2024
---
첫 문단입니다.`;
  const { data, body } = parseFrontmatter(raw);
  expect(data.title).toBe("위로 (Consolation)");
  expect(data.kind).toBe("music");
  expect(data.year).toBe(2024);
  expect(body).toBe("첫 문단입니다.");
});

test("따옴표는 벗기고 값 안의 콜론은 보존한다", () => {
  const { data } = parseFrontmatter(`---\ntitle: "NOIRE: 개인 비서"\n---\n`);
  expect(data.title).toBe("NOIRE: 개인 비서");
});

test("frontmatter가 없으면 전체가 본문이다", () => {
  const { data, body } = parseFrontmatter("그냥 글");
  expect(data).toEqual({});
  expect(body).toBe("그냥 글");
});

test("빈 줄과 주석 줄은 무시한다", () => {
  const { data } = parseFrontmatter(`---\n\n# 주석\nkind: app\n---\n본문`);
  expect(data).toEqual({ kind: "app" });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- frontmatter`
Expected: FAIL — `Failed to resolve import "./frontmatter"`

- [ ] **Step 3: 구현한다**

`src/lib/frontmatter.ts`:

```ts
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
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- frontmatter`
Expected: `4 passed`

- [ ] **Step 5: 커밋한다**

```bash
git add src/lib/frontmatter.ts src/lib/frontmatter.test.ts
git commit -m "frontmatter 파서 추가 (의존성 없는 순수 함수)"
```

---

### Task 3: 작업물 데이터

**Files:**
- Create: `src/lib/works.ts`, `src/works/consolation.md`, `src/works/streetlight.md`, `src/works/noire.md`, `src/works/hanilpay.md`, `src/works/koinon.md`
- Test: `src/lib/works.test.ts`

**Interfaces:**
- Consumes: `parseFrontmatter` (Task 2)
- Produces:
  - `type Work = { slug: string; title: string; kind: "music" | "app"; note: string; sound?: string; year: number; body: string }`
  - `buildWorks(modules: Record<string, string>): Work[]` — 순수, 정렬 포함
  - `getWorks(): Work[]` / `getWork(slug: string): Work | undefined`
  - Task 5·6·7이 모두 사용한다.

**본문은 지금 짧게 쓴다.** 설계 문서 §11에 따라 글의 호흡은 건반 형태가 정해진 뒤에 정한다. 여기서는 각 3~4문장의 임시 본문을 쓰되, **템플릿 글을 복사하지 않고 새로 쓴다.**

- [ ] **Step 1: 실패 테스트를 쓴다**

`src/lib/works.test.ts`:

```ts
import { buildWorks } from "./works";

const modules = {
  "/src/works/noire.md": `---\ntitle: "NOIRE"\nkind: app\nnote: E4\nyear: 2026\n---\n본문 N`,
  "/src/works/consolation.md": `---\ntitle: "위로"\nkind: music\nnote: C4\nyear: 2024\n---\n본문 C`,
};

test("파일명에서 slug를 뽑는다", () => {
  const works = buildWorks(modules);
  expect(works.map((w) => w.slug).sort()).toEqual(["consolation", "noire"]);
});

test("연도 내림차순으로 정렬한다", () => {
  expect(buildWorks(modules)[0].slug).toBe("noire");
});

test("frontmatter를 타입이 있는 필드로 옮긴다", () => {
  const noire = buildWorks(modules).find((w) => w.slug === "noire")!;
  expect(noire.title).toBe("NOIRE");
  expect(noire.kind).toBe("app");
  expect(noire.note).toBe("E4");
  expect(noire.year).toBe(2026);
  expect(noire.body).toBe("본문 N");
  expect(noire.sound).toBeUndefined();
});

test("sound가 있으면 그대로 싣는다", () => {
  const works = buildWorks({
    "/src/works/x.md": `---\ntitle: "X"\nkind: music\nnote: C4\nyear: 2024\nsound: /audio/x.mp3\n---\n본문`,
  });
  expect(works[0].sound).toBe("/audio/x.mp3");
});

test("필수 필드가 없으면 어느 파일인지 알려주며 실패한다", () => {
  expect(() => buildWorks({ "/src/works/bad.md": `---\ntitle: "X"\n---\n본문` })).toThrow(
    /bad\.md/,
  );
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- works`
Expected: FAIL — `Failed to resolve import "./works"`

- [ ] **Step 3: 구현한다**

`src/lib/works.ts`:

```ts
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
```

- [ ] **Step 4: 작업물 md 5개를 쓴다**

`src/works/consolation.md`:

```markdown
---
title: "위로 (Consolation)"
kind: music
note: C4
year: 2024
---

말로 하기 어려운 것을 소리로 옮긴 곡.

누군가를 위로하려 할 때 우리는 대개 말을 너무 많이 한다. 이 곡은 그
반대편에서 시작했다. 아무 말도 하지 않고 옆에 앉아 있는 시간에 가까운 음악.
```

`src/works/streetlight.md`:

```markdown
---
title: "가로등 (Streetlight)"
kind: music
note: D4
year: 2024
---

밤길에 하나씩 켜지는 것들에 대하여.

가로등은 누구를 위해 켜졌는지 밝히지 않는다. 그냥 켜져 있고, 지나가는 사람이
그 빛을 쓴다. 그런 종류의 다정함을 담고 싶었다.
```

`src/works/noire.md`:

```markdown
---
title: "NOIRE"
kind: app
note: E4
year: 2026
---

중요한 것들을 한자리에 두는 개인 비서 앱.

자산도 시간도 습관도, 흩어져 있을 때는 관리 대상이 아니라 불안의 재료가 된다.
NOIRE는 그것들을 한 화면에 조용히 모아두는 일만 한다. 어두운 화면을 고른 이유는
멋있어서가 아니라, 도구가 먼저 눈에 띄지 않아야 하기 때문이다.

현재 개발 중.
```

`src/works/hanilpay.md`:

```markdown
---
title: "한일페이 (HANIL Pay)"
kind: app
note: G4
year: 2026
---

교회 안에서 지갑 없이 결제하는 서비스.

카페에서 커피 한 잔 사는 데 현금을 찾거나 카드를 꺼내야 하는 작은 번거로움이,
생각보다 자주 사람을 망설이게 한다. 그 망설임을 없애는 것이 이 앱의 전부다.
결제는 빠를수록 좋고, 티가 안 날수록 좋다.
```

`src/works/koinon.md`:

```markdown
---
title: "KOINON (코이논)"
kind: app
note: A4
year: 2026
---

신앙생활에 필요한 것들을 한 곳에 모은 플랫폼.

교회에서 쓰는 도구는 대개 흩어져 있다. 명부는 명부대로, 공지는 공지대로.
KOINON은 그 조각들을 하나의 자리로 옮겨서, 관리하는 사람이 관리에 쓰는
시간을 줄이도록 만들었다.
```

- [ ] **Step 5: 테스트와 실제 로딩을 함께 확인한다**

Run: `npm test -- works`
Expected: `5 passed`

Run: `npm run build`
Expected: 성공. `import.meta.glob`이 md 5개를 실제로 읽는지 검증된다.

- [ ] **Step 6: 커밋한다**

```bash
git add src/lib/works.ts src/lib/works.test.ts src/works
git commit -m "작업물 데이터 추가 — md 파일 하나가 건반 하나"
```

---

### Task 4: 음이름 → 주파수

**Files:**
- Create: `src/lib/note.ts`
- Test: `src/lib/note.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `noteToFrequency(note: string): number` — Task 5의 합성음 폴백이 사용한다.

- [ ] **Step 1: 실패 테스트를 쓴다**

`src/lib/note.test.ts`:

```ts
import { noteToFrequency } from "./note";

test("A4는 440Hz다", () => {
  expect(noteToFrequency("A4")).toBeCloseTo(440, 5);
});

test("한 옥타브 위는 두 배다", () => {
  expect(noteToFrequency("A5")).toBeCloseTo(880, 5);
});

test("5음 음계의 음들을 변환한다", () => {
  expect(noteToFrequency("C4")).toBeCloseTo(261.626, 2);
  expect(noteToFrequency("D4")).toBeCloseTo(293.665, 2);
  expect(noteToFrequency("E4")).toBeCloseTo(329.628, 2);
  expect(noteToFrequency("G4")).toBeCloseTo(391.995, 2);
});

test("올림표를 처리한다", () => {
  expect(noteToFrequency("F#4")).toBeCloseTo(369.994, 2);
});

test("알 수 없는 음이름은 실패한다", () => {
  expect(() => noteToFrequency("H9")).toThrow(/H9/);
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- note`
Expected: FAIL — `Failed to resolve import "./note"`

- [ ] **Step 3: 구현한다**

`src/lib/note.ts`:

```ts
const SEMITONES: Record<string, number> = {
  C: -9, "C#": -8, D: -7, "D#": -6, E: -5, F: -4,
  "F#": -3, G: -2, "G#": -1, A: 0, "A#": 1, B: 2,
};

const PATTERN = /^([A-G]#?)(-?\d)$/;
const A4 = 440;

export function noteToFrequency(note: string): number {
  const match = note.match(PATTERN);
  if (!match) throw new Error(`알 수 없는 음이름입니다: ${note}`);

  const [, name, octave] = match;
  const semitonesFromA4 = SEMITONES[name] + (Number(octave) - 4) * 12;
  return A4 * Math.pow(2, semitonesFromA4 / 12);
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- note`
Expected: `6 passed`

- [ ] **Step 5: 커밋한다**

```bash
git add src/lib/note.ts src/lib/note.test.ts
git commit -m "음이름을 주파수로 바꾸는 순수 함수 추가"
```

---

### Task 5: 오디오 엔진

**Files:**
- Create: `src/audio/types.ts`, `src/audio/engine.ts`
- Test: `src/audio/engine.test.ts`

**Interfaces:**
- Consumes: `noteToFrequency` (Task 4)
- Produces:
  - `type SoundSpec = { id: string; note: string; sound?: string }`
  - `type EngineState = "locked" | "ready"`
  - `interface AudioEngine { getState(): EngineState; unlock(): Promise<void>; preload(specs: SoundSpec[]): Promise<void>; play(id: string): void; setMuted(muted: boolean): void; isMuted(): boolean }`
  - `createAudioEngine(options?: { createContext?: () => AudioContext; fetchSample?: (url: string) => Promise<ArrayBuffer> }): AudioEngine`
  - Task 6의 `Home`이 사용한다.

**이 모듈은 React도 DOM도 import하지 않는다.** AudioContext와 fetch를 주입받으므로 테스트가 가능하다.

- [ ] **Step 1: 타입을 정의한다**

`src/audio/types.ts`:

```ts
export type SoundSpec = { id: string; note: string; sound?: string };

export type EngineState = "locked" | "ready";

export interface AudioEngine {
  getState(): EngineState;
  unlock(): Promise<void>;
  preload(specs: SoundSpec[]): Promise<void>;
  play(id: string): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
}
```

- [ ] **Step 2: 실패 테스트를 쓴다**

`src/audio/engine.test.ts`:

```ts
import { createAudioEngine } from "./engine";

class FakeParam {
  value = 0;
  calls: string[] = [];
  setValueAtTime(v: number) { this.value = v; this.calls.push("set"); return this; }
  linearRampToValueAtTime(v: number) { this.value = v; this.calls.push("ramp"); return this; }
  exponentialRampToValueAtTime(v: number) { this.value = v; this.calls.push("exp"); return this; }
}

class FakeNode {
  connected: FakeNode[] = [];
  started = false;
  stopped = false;
  frequency = new FakeParam();
  gain = new FakeParam();
  buffer: unknown = null;
  type = "sine";
  connect(target: FakeNode) { this.connected.push(target); return target; }
  disconnect() {}
  start() { this.started = true; }
  stop() { this.stopped = true; }
}

class FakeAudioContext {
  state: "suspended" | "running" = "suspended";
  currentTime = 0;
  destination = new FakeNode();
  oscillators: FakeNode[] = [];
  sources: FakeNode[] = [];
  decodeCalls = 0;
  async resume() { this.state = "running"; }
  createOscillator() { const n = new FakeNode(); this.oscillators.push(n); return n; }
  createBufferSource() { const n = new FakeNode(); this.sources.push(n); return n; }
  createGain() { return new FakeNode(); }
  async decodeAudioData() { this.decodeCalls++; return { duration: 1 }; }
}

function setup(opts: { fetchSample?: (url: string) => Promise<ArrayBuffer> } = {}) {
  const ctx = new FakeAudioContext();
  const engine = createAudioEngine({
    createContext: () => ctx as unknown as AudioContext,
    fetchSample: opts.fetchSample ?? (async () => new ArrayBuffer(8)),
  });
  return { ctx, engine };
}

test("처음에는 잠겨 있다", () => {
  const { engine } = setup();
  expect(engine.getState()).toBe("locked");
});

test("unlock 후 준비 상태가 되고 컨텍스트가 재개된다", async () => {
  const { ctx, engine } = setup();
  await engine.unlock();
  expect(engine.getState()).toBe("ready");
  expect(ctx.state).toBe("running");
});

test("잠긴 상태에서 play를 불러도 던지지 않고 소리도 내지 않는다", () => {
  const { ctx, engine } = setup();
  expect(() => engine.play("a")).not.toThrow();
  expect(ctx.oscillators).toHaveLength(0);
});

test("sound가 없으면 합성음으로 재생한다", async () => {
  const { ctx, engine } = setup();
  await engine.unlock();
  await engine.preload([{ id: "a", note: "C4" }]);
  engine.play("a");
  expect(ctx.oscillators).toHaveLength(1);
  expect(ctx.oscillators[0].started).toBe(true);
  expect(ctx.oscillators[0].frequency.value).toBeCloseTo(261.626, 2);
});

test("sound가 있으면 샘플을 받아 재생한다", async () => {
  const { ctx, engine } = setup();
  await engine.unlock();
  await engine.preload([{ id: "a", note: "C4", sound: "/audio/a.mp3" }]);
  expect(ctx.decodeCalls).toBe(1);
  engine.play("a");
  expect(ctx.sources).toHaveLength(1);
  expect(ctx.oscillators).toHaveLength(0);
});

test("샘플 로딩이 실패하면 던지지 않고 합성음으로 물러난다", async () => {
  const { ctx, engine } = setup({
    fetchSample: async () => { throw new Error("404"); },
  });
  await engine.unlock();
  await expect(
    engine.preload([{ id: "a", note: "C4", sound: "/audio/missing.mp3" }]),
  ).resolves.toBeUndefined();
  engine.play("a");
  expect(ctx.oscillators).toHaveLength(1);
});

test("음소거 상태에서는 소리를 내지 않는다", async () => {
  const { ctx, engine } = setup();
  await engine.unlock();
  await engine.preload([{ id: "a", note: "C4" }]);
  engine.setMuted(true);
  engine.play("a");
  expect(ctx.oscillators).toHaveLength(0);
  expect(engine.isMuted()).toBe(true);
});

test("모르는 id는 조용히 무시한다", async () => {
  const { ctx, engine } = setup();
  await engine.unlock();
  await engine.preload([{ id: "a", note: "C4" }]);
  expect(() => engine.play("없음")).not.toThrow();
  expect(ctx.oscillators).toHaveLength(0);
});

test("동시에 여러 음을 낼 수 있다 (화음)", async () => {
  const { ctx, engine } = setup();
  await engine.unlock();
  await engine.preload([{ id: "a", note: "C4" }, { id: "b", note: "E4" }]);
  engine.play("a");
  engine.play("b");
  engine.play("a");
  expect(ctx.oscillators).toHaveLength(3);
});
```

- [ ] **Step 3: 실패를 확인한다**

Run: `npm test -- engine`
Expected: FAIL — `Failed to resolve import "./engine"`

- [ ] **Step 4: 구현한다**

`src/audio/engine.ts`:

```ts
import { noteToFrequency } from "../lib/note";
import type { AudioEngine, EngineState, SoundSpec } from "./types";

type Loaded = { note: string; buffer: AudioBuffer | null };

const ATTACK = 0.005;
const DECAY = 1.6;
const PEAK = 0.22;

export function createAudioEngine(options: {
  createContext?: () => AudioContext;
  fetchSample?: (url: string) => Promise<ArrayBuffer>;
} = {}): AudioEngine {
  const createContext =
    options.createContext ?? (() => new AudioContext());
  const fetchSample =
    options.fetchSample ??
    (async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${url}: ${response.status}`);
      return response.arrayBuffer();
    });

  let context: AudioContext | null = null;
  let state: EngineState = "locked";
  let muted = false;
  const loaded = new Map<string, Loaded>();

  async function unlock(): Promise<void> {
    if (state === "ready") return;
    context = createContext();
    await context.resume();
    state = "ready";
  }

  async function preload(specs: SoundSpec[]): Promise<void> {
    await Promise.all(
      specs.map(async (spec) => {
        let buffer: AudioBuffer | null = null;
        if (spec.sound && context) {
          try {
            const data = await fetchSample(spec.sound);
            buffer = await context.decodeAudioData(data);
          } catch {
            // 샘플이 없거나 깨졌으면 합성음으로 물러난다. 실패시키지 않는다.
            buffer = null;
          }
        }
        loaded.set(spec.id, { note: spec.note, buffer });
      }),
    );
  }

  function play(id: string): void {
    if (state !== "ready" || muted || !context) return;
    const entry = loaded.get(id);
    if (!entry) return;

    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(PEAK, now + ATTACK);
    gain.connect(context.destination);

    if (entry.buffer) {
      const source = context.createBufferSource();
      source.buffer = entry.buffer;
      source.connect(gain);
      source.start();
      return;
    }

    const osc = context.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(noteToFrequency(entry.note), now);
    osc.connect(gain);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + DECAY);
    osc.start();
    osc.stop(now + DECAY);
  }

  return {
    getState: () => state,
    unlock,
    preload,
    play,
    setMuted: (value: boolean) => { muted = value; },
    isMuted: () => muted,
  };
}
```

- [ ] **Step 5: 통과를 확인한다**

Run: `npm test -- engine`
Expected: `9 passed`

- [ ] **Step 6: 경계가 지켜졌는지 확인한다**

```bash
grep -n "react\|document\|window" src/audio/engine.ts
```

Expected: **출력 없음.** 엔진은 화면을 몰라야 한다.

- [ ] **Step 7: 커밋한다**

```bash
git add src/audio
git commit -m "오디오 엔진 추가 — 화면을 모르는 순수 모듈, 합성음 폴백 포함"
```

---

### Task 6: 건반 화면

**Files:**
- Create: `src/components/Key.tsx`, `src/components/Key.module.css`, `src/components/Keyboard.tsx`, `src/components/Keyboard.module.css`, `src/components/useLetterKeys.ts`, `src/components/WorkPanel.tsx`, `src/components/WorkPanel.module.css`, `src/components/MuteToggle.tsx`
- Test: `src/components/Keyboard.test.tsx`, `src/components/useLetterKeys.test.tsx`

**Interfaces:**
- Consumes: `Work`, `getWorks` (Task 3); `AudioEngine` (Task 5)
- Produces:
  - `<Keyboard works={Work[]} onPress={(slug: string) => void} selected={string | null} />` — 글자 키 연주를 내부에서 처리한다
  - `useLetterKeys(slugs: string[], onPress: (slug: string) => void): void`
  - `<WorkPanel work={Work} />`
  - `<MuteToggle muted={boolean} onToggle={() => void} />`
  - Task 7의 `Home`이 조립한다.

**형태에 대한 지시:** 건반은 **색면 타일**이다. 피아노 흰건반/검은건반을 만들지 말 것. 모양·크기·색은 전부 CSS 커스텀 속성으로 노출해서, 나중에 형태를 바꿀 때 `.tsx`를 건드리지 않아도 되게 한다.

- [ ] **Step 1: 실패 테스트를 쓴다**

`src/components/Keyboard.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Keyboard } from "./Keyboard";
import type { Work } from "../lib/works";

const works: Work[] = [
  { slug: "noire", title: "NOIRE", kind: "app", note: "E4", year: 2026, body: "본문 N" },
  { slug: "consolation", title: "위로", kind: "music", note: "C4", year: 2024, body: "본문 C" },
];

test("작업물마다 건반을 하나씩 그린다", () => {
  render(<Keyboard works={works} selected={null} onPress={() => {}} />);
  expect(screen.getAllByRole("button")).toHaveLength(2);
});

test("건반에 작업물 제목이 접근 가능한 이름으로 붙는다", () => {
  render(<Keyboard works={works} selected={null} onPress={() => {}} />);
  expect(screen.getByRole("button", { name: /NOIRE/ })).toBeInTheDocument();
});

test("클릭하면 slug와 함께 onPress가 불린다", async () => {
  const onPress = vi.fn();
  render(<Keyboard works={works} selected={null} onPress={onPress} />);
  await userEvent.click(screen.getByRole("button", { name: /NOIRE/ }));
  expect(onPress).toHaveBeenCalledWith("noire");
});

test("Enter로도 누를 수 있다", async () => {
  const onPress = vi.fn();
  render(<Keyboard works={works} selected={null} onPress={onPress} />);
  screen.getByRole("button", { name: /NOIRE/ }).focus();
  await userEvent.keyboard("{Enter}");
  expect(onPress).toHaveBeenCalledWith("noire");
});

test("선택된 건반만 aria-pressed가 참이다", () => {
  render(<Keyboard works={works} selected="noire" onPress={() => {}} />);
  expect(screen.getByRole("button", { name: /NOIRE/ })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: /위로/ })).toHaveAttribute("aria-pressed", "false");
});

test("종류를 눈으로만이 아니라 텍스트로도 알 수 있다", () => {
  render(<Keyboard works={works} selected={null} onPress={() => {}} />);
  expect(screen.getByRole("button", { name: /NOIRE/ })).toHaveTextContent("app");
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- Keyboard`
Expected: FAIL — `Failed to resolve import "./Keyboard"`

- [ ] **Step 3: `Key`를 만든다**

`src/components/Key.module.css`:

```css
.key {
  --key-radius: 14px;
  --key-min-height: 180px;
  --key-tint: 200;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 4px;
  min-height: var(--key-min-height);
  padding: 16px;
  border: none;
  border-radius: var(--key-radius);
  background: hsl(var(--key-tint) 30% 92%);
  color: hsl(var(--key-tint) 40% 20%);
  text-align: left;
  cursor: pointer;
  transition: transform 120ms ease, background-color 120ms ease;
}

.key:hover { background: hsl(var(--key-tint) 35% 88%); }

.key:focus-visible {
  outline: 3px solid hsl(var(--key-tint) 50% 35%);
  outline-offset: 3px;
}

.key[aria-pressed="true"] {
  transform: translateY(6px);
  background: hsl(var(--key-tint) 45% 78%);
}

.music { --key-tint: 150; }
.app { --key-tint: 220; }

.title { font-size: 15px; font-weight: 650; }
.meta { font-size: 11px; opacity: 0.65; text-transform: lowercase; }
```

`src/components/Key.tsx`:

```tsx
import type { Work } from "../lib/works";
import styles from "./Key.module.css";

type Props = {
  work: Work;
  pressed: boolean;
  onPress: (slug: string) => void;
};

export function Key({ work, pressed, onPress }: Props) {
  return (
    <button
      type="button"
      className={`${styles.key} ${styles[work.kind]}`}
      aria-pressed={pressed}
      onPointerDown={() => onPress(work.slug)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onPress(work.slug);
        }
      }}
    >
      <span className={styles.title}>{work.title}</span>
      <span className={styles.meta}>
        {work.kind} · {work.year}
      </span>
    </button>
  );
}
```

`onPointerDown`을 쓰는 이유: 클릭은 손을 뗄 때 발생한다. 악기는 **누르는 순간** 소리가 나야 한다. 포인터 이벤트는 마우스·터치·펜을 한 번에 처리하므로 멀티터치 화음도 자연히 따라온다.

- [ ] **Step 4: `Keyboard`를 만든다**

`src/components/Keyboard.module.css`:

```css
.keyboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
  touch-action: manipulation;
}
```

`src/components/Keyboard.tsx`:

```tsx
import type { Work } from "../lib/works";
import { Key } from "./Key";
import styles from "./Keyboard.module.css";

type Props = {
  works: Work[];
  selected: string | null;
  onPress: (slug: string) => void;
};

export function Keyboard({ works, selected, onPress }: Props) {
  return (
    <div className={styles.keyboard} role="group" aria-label="작업물 건반">
      {works.map((work) => (
        <Key
          key={work.slug}
          work={work}
          pressed={selected === work.slug}
          onPress={onPress}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: 통과를 확인한다**

Run: `npm test -- Keyboard`
Expected: `6 passed`

- [ ] **Step 6: `WorkPanel`과 `MuteToggle`을 만든다**

`src/components/WorkPanel.module.css`:

```css
.panel {
  width: 100%;
  max-width: 640px;
  margin: 32px auto 0;
  padding: 0 16px;
}

.title { margin: 0 0 8px; font-size: 20px; }
.body { margin: 0 0 16px; line-height: 1.75; opacity: 0.8; white-space: pre-line; }
.link { font-size: 14px; }
```

`src/components/WorkPanel.tsx`:

```tsx
import { Link } from "react-router";
import type { Work } from "../lib/works";
import styles from "./WorkPanel.module.css";

export function WorkPanel({ work }: { work: Work }) {
  const preview = work.body.split("\n\n")[0] ?? "";

  return (
    <section className={styles.panel} aria-live="polite">
      <h2 className={styles.title}>{work.title}</h2>
      <p className={styles.body}>{preview}</p>
      <Link className={styles.link} to={`/work/${work.slug}`}>
        자세히 보기 →
      </Link>
    </section>
  );
}
```

`aria-live="polite"`가 중요하다. 소리를 못 듣는 사용자에게 "무언가 반응했다"를 전하는 것이 이 속성이다.

`src/components/MuteToggle.tsx`:

```tsx
export function MuteToggle({
  muted,
  onToggle,
}: {
  muted: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={muted}
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        padding: "8px 14px",
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,.15)",
        background: "rgba(255,255,255,.85)",
        cursor: "pointer",
        fontSize: 13,
      }}
    >
      {muted ? "소리 켜기" : "소리 끄기"}
    </button>
  );
}
```

- [ ] **Step 7: 글자 키 연주의 실패 테스트를 쓴다**

설계 문서 §3에 명시된 `A S D F` 연주다. 건반에 포커스를 두지 않고도 연주할 수 있어야 한다.

`src/components/useLetterKeys.test.tsx`에 추가:

```tsx
import { fireEvent, render } from "@testing-library/react";
import { useLetterKeys } from "./useLetterKeys";

function Harness({ onPress }: { onPress: (slug: string) => void }) {
  useLetterKeys(["consolation", "streetlight", "noire"], onPress);
  return <input aria-label="입력칸" />;
}

test("a s d 가 순서대로 건반에 대응한다", () => {
  const onPress = vi.fn();
  render(<Harness onPress={onPress} />);
  fireEvent.keyDown(window, { key: "a" });
  fireEvent.keyDown(window, { key: "d" });
  expect(onPress).toHaveBeenNthCalledWith(1, "consolation");
  expect(onPress).toHaveBeenNthCalledWith(2, "noire");
});

test("배정되지 않은 글자는 무시한다", () => {
  const onPress = vi.fn();
  render(<Harness onPress={onPress} />);
  fireEvent.keyDown(window, { key: "z" });
  expect(onPress).not.toHaveBeenCalled();
});

test("수식키를 누른 조합은 무시한다 (브라우저 단축키 보호)", () => {
  const onPress = vi.fn();
  render(<Harness onPress={onPress} />);
  fireEvent.keyDown(window, { key: "a", metaKey: true });
  fireEvent.keyDown(window, { key: "a", ctrlKey: true });
  expect(onPress).not.toHaveBeenCalled();
});

test("입력칸에 포커스가 있으면 무시한다", () => {
  const onPress = vi.fn();
  const { getByLabelText } = render(<Harness onPress={onPress} />);
  const input = getByLabelText("입력칸");
  input.focus();
  fireEvent.keyDown(window, { key: "a", target: input });
  expect(onPress).not.toHaveBeenCalled();
});

test("길게 눌러 생기는 반복 입력은 무시한다", () => {
  const onPress = vi.fn();
  render(<Harness onPress={onPress} />);
  fireEvent.keyDown(window, { key: "a", repeat: true });
  expect(onPress).not.toHaveBeenCalled();
});
```

Run: `npm test -- useLetterKeys`
Expected: FAIL — `Failed to resolve import "./useLetterKeys"`

- [ ] **Step 8: 글자 키 훅을 구현한다**

`src/components/useLetterKeys.ts`:

```ts
import { useEffect } from "react";

const LETTERS = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];

export function useLetterKeys(
  slugs: string[],
  onPress: (slug: string) => void,
): void {
  useEffect(() => {
    function handle(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.repeat) return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;

      const index = LETTERS.indexOf(event.key.toLowerCase());
      if (index === -1 || index >= slugs.length) return;

      onPress(slugs[index]);
    }

    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [slugs, onPress]);
}
```

`slugs` 배열은 렌더마다 새로 만들어지면 리스너가 계속 재등록된다. 호출부에서 `useMemo`로 감싼다 (Step 9).

- [ ] **Step 9: `Keyboard`가 훅을 쓰도록 고치고, 건반에 글자를 표시한다**

들리지 않는 안내는 안내가 아니다. **어떤 글자를 누르면 되는지 화면에 보여야 한다.**

`src/components/Keyboard.tsx`를 아래로 교체:

```tsx
import { useMemo } from "react";
import type { Work } from "../lib/works";
import { Key } from "./Key";
import { useLetterKeys } from "./useLetterKeys";
import styles from "./Keyboard.module.css";

const LETTERS = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];

type Props = {
  works: Work[];
  selected: string | null;
  onPress: (slug: string) => void;
};

export function Keyboard({ works, selected, onPress }: Props) {
  const slugs = useMemo(() => works.map((w) => w.slug), [works]);
  useLetterKeys(slugs, onPress);

  return (
    <div className={styles.keyboard} role="group" aria-label="작업물 건반">
      {works.map((work, index) => (
        <Key
          key={work.slug}
          work={work}
          letter={LETTERS[index]}
          pressed={selected === work.slug}
          onPress={onPress}
        />
      ))}
    </div>
  );
}
```

`src/components/Key.tsx`의 props와 본문을 아래로 교체 (`letter` 추가):

```tsx
import type { Work } from "../lib/works";
import styles from "./Key.module.css";

type Props = {
  work: Work;
  letter?: string;
  pressed: boolean;
  onPress: (slug: string) => void;
};

export function Key({ work, letter, pressed, onPress }: Props) {
  return (
    <button
      type="button"
      className={`${styles.key} ${styles[work.kind]}`}
      aria-pressed={pressed}
      onPointerDown={() => onPress(work.slug)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onPress(work.slug);
        }
      }}
    >
      {letter && (
        <span className={styles.letter} aria-hidden="true">
          {letter}
        </span>
      )}
      <span className={styles.title}>{work.title}</span>
      <span className={styles.meta}>
        {work.kind} · {work.year}
      </span>
    </button>
  );
}
```

`aria-hidden="true"`인 이유: 스크린리더에게 "a NOIRE app 2026"은 소음이다. 글자는 눈으로 보는 사람을 위한 것이고, 스크린리더 사용자는 Tab·Enter로 이미 조작할 수 있다.

`src/components/Key.module.css`에 추가:

```css
.letter {
  position: absolute;
  top: 12px;
  left: 16px;
  font-size: 11px;
  font-weight: 700;
  opacity: 0.45;
  text-transform: uppercase;
}
```

- [ ] **Step 10: 전체 테스트를 돌린다**

Run: `npm test`
Expected: 모두 통과 (Task 1~6 누적). Task 6의 기존 6개 테스트가 `letter` 추가 후에도 그대로 통과해야 한다.

- [ ] **Step 11: 커밋한다**

```bash
git add src/components
git commit -m "건반 화면 추가 — 색면 타일, 포인터/글자키 입력, 인라인 패널"
```

---

### Task 7: 라우팅과 페이지 조립

**Files:**
- Create: `src/routes/Home.tsx`, `src/routes/Home.module.css`, `src/routes/Work.tsx`, `src/routes/Work.module.css`, `src/routes/About.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`
- Delete: `src/smoke.test.tsx`
- Test: `src/routes/Home.test.tsx`

**Interfaces:**
- Consumes: `getWorks`/`getWork` (Task 3), `createAudioEngine` (Task 5), `Keyboard`/`WorkPanel`/`MuteToggle` (Task 6)
- Produces: 동작하는 사이트. Phase 1 완료.

- [ ] **Step 1: 실패 테스트를 쓴다**

`src/routes/Home.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { Home } from "./Home";

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

test("소리가 없어도 모든 건반이 보인다", () => {
  renderHome();
  expect(screen.getAllByRole("button", { name: /·/ }).length).toBeGreaterThanOrEqual(5);
});

test("건반을 누르면 패널이 열린다", async () => {
  renderHome();
  await userEvent.click(screen.getByRole("button", { name: /NOIRE/ }));
  expect(screen.getByRole("link", { name: /자세히 보기/ })).toBeInTheDocument();
});

test("음소거 토글이 항상 있다", () => {
  renderHome();
  expect(screen.getByRole("button", { name: /소리/ })).toBeInTheDocument();
});
```

`AudioContext`는 jsdom에 없다. `Home`은 첫 누름에서 `unlock()`을 호출하며, 실패해도 화면은 계속 동작해야 한다 — 이 테스트가 그 계약을 검증한다.

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- Home`
Expected: FAIL — `Failed to resolve import "./Home"`

- [ ] **Step 3: `Home`을 만든다**

`src/routes/Home.module.css`:

```css
.page { padding: 80px 0 120px; }
.intro { max-width: 640px; margin: 0 auto 40px; padding: 0 16px; }
.headline { margin: 0 0 10px; font-size: 28px; line-height: 1.35; }
.hint { margin: 0; font-size: 14px; opacity: 0.6; }
.nav { max-width: 640px; margin: 56px auto 0; padding: 0 16px; font-size: 14px; }
```

`src/routes/Home.tsx`:

```tsx
import { useCallback, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { Keyboard } from "../components/Keyboard";
import { WorkPanel } from "../components/WorkPanel";
import { MuteToggle } from "../components/MuteToggle";
import { createAudioEngine } from "../audio/engine";
import { getWorks } from "../lib/works";
import styles from "./Home.module.css";

export function Home() {
  const works = useMemo(() => getWorks(), []);
  const [selected, setSelected] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const engineRef = useRef<ReturnType<typeof createAudioEngine> | null>(null);

  const press = useCallback(
    (slug: string) => {
      // 화면은 소리와 무관하게 항상 반응한다.
      setSelected(slug);

      void (async () => {
        try {
          if (!engineRef.current) {
            const engine = createAudioEngine();
            await engine.unlock();
            await engine.preload(
              works.map((w) => ({ id: w.slug, note: w.note, sound: w.sound })),
            );
            engine.setMuted(muted);
            engineRef.current = engine;
          }
          engineRef.current.play(slug);
        } catch {
          // 오디오를 못 쓰는 환경(자동재생 차단, jsdom, 미지원 브라우저)에서도
          // 사이트는 온전히 동작해야 한다. 조용히 넘어간다.
        }
      })();
    },
    [works, muted],
  );

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      engineRef.current?.setMuted(next);
      return next;
    });
  }, []);

  const selectedWork = works.find((w) => w.slug === selected) ?? null;

  return (
    <main className={styles.page}>
      <MuteToggle muted={muted} onToggle={toggleMute} />

      <div className={styles.intro}>
        <h1 className={styles.headline}>
          음악을 쓰고 앱을 만듭니다.
        </h1>
        <p className={styles.hint}>아래를 눌러보세요. 여러 개를 같이 눌러도 됩니다.</p>
      </div>

      <Keyboard works={works} selected={selected} onPress={press} />

      {selectedWork && <WorkPanel work={selectedWork} />}

      <nav className={styles.nav}>
        <Link to="/about">소개</Link>
      </nav>
    </main>
  );
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- Home`
Expected: `3 passed`

- [ ] **Step 5: 상세 페이지와 소개를 만든다**

`src/routes/Work.module.css`:

```css
.page { max-width: 640px; margin: 0 auto; padding: 64px 16px 120px; }
.back { display: inline-block; margin-bottom: 32px; font-size: 14px; }
.title { margin: 0 0 6px; font-size: 30px; line-height: 1.3; }
.meta { margin: 0 0 32px; font-size: 13px; opacity: 0.55; }
.body { font-size: 16px; line-height: 1.85; white-space: pre-line; }
```

`src/routes/Work.tsx`:

```tsx
import { Link, useParams } from "react-router";
import { getWork } from "../lib/works";
import styles from "./Work.module.css";

export function Work() {
  const { slug } = useParams();
  const work = slug ? getWork(slug) : undefined;

  if (!work) {
    return (
      <main className={styles.page}>
        <p>찾을 수 없는 작업입니다.</p>
        <Link className={styles.back} to="/">← 처음으로</Link>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/">← 처음으로</Link>
      <h1 className={styles.title}>{work.title}</h1>
      <p className={styles.meta}>{work.kind} · {work.year}</p>
      <div className={styles.body}>{work.body}</div>
    </main>
  );
}
```

상세 페이지는 조용한 문서다. 여기에 소리나 애니메이션을 추가하지 말 것.

`src/routes/About.tsx`:

```tsx
import { Link } from "react-router";
import styles from "./Work.module.css";

export function About() {
  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/">← 처음으로</Link>
      <h1 className={styles.title}>Joon Kim</h1>
      <p className={styles.meta}>the KJ Studio · Seoul</p>
      <div className={styles.body}>
        {`서울에서 음악을 쓰고 앱을 만듭니다.

두 가지를 따로 하는 것처럼 보이지만, 하는 일은 같습니다.
누군가의 하루를 조금 덜 힘들게 만드는 것.

곡은 K_Joon_P라는 이름으로 냅니다.`}
      </div>
    </main>
  );
}
```

- [ ] **Step 6: 라우터를 연결하고 스모크 테스트를 지운다**

`src/App.tsx`:

```tsx
import { Route, Routes } from "react-router";
import { Home } from "./routes/Home";
import { Work } from "./routes/Work";
import { About } from "./routes/About";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/work/:slug" element={<Work />} />
      <Route path="/about" element={<About />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

```bash
rm src/smoke.test.tsx
```

- [ ] **Step 7: 전체 테스트와 빌드를 확인한다**

Run: `npm test`
Expected: 모두 통과.

Run: `npm run build`
Expected: 성공.

- [ ] **Step 8: 사람이 직접 확인한다 (자동화 불가)**

Run: `npm run dev`

브라우저에서 확인할 것 — **소리는 사람이 듣고 판단해야 한다:**

1. 건반을 눌렀을 때 **소리가 나는가**, 그리고 눌린 게 눈에 보이는가
2. 두 개를 빠르게 연달아 누르면 **겹쳐 들리는가** (화음)
3. 아무거나 마구 눌러도 **듣기 싫지 않은가** (5음 음계 검증)
4. "소리 끄기"를 누른 뒤에도 **모든 기능이 그대로인가**
5. Tab만으로 모든 건반에 닿고 Enter로 눌러지는가
6. `a s d f g`로 연주되는가, 그리고 건반에 그 글자가 보이는가
7. 휴대폰에서 두 손가락으로 동시에 눌러지는가
8. 상세 페이지가 **조용한가** (소리·애니메이션 없음)

문제가 있으면 고치고 이 단계를 다시 한다.

- [ ] **Step 9: 커밋한다**

```bash
git add -A
git commit -m "라우팅과 페이지 조립 — Phase 1 완료

건반 진입 화면, 작업물 상세, 소개. 오디오를 쓸 수 없는
환경에서도 사이트 전체가 동작한다."
```

---

## Phase 1 완료 기준

전부 만족해야 완료다.

- [ ] `npm test` 전부 통과
- [ ] `npm run build` 성공
- [ ] 건반 5개가 보이고, 눌리고, 소리가 나고, 겹쳐 들린다
- [ ] 음소거 상태에서도 모든 정보에 도달할 수 있다
- [ ] Tab·Enter만으로 전부 조작된다
- [ ] `a s d f g`로 연주된다
- [ ] 모바일에서 두 손가락 동시 입력이 화음이 된다
- [ ] `grep -ril "once-ui\|magic-portfolio" .` (`.git`·`node_modules`·`docs` 제외) 결과가 비어 있다
- [ ] `LICENSE`가 본인 명의다
- [ ] `main` 브랜치에 아무 변경도 가하지 않았다

## Phase 1 이후

- **Phase 1.5** — 정적 프리렌더, 라우트별 메타 태그, OG 이미지, sitemap, 도메인 확정
- **Phase 2** — 콘솔(레이어). `Keyboard`를 채널 스트립으로 교체한다. `AudioEngine`은 그대로 쓴다
- **Phase 3** — 악보(시간축)

설계 문서 §11의 미해결 항목(건반의 형태, 색·타이포, 글의 호흡)은 Phase 1이 동작한 뒤
실물을 보면서 정한다. 지금 정하면 뻔한 선택으로 굳는다.
