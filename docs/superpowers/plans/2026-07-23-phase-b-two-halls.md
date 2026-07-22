# 단계 B — 두 개의 관 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈의 건반 아래에서 **음악관 / 앱관**으로 갈라지고, 음악관이 자작곡·크레딧·공연·LP·장비를 각자에게 맞는 형식으로 담는다.

**Architecture:** 데이터는 이미 전부 `src/content/*.json` 에 구워져 있다(단계 A). 이 계획은 **화면만** 만든다. 섹션별 표현 컴포넌트를 `src/components/sections/` 에 두고, 음악관의 미리보기와 하위 전체 페이지가 **같은 컴포넌트를 배열 길이만 달리해서** 재사용한다. 새 데이터 접근은 `src/lib/content.ts` 한 곳에 모으고, 기존 `works.ts` 는 건반·상세 페이지용으로 남긴다.

**Tech Stack:** Vite 8 · React 19 · TypeScript · react-router 8 · CSS Modules · Vitest 4 · Node 24

## Global Constraints

- **데이터는 이미 있다. 이 계획에서 DB 를 건드리지 않는다.** 현재 구워진 건수: 자작곡 2 · 앱 3 · 크레딧 3 · 공연 5 · LP 25 · 장비 13.
- 판단 기준선(스펙 §1): **"진입은 하나, 안쪽은 둘."** 건반에서는 음악과 앱이 계속 섞이고, 분리는 그 아래에서만 일어난다.
- 건반은 `featured` 지정 항목만. 사용 가능한 음은 `C4 D4 E4 G4 A4 C5 D5` 일곱 개뿐이고 상한도 7이다.
- 음악관 섹션 순서는 고정: **자작곡 → 참여 크레딧 → 공연 → LP 컬렉션 → 장비.**
- 각 섹션은 자기에게 맞는 형식을 갖는다: 자작곡=글 목록, 크레딧=표, 공연=세로 포스터 격자, LP=정사각 커버 격자, 장비=사양 목록.
- 음악관 미리보기 개수(설계값): 자작곡 전체 · 크레딧 3 · 공연 4 · LP 7 · 장비 3. **각 섹션이 화면 절반을 넘지 않는다**는 원칙을 지킨다.
- **항목이 0건인 섹션은 렌더하지 않는다.** 자리표시자를 두지 않는다.
- LP 전체 페이지는 **검색만.** 필터는 넣지 않는다 — 장르가 Discogs 다중 문자열이라 42종으로 쪼개져 축이 안 되고, 스펙 §9 가 "100장을 넘은 뒤에 정한다"고 적었다.
- 이미지 경로 규칙: `/images/…` 로 시작하면 저장소 파일, `http…` 로 시작하면 Supabase Storage. **코드에서 URL 을 조립하지 않는다.** `<img src>` 에 그대로 넣는다.
- 스타일은 CSS Modules. 전역 토큰만 쓴다: `--stage` `--ink` `--ink-soft` `--brass` `--serif` `--mono` `--ease-out-strong`. **새 색을 도입하지 않는다.** 포인트 색은 `--brass` 하나뿐이다.
- `prefers-reduced-motion` 은 `global.css` 가 전역 처리한다. 개별 컴포넌트에서 다시 다루지 않는다.
- 페이지 컴포넌트는 기존 관례를 따른다: `useEffect` 안에서 `applyMeta`, 최상위 `<main className={styles.page}>`, 되돌아가는 `.back` 링크.
- 한국어 주석. "무엇을"이 아니라 **"왜"**를 적는다.
- 커밋 메시지는 한국어.

---

## File Structure

**신규**

| 경로 | 책임 |
|---|---|
| `src/lib/content.ts` | 구워진 JSON 4종(크레딧·공연·LP·장비)을 타입 붙여 노출 + 순수 헬퍼(`groupGear` `searchLp`) |
| `src/lib/content.test.ts` | 위 순수 헬퍼 테스트 |
| `src/components/sections/CreditTable.tsx` + `.module.css` | 크레딧 표 |
| `src/components/sections/PosterGrid.tsx` + `.module.css` | 공연 포스터 격자 |
| `src/components/sections/LpGrid.tsx` + `.module.css` | LP 커버 격자 |
| `src/components/sections/GearList.tsx` + `.module.css` | 장비 목록 |
| `src/components/sections/WorkList.tsx` + `.module.css` | 자작곡·앱 공용 목록 |
| `src/components/sections/Section.tsx` + `.module.css` | 섹션 껍데기(제목 + "전체 →") |
| `src/components/HallDoor.tsx` + `.module.css` | 홈의 두 관 입구 |
| `src/routes/Music.tsx` + `.module.css` | 음악관 — 세로 스택 5섹션 |
| `src/routes/Apps.tsx` + `.module.css` | 앱관 — 카드 격자 |
| `src/routes/Credits.tsx` · `Live.tsx` · `Lp.tsx` · `Gear.tsx` | 하위 전체 페이지 4종 |
| `src/routes/Collection.module.css` | 하위 전체 페이지 4종이 공유하는 레이아웃 |
| `scripts/build-sitemap.ts` | sitemap.xml 생성 |

**수정**

| 경로 | 변경 |
|---|---|
| `src/routes/Home.test.tsx` | **콘텐츠 하드코딩 제거, 구조 기반으로 재작성** |
| `src/lib/works.ts` | `Work` 에 `featured` 추가 |
| `src/lib/works.test.ts` | `featured` 반영 |
| `src/components/Keyboard.test.tsx` | 픽스처에 `featured` 추가 |
| `src/routes/Home.tsx` | 건반을 `featured` 로 한정 + 두 관 입구 |
| `src/routes/Home.module.css` | 두 관 입구 스타일 |
| `src/components/Header.tsx` + `.module.css` | 내비에 음악·앱 추가 |
| `src/App.tsx` | 라우트 6개 추가 |
| `package.json` | `build` 에 sitemap 생성 추가 |

**손대지 않음:** `src/audio/*` · `src/components/{Key,Keyboard,Vinyl,Turntable,MuteToggle,LocalTime,WorkPanel,Footer}.tsx` · `src/routes/Work.tsx` · `src/routes/About.tsx` · `scripts/content/*` · `scripts/fetch-content.ts` · `supabase/*`

---

### Task 1: 콘텐츠를 바꿔도 배포가 깨지지 않게 한다

지금 `npm run build` 가 전체 테스트를 돌리는데, `src/routes/Home.test.tsx` 가 실제 콘텐츠를 렌더하면서 **"NOIRE" · "위로" · `/work/consolation` 을 하드코딩**한다. 그래서 앱이나 대시보드로 곡 제목을 바꾸거나 작업물을 비공개로 돌리고 Deploy Hook 을 치면 **프로덕션 배포가 깨진다.** 단계 B 의 존재 이유(앱에서 콘텐츠를 넣으면 사이트가 갱신된다)와 정면으로 충돌하므로 가장 먼저 없앤다.

조사 결과 실제 콘텐츠를 렌더하는 테스트는 **이 파일 하나뿐**이다(`Keyboard.test.tsx` 는 자체 픽스처를 쓰고, `content-leak.test.ts` 는 특정 값이 아니라 "금지 키가 없다"는 성질을 단언하므로 콘텐츠가 바뀌어도 안전하다). 따라서 빌드 체인을 나눌 필요 없이 이 파일만 구조 기반으로 다시 쓰면 된다.

빌드 시점에 `assertContentNotEmpty` 가 "자작곡+앱 합쳐 최소 1건"을 보장하므로, "건반이 1개 이상 있다"는 전제는 안전하다.

**Files:**
- Modify: `src/routes/Home.test.tsx` (전면 교체)

**Interfaces:**
- Consumes: `Home` (`src/routes/Home.tsx`), `getWorks()` 가 반환하는 실제 콘텐츠
- Produces: 없음

- [ ] **Step 1: 테스트를 구조 기반으로 다시 쓴다**

`src/routes/Home.test.tsx` 를 통째로 교체한다:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { Home } from "./Home";
import { getWorks } from "../lib/works";

/*
  이 테스트는 "무엇이 실려 있는가"가 아니라 "화면이 어떻게 동작하는가"만 본다.
  제목이나 slug 를 하드코딩하면 앱에서 콘텐츠를 바꾸는 순간 배포가 깨진다 —
  빌드 체인이 이 테스트를 돌리기 때문이다. 콘텐츠는 바뀌라고 있는 것이므로
  콘텐츠를 단언하지 않는다.

  "건반이 최소 하나 있다"는 전제는 빌드의 assertContentNotEmpty 가 보장한다.
*/
function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

const keys = () =>
  screen.getAllByRole("button").filter((b) => b.hasAttribute("aria-pressed"));

test("소리가 없어도 건반이 보인다", () => {
  renderHome();
  expect(keys().length).toBeGreaterThan(0);
});

test("건반 수가 featured 로 지정된 작업물 수와 같다", () => {
  renderHome();
  const featured = getWorks().filter((w) => w.featured);
  expect(keys()).toHaveLength(featured.length);
});

test("건반을 누르면 패널이 열리고 상세로 가는 링크가 생긴다", async () => {
  renderHome();
  await userEvent.click(keys()[0]);
  const link = screen.getByRole("link", { name: /자세히 보기/ });
  expect(link.getAttribute("href")).toMatch(/^\/work\/.+/);
});

test("누른 건반만 aria-pressed 가 참이다", async () => {
  renderHome();
  await userEvent.click(keys()[0]);
  const pressed = keys().filter((k) => k.getAttribute("aria-pressed") === "true");
  expect(pressed).toHaveLength(1);
});

test("음소거 토글이 항상 있다", () => {
  renderHome();
  expect(screen.getByRole("button", { name: /소리/ })).toBeInTheDocument();
});
```

- [ ] **Step 2: 테스트를 돌린다**

Run: `npx vitest run src/routes/Home.test.tsx`
Expected: PASS — 5 tests

(`featured` 는 아직 `Work` 에 없으므로 두 번째 테스트가 타입 오류를 낸다. Task 2 에서 추가한다. 지금은 `npx tsc --noEmit` 이 실패하는 것이 정상이며, 이 태스크는 Step 3 에서 그것을 확인하고 넘어간다.)

- [ ] **Step 3: 타입 오류가 예상대로 나는지 확인한다**

Run: `npx tsc --noEmit`
Expected: FAIL — `Property 'featured' does not exist on type 'Work'`

이 오류는 Task 2 가 해소한다. **여기서 `works.ts` 를 고치지 말 것** — 그건 다음 태스크의 일이고, 이 태스크는 "콘텐츠 하드코딩 제거"만 책임진다.

- [ ] **Step 4: 콘텐츠를 바꿔도 안 깨지는지 실제로 확인한다**

이 태스크의 존재 이유를 실증한다. `src/content/apps.json` 을 임시로 손봐 첫 항목의 `title` 을 `"테스트 제목"` 으로 바꾼다.

Run: `npx vitest run src/routes/Home.test.tsx`
Expected: PASS — 5 tests (제목이 바뀌어도 통과해야 한다)

원복: `git checkout -- src/content/apps.json`

**이 단계를 건너뛰지 말 것.** 예전 테스트라면 여기서 실패했다.

- [ ] **Step 5: 커밋**

```bash
git add src/routes/Home.test.tsx
git commit -m "홈 테스트에서 콘텐츠 하드코딩을 걷어낸다

빌드 체인이 이 테스트를 돌리기 때문에, 제목과 slug 를 하드코딩해 두면
앱에서 곡 제목을 바꾸거나 작업물을 비공개로 돌리는 순간 프로덕션 배포가
깨진다. 콘텐츠는 바뀌라고 있는 것이므로 콘텐츠를 단언하지 않는다.

이제 '건반이 있다 · 누르면 열린다 · 링크가 생긴다'는 구조만 본다.
건반이 최소 하나라는 전제는 빌드의 assertContentNotEmpty 가 보장한다.

제목을 바꿔놓고 돌려서 실제로 통과하는 것을 확인했다."
```

---

### Task 2: `featured` 를 화면까지 잇는다

건반은 **대표작 큐레이션**이지 전체 목록이 아니다(스펙 §2). DB 와 구워진 JSON 에는 `featured` 가 있지만 `Work` 타입에 없어서 화면이 못 쓴다.

`getWorks()` 는 **전체**를 반환해야 한다 — 상세 페이지(`/work/:slug`)와 이전/다음 이동이 이걸 쓰므로, 여기서 걸러내면 `featured` 가 아닌 작업물의 상세 페이지가 사라진다. 걸러내는 것은 홈의 몫이다.

**Files:**
- Modify: `src/lib/works.ts`, `src/lib/works.test.ts`, `src/components/Keyboard.test.tsx`

**Interfaces:**
- Consumes: `SongContent` `AppContent` (`src/lib/content-types.ts`)
- Produces: `Work` 타입에 `featured: boolean` 추가. `getWorks()` 의 의미는 그대로 **전체 작업물**

- [ ] **Step 1: 테스트를 먼저 고친다**

`src/lib/works.test.ts` 의 `song`/`app` 팩토리에 `featured` 를 넣고, 통과 여부를 확인하는 테스트를 추가한다. 파일 상단 팩토리 두 개를 이렇게 바꾼다:

```ts
const song = (over: Partial<SongContent> = {}): SongContent => ({
  id: "s", slug: "consolation", title: "위로", year: 2024, note: "C4",
  sound: null, cover: null, body: "본문 C", listen: [], featured: true,
  sortOrder: 0, ...over,
});

const app = (over: Partial<AppContent> = {}): AppContent => ({
  id: "a", slug: "noire", title: "NOIRE", year: 2026, note: "E4",
  cover: null, body: "본문 N", screens: [], links: [], featured: true,
  sortOrder: 0, ...over,
});
```

(팩토리는 이미 이 모양이다 — 바뀌는 것이 없으면 그대로 두고 다음으로 넘어간다.)

파일 끝에 테스트 두 개를 추가한다:

```ts
test("featured 를 그대로 싣는다 — 건반이 될지 말지를 화면이 판단할 수 있어야 한다", () => {
  const works = buildWorks([song({ featured: false })], [app({ featured: true })]);
  expect(works.find((w) => w.slug === "consolation")!.featured).toBe(false);
  expect(works.find((w) => w.slug === "noire")!.featured).toBe(true);
});

test("featured 가 아니어도 목록에는 남는다 — 상세 페이지가 사라지면 안 된다", () => {
  const works = buildWorks([song({ featured: false })], []);
  expect(works.map((w) => w.slug)).toEqual(["consolation"]);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npx vitest run src/lib/works.test.ts`
Expected: FAIL — `featured` 가 `undefined` 라 `toBe(false)` 가 실패

- [ ] **Step 3: `Work` 에 `featured` 를 추가한다**

`src/lib/works.ts` 의 `Work` 타입에 한 줄을 넣는다 (`body: string;` 바로 위):

```ts
  featured: boolean;
```

그리고 `buildWorks` 의 두 `map` 각각에 한 줄씩 넣는다. 곡 쪽 `body: s.body,` 바로 위:

```ts
      featured: s.featured,
```

앱 쪽 `body: a.body,` 바로 위:

```ts
      featured: a.featured,
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npx vitest run src/lib/works.test.ts`
Expected: PASS — 12 tests

- [ ] **Step 5: Keyboard 픽스처를 맞춘다**

`src/components/Keyboard.test.tsx` 의 `works` 배열 두 항목에 `featured: true,` 를 각각 추가한다:

```tsx
const works: Work[] = [
  { slug: "noire", title: "NOIRE", kind: "app", note: "E4", year: 2026, screens: [], listen: [], featured: true, body: "본문 N" },
  { slug: "consolation", title: "위로", kind: "music", note: "C4", year: 2024, screens: [], listen: [], featured: true, body: "본문 C" },
];
```

- [ ] **Step 6: 전체 테스트와 타입 검사**

Run: `npx tsc --noEmit`
Expected: 오류 없음 (Task 1 에서 남은 `featured` 오류가 여기서 해소된다)

Run: `npm test`
Expected: PASS — 전부

- [ ] **Step 7: 커밋**

```bash
git add src/lib/works.ts src/lib/works.test.ts src/components/Keyboard.test.tsx
git commit -m "Work 에 featured 를 싣는다 — 건반은 전체 목록이 아니라 큐레이션이다

getWorks() 는 계속 전체를 반환한다. 여기서 걸러내면 featured 가 아닌
작업물의 상세 페이지와 이전/다음 이동이 사라진다. 거르는 것은 홈의 몫이다."
```

---

### Task 3: 새 콘텐츠 데이터 레이어

크레딧·공연·LP·장비를 화면이 쓸 수 있게 노출한다. 순수 헬퍼 둘(`groupGear` `searchLp`)을 여기 두어 화면 코드가 로직을 갖지 않게 한다.

**Files:**
- Create: `src/lib/content.ts`, `src/lib/content.test.ts`

**Interfaces:**
- Consumes: `CreditContent` `PerformanceContent` `LpContent` `GearContent` (`src/lib/content-types.ts`), `src/content/{credits,performances,lp,gear}.json`
- Produces:
  - `getCredits(): CreditContent[]` · `getPerformances(): PerformanceContent[]` · `getLp(): LpContent[]` · `getGear(): GearContent[]`
  - `type GearGroup = { category: string; items: GearContent[] }`
  - `groupGear(gear: GearContent[]): GearGroup[]`
  - `searchLp(lp: LpContent[], query: string): LpContent[]`

- [ ] **Step 1: 테스트를 먼저 쓴다**

`src/lib/content.test.ts`:

```ts
import { groupGear, searchLp } from "./content";
import type { GearContent, LpContent } from "./content-types";

const gear = (name: string, category: string, sortOrder = 0): GearContent => ({
  id: name, name, category, sortOrder,
});

const lp = (over: Partial<LpContent> = {}): LpContent => ({
  id: "x", artist: "Bill Evans", title: "Portrait In Jazz", label: "Riverside",
  catalogNo: null, releaseYear: 1960, country: null, genre: "Jazz",
  format: '12"', speed: "33", cover: null, appleMusicUrl: null, sortOrder: 0,
  ...over,
});

test("장비를 분류별로 묶는다", () => {
  const groups = groupGear([
    gear("SSL Fusion", "아웃보드"),
    gear("HD 600", "모니터·헤드폰"),
    gear("SSL The Bus+", "아웃보드"),
  ]);
  expect(groups.map((g) => g.category)).toEqual(["아웃보드", "모니터·헤드폰"]);
  expect(groups[0].items.map((i) => i.name)).toEqual(["SSL Fusion", "SSL The Bus+"]);
});

test("분류가 처음 나온 순서를 지킨다 — sort_order 가 진열 순서다", () => {
  const groups = groupGear([
    gear("건반A", "건반", 10),
    gear("아웃보드A", "아웃보드", 20),
  ]);
  expect(groups.map((g) => g.category)).toEqual(["건반", "아웃보드"]);
});

test("빈 배열은 빈 묶음이 된다", () => {
  expect(groupGear([])).toEqual([]);
});

test("LP 를 아티스트로 찾는다", () => {
  const list = [lp({ id: "a", artist: "Bill Evans" }), lp({ id: "b", artist: "Tom Misch" })];
  expect(searchLp(list, "misch").map((x) => x.id)).toEqual(["b"]);
});

test("제목·레이블·장르로도 찾는다", () => {
  const list = [
    lp({ id: "a", title: "Geography" }),
    lp({ id: "b", label: "Blue Note" }),
    lp({ id: "c", genre: "Funk / Soul" }),
  ];
  expect(searchLp(list, "geo").map((x) => x.id)).toEqual(["a"]);
  expect(searchLp(list, "blue").map((x) => x.id)).toEqual(["b"]);
  expect(searchLp(list, "soul").map((x) => x.id)).toEqual(["c"]);
});

test("대소문자와 앞뒤 공백을 무시한다", () => {
  const list = [lp({ id: "a", artist: "Tom Misch" })];
  expect(searchLp(list, "  TOM  ").map((x) => x.id)).toEqual(["a"]);
});

test("빈 검색어는 전부 반환한다 — 검색은 걸러내기지 숨기기가 아니다", () => {
  const list = [lp({ id: "a" }), lp({ id: "b" })];
  expect(searchLp(list, "")).toHaveLength(2);
  expect(searchLp(list, "   ")).toHaveLength(2);
});

test("null 인 필드 때문에 터지지 않는다", () => {
  const list = [lp({ id: "a", label: null, genre: null, artist: "Bill Evans" })];
  expect(() => searchLp(list, "blue")).not.toThrow();
  expect(searchLp(list, "blue")).toHaveLength(0);
});

test("연도로도 찾는다", () => {
  const list = [lp({ id: "a", releaseYear: 1981 }), lp({ id: "b", releaseYear: 2018 })];
  expect(searchLp(list, "1981").map((x) => x.id)).toEqual(["a"]);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npx vitest run src/lib/content.test.ts`
Expected: FAIL — `Failed to resolve import "./content"`

- [ ] **Step 3: 구현한다**

`src/lib/content.ts`:

```ts
/*
  단계 A 가 구워둔 JSON 4종을 화면이 쓸 수 있게 노출한다.
  작업물(자작곡·앱)은 건반과 상세 페이지를 위해 works.ts 가 따로 다룬다 —
  그쪽은 음(note)과 정렬 규칙을 갖지만 여기 넷은 그냥 목록이다.
*/
import type {
  CreditContent, GearContent, LpContent, PerformanceContent,
} from "./content-types";
import creditsJson from "../content/credits.json";
import performancesJson from "../content/performances.json";
import lpJson from "../content/lp.json";
import gearJson from "../content/gear.json";

// JSON 임포트의 추론 타입은 파일 내용에 따라 흔들린다(빈 배열이면 never[]).
// 계약은 content-types.ts 가 쥐고 있고, 실제 모양은 굽는 쪽이 보장한다.
export const getCredits = (): CreditContent[] =>
  creditsJson as unknown as CreditContent[];
export const getPerformances = (): PerformanceContent[] =>
  performancesJson as unknown as PerformanceContent[];
export const getLp = (): LpContent[] => lpJson as unknown as LpContent[];
export const getGear = (): GearContent[] => gearJson as unknown as GearContent[];

export type GearGroup = { category: string; items: GearContent[] };

/*
  장비는 이름만 늘어놓으면 목록이 아니라 더미가 된다. 분류로 묶어야 읽힌다.
  분류의 순서는 정렬하지 않고 '처음 나온 순서'를 쓴다 — sort_order 가 곧
  진열 순서이고, 가나다순으로 다시 정렬하면 그 의도가 지워진다.
*/
export function groupGear(gear: GearContent[]): GearGroup[] {
  const groups: GearGroup[] = [];
  for (const item of gear) {
    const found = groups.find((g) => g.category === item.category);
    if (found) found.items.push(item);
    else groups.push({ category: item.category, items: [item] });
  }
  return groups;
}

/*
  LP 는 필터가 아니라 검색으로 찾는다. 장르가 Discogs 의 다중 문자열이라
  ("Electronic, Funk / Soul, Pop, …") 축으로 쪼개지지 않기 때문이다.
  빈 검색어는 전부 통과시킨다 — 검색은 걸러내는 도구지 숨기는 도구가 아니다.
*/
export function searchLp(lp: LpContent[], query: string): LpContent[] {
  const q = query.trim().toLowerCase();
  if (!q) return lp;
  return lp.filter((item) =>
    [item.artist, item.title, item.label, item.genre, item.country,
     item.releaseYear === null ? "" : String(item.releaseYear)]
      .filter((v): v is string => typeof v === "string" && v.length > 0)
      .some((v) => v.toLowerCase().includes(q)),
  );
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npx vitest run src/lib/content.test.ts`
Expected: PASS — 9 tests

Run: `npx tsc --noEmit`
Expected: 오류 없음

- [ ] **Step 5: 실제 데이터로 한 번 확인한다**

Run:
```bash
npx tsx -e "
import { getCredits, getGear, getLp, getPerformances, groupGear, searchLp } from './src/lib/content';
console.log('크레딧', getCredits().length, '공연', getPerformances().length, 'LP', getLp().length, '장비', getGear().length);
console.log('분류', groupGear(getGear()).map(g => g.category + '(' + g.items.length + ')').join(' · '));
console.log('검색 jazz →', searchLp(getLp(), 'jazz').length + '장');
"
```
Expected:
```
크레딧 3 공연 5 LP 25 장비 13
분류 아웃보드(3) · 인터페이스·컨버터(2) · 모니터·헤드폰(3) · 건반(1) · 음원 모듈(3) · 컴퓨터(1)
검색 jazz → (1 이상)
```

- [ ] **Step 6: 커밋**

```bash
git add src/lib/content.ts src/lib/content.test.ts
git commit -m "새 콘텐츠 4종의 데이터 레이어

크레딧·공연·LP·장비를 노출하고, 화면이 로직을 갖지 않도록
분류 묶기와 검색을 순수 함수로 여기 둔다.

장비 분류 순서는 정렬하지 않고 처음 나온 순서를 쓴다 — sort_order 가
곧 진열 순서인데 가나다순으로 다시 정렬하면 그 의도가 지워진다.
LP 는 필터 대신 검색이다. 장르가 Discogs 다중 문자열이라 축이 안 된다."
```

---

### Task 4: 섹션 표현 컴포넌트 5종

음악관의 미리보기와 하위 전체 페이지가 **같은 컴포넌트를 쓴다.** 개수 제한은 컴포넌트가 아니라 부르는 쪽이 배열을 잘라서 정한다 — 컴포넌트에 `limit` 을 넣으면 "몇 개 보일지"가 두 군데로 흩어진다.

**Files:**
- Create: `src/components/sections/Section.tsx` + `Section.module.css`
- Create: `src/components/sections/WorkList.tsx` + `WorkList.module.css`
- Create: `src/components/sections/CreditTable.tsx` + `CreditTable.module.css`
- Create: `src/components/sections/PosterGrid.tsx` + `PosterGrid.module.css`
- Create: `src/components/sections/LpGrid.tsx` + `LpGrid.module.css`
- Create: `src/components/sections/GearList.tsx` + `GearList.module.css`

**Interfaces:**
- Consumes: `Work` (`src/lib/works.ts`), `CreditContent` `PerformanceContent` `LpContent` `GearGroup` (`src/lib/content-types.ts`, `src/lib/content.ts`)
- Produces:
  - `<Section title={string} count={number} to={string | undefined}>{children}</Section>`
  - `<WorkList works={Work[]} />`
  - `<CreditTable credits={CreditContent[]} />`
  - `<PosterGrid performances={PerformanceContent[]} />`
  - `<LpGrid items={LpContent[]} />`
  - `<GearList groups={GearGroup[]} />`

- [ ] **Step 1: 섹션 껍데기를 만든다**

`src/components/sections/Section.tsx`:

```tsx
import { Link } from "react-router";
import type { ReactNode } from "react";
import styles from "./Section.module.css";

type Props = {
  title: string;
  count: number;
  /* 전체 페이지가 따로 있는 섹션만 준다. 없으면 "전체 →" 를 그리지 않는다 */
  to?: string;
  children: ReactNode;
};

export function Section({ title, count, to, children }: Props) {
  // 항목이 없는 섹션은 아예 그리지 않는다. 빈 자리표시자는 사이트를
  // 미완성으로 보이게 만들 뿐 아무것도 알려주지 않는다.
  if (count === 0) return null;

  return (
    <section className={styles.section} aria-label={title}>
      <div className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        {to && (
          <Link className={styles.more} to={to}>
            전체 {count} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
```

`src/components/sections/Section.module.css`:

```css
.section {
  border-top: 1px solid #2a2932;
  padding-top: 22px;
  margin-bottom: 72px;
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 26px;
}

.title {
  margin: 0;
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--brass);
}

.more {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--ink-soft);
  text-decoration: none;
  white-space: nowrap;
  transition: color 150ms ease;
}

.more:hover { color: var(--brass); }
```

- [ ] **Step 2: 자작곡·앱 공용 목록**

`src/components/sections/WorkList.tsx`:

```tsx
import { Link } from "react-router";
import type { Work } from "../../lib/works";
import styles from "./WorkList.module.css";

type Props = { works: Work[] };

export function WorkList({ works }: Props) {
  return (
    <ul className={styles.list}>
      {works.map((work) => (
        <li key={work.slug}>
          <Link className={styles.item} to={`/work/${work.slug}`}>
            {work.cover ? (
              <img className={styles.cover} src={work.cover} alt="" loading="lazy" />
            ) : (
              <span className={styles.cover} aria-hidden="true" />
            )}
            <span className={styles.text}>
              <span className={styles.name}>{work.title}</span>
              <span className={styles.meta}>{work.year}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

`src/components/sections/WorkList.module.css`:

```css
.list { margin: 0; padding: 0; list-style: none; }

.item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  text-decoration: none;
  border-bottom: 1px solid #211f28;
  transition: opacity 150ms ease;
}

.item:hover { opacity: 0.72; }

.cover {
  flex: none;
  width: 46px;
  height: 46px;
  object-fit: cover;
  border-radius: 2px;
  background: #241f27;
  border: 1px solid #332e38;
}

.text { display: flex; align-items: baseline; gap: 12px; min-width: 0; }

.name {
  font-size: 16px;
  word-break: keep-all;
}

.meta {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--ink-soft);
}
```

- [ ] **Step 3: 크레딧 표**

`src/components/sections/CreditTable.tsx`:

```tsx
import type { CreditContent } from "../../lib/content-types";
import styles from "./CreditTable.module.css";

type Props = { credits: CreditContent[] };

/*
  크레딧은 사실의 목록이다. 역할과 연도가 한눈에 비교돼야 하므로 표가 맞다.
  카드로 만들면 비교가 안 되고 자리만 먹는다.
*/
export function CreditTable({ credits }: Props) {
  return (
    <ul className={styles.list}>
      {credits.map((credit) => {
        const label = `${credit.artist} — ${credit.workTitle}`;
        return (
          <li key={credit.id} className={styles.row}>
            <span className={styles.work}>
              {credit.url ? (
                <a href={credit.url} target="_blank" rel="noopener noreferrer">
                  {label} ↗
                </a>
              ) : (
                label
              )}
            </span>
            <span className={styles.meta}>
              {credit.roles.join(" · ")}
              {credit.year !== null && ` · ${credit.year}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
```

`src/components/sections/CreditTable.module.css`:

```css
.list { margin: 0; padding: 0; list-style: none; }

.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 20px;
  padding: 11px 0;
  border-bottom: 1px solid #211f28;
}

.work {
  font-size: 15px;
  word-break: keep-all;
}

.work a { text-decoration: none; transition: color 150ms ease; }
.work a:hover { color: var(--brass); }

.meta {
  flex: none;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--ink-soft);
  white-space: nowrap;
}
```

- [ ] **Step 4: 공연 포스터 격자**

`src/components/sections/PosterGrid.tsx`:

```tsx
import type { PerformanceContent } from "../../lib/content-types";
import styles from "./PosterGrid.module.css";

type Props = { performances: PerformanceContent[] };

/*
  공연은 포스터가 주인공이다. 세로 비율(3:4)을 지키고 글은 아래로 뺀다.
*/
export function PosterGrid({ performances }: Props) {
  return (
    <ul className={styles.grid}>
      {performances.map((show) => (
        <li key={show.id} className={styles.cell}>
          {show.poster ? (
            <img
              className={styles.poster}
              src={show.poster}
              alt={`${show.title} 포스터`}
              loading="lazy"
            />
          ) : (
            <div className={styles.poster} aria-hidden="true" />
          )}
          <p className={styles.title}>{show.title}</p>
          <p className={styles.meta}>
            {[show.date, show.venue].filter(Boolean).join(" · ")}
          </p>
          {show.role && <p className={styles.role}>{show.role}</p>}
        </li>
      ))}
    </ul>
  );
}
```

`src/components/sections/PosterGrid.module.css`:

```css
.grid {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 24px 18px;
}

.poster {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border-radius: 2px;
  background: #241f27;
  border: 1px solid #332e38;
}

.title {
  margin: 12px 0 5px;
  font-size: 14px;
  line-height: 1.5;
  word-break: keep-all;
}

.meta, .role {
  margin: 0;
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.08em;
  line-height: 1.7;
  color: var(--ink-soft);
}

.role { color: var(--brass); opacity: 0.75; }
```

- [ ] **Step 5: LP 커버 격자**

`src/components/sections/LpGrid.tsx`:

```tsx
import type { LpContent } from "../../lib/content-types";
import styles from "./LpGrid.module.css";

type Props = { items: LpContent[] };

/*
  LP 는 커버 아트가 전부다. 정사각 격자로 늘어놓고 글은 최소한만 붙인다.
  커버가 곧 정보이므로 제목을 크게 쓸 이유가 없다.
*/
export function LpGrid({ items }: Props) {
  return (
    <ul className={styles.grid}>
      {items.map((item) => {
        const label = `${item.artist} — ${item.title}`;
        return (
          <li key={item.id} className={styles.cell}>
            {item.appleMusicUrl ? (
              <a
                className={styles.link}
                href={item.appleMusicUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`${label} — Apple Music 에서 듣기`}
              >
                <Cover item={item} label={label} />
              </a>
            ) : (
              <Cover item={item} label={label} />
            )}
            <p className={styles.artist}>{item.artist}</p>
            <p className={styles.title}>{item.title}</p>
          </li>
        );
      })}
    </ul>
  );
}

function Cover({ item, label }: { item: LpContent; label: string }) {
  if (!item.cover) return <div className={styles.cover} aria-hidden="true" />;
  return (
    <img className={styles.cover} src={item.cover} alt={label} loading="lazy" />
  );
}
```

`src/components/sections/LpGrid.module.css`:

```css
.grid {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 22px 14px;
}

.link { display: block; text-decoration: none; }

.cover {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 2px;
  background: #241f27;
  border: 1px solid #332e38;
  transition: transform 220ms var(--ease-out-strong);
}

.link:hover .cover { transform: translateY(-3px); }

.artist {
  margin: 10px 0 2px;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--brass);
  opacity: 0.8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--ink-soft);
  word-break: keep-all;
}
```

- [ ] **Step 6: 장비 목록**

`src/components/sections/GearList.tsx`:

```tsx
import type { GearGroup } from "../../lib/content";
import styles from "./GearList.module.css";

type Props = { groups: GearGroup[] };

/*
  장비는 이미지보다 사양이다. 분류로 묶은 목록이 맞고, 격자로 만들면
  이름만 떠다니는 카드 더미가 된다.
*/
export function GearList({ groups }: Props) {
  return (
    <dl className={styles.list}>
      {groups.map((group) => (
        <div key={group.category} className={styles.group}>
          <dt className={styles.category}>{group.category}</dt>
          <dd className={styles.items}>
            {group.items.map((item) => item.name).join(" · ")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
```

`src/components/sections/GearList.module.css`:

```css
.list { margin: 0; }

.group {
  display: grid;
  grid-template-columns: 132px 1fr;
  gap: 18px;
  padding: 11px 0;
  border-bottom: 1px solid #211f28;
}

.category {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  color: var(--ink-soft);
  padding-top: 3px;
}

.items {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.85;
  word-break: keep-all;
}

@media (max-width: 560px) {
  .group { grid-template-columns: 1fr; gap: 6px; }
}
```

- [ ] **Step 7: 타입 검사와 테스트**

Run: `npx tsc --noEmit`
Expected: 오류 없음

Run: `npm test`
Expected: PASS — 전부 (새 컴포넌트에는 아직 테스트가 없다. 렌더 검증은 Task 5·6 에서 페이지 단위로 한다 — 표현 컴포넌트를 개별로 테스트하면 마크업을 두 번 적는 꼴이 된다)

- [ ] **Step 8: 커밋**

```bash
git add src/components/sections/
git commit -m "섹션 표현 컴포넌트 5종 — 유형마다 어울리는 형식이 다르다

크레딧은 표(역할·연도가 비교돼야 한다), 공연은 세로 포스터(포스터가
주인공이다), LP 는 정사각 격자(커버가 곧 정보다), 장비는 분류로 묶은
목록(이미지보다 사양이다), 자작곡·앱은 글 목록.

하나의 격자에 다 밀어넣는 것이 난잡해지는 길이라 처음부터 나눈다.

개수 제한은 컴포넌트가 아니라 부르는 쪽이 배열을 잘라서 정한다 —
컴포넌트에 limit 을 두면 '몇 개 보일지'가 두 군데로 흩어진다."
```

---

### Task 5: 음악관과 앱관

**Files:**
- Create: `src/routes/Music.tsx` + `Music.module.css`
- Create: `src/routes/Apps.tsx` + `Apps.module.css`
- Create: `src/routes/Music.test.tsx`
- Modify: `src/App.tsx`, `src/components/Header.tsx`, `src/components/Header.module.css`

**Interfaces:**
- Consumes: Task 3 의 `getCredits` `getPerformances` `getLp` `getGear` `groupGear`; Task 4 의 `Section` `WorkList` `CreditTable` `PosterGrid` `LpGrid` `GearList`; `getWorks` (`src/lib/works.ts`)
- Produces: 라우트 `/music` `/apps`

- [ ] **Step 1: 음악관을 만든다**

`src/routes/Music.tsx`:

```tsx
import { useEffect } from "react";
import { Link } from "react-router";
import { getCredits, getGear, getLp, getPerformances, groupGear } from "../lib/content";
import { getWorks } from "../lib/works";
import { applyMeta } from "../lib/meta";
import { Section } from "../components/sections/Section";
import { WorkList } from "../components/sections/WorkList";
import { CreditTable } from "../components/sections/CreditTable";
import { PosterGrid } from "../components/sections/PosterGrid";
import { LpGrid } from "../components/sections/LpGrid";
import { GearList } from "../components/sections/GearList";
import styles from "./Music.module.css";

/*
  미리보기 개수. 각 섹션이 화면 절반을 넘지 않게 하는 것이 이 숫자들의 목적이다.
  스크롤 한 번에 "이 사람은 이런 사람이다"가 다 들어와야 하므로 절제한다.
*/
const PREVIEW = { credits: 3, live: 4, lp: 7, gear: 3 };

export function Music() {
  const songs = getWorks().filter((w) => w.kind === "music");
  const credits = getCredits();
  const performances = getPerformances();
  const lp = getLp();
  const gear = getGear();
  // "전체 N →" 은 장비 점수를 보여줘야 한다. 분류 개수를 보여주면
  // 방문자가 "장비가 6개인가?" 하고 잘못 읽는다.
  const gearGroups = groupGear(gear);

  useEffect(() => {
    applyMeta({
      title: "음악 — the KJ Studio",
      description:
        "작곡가 김준이 쓴 곡과 참여한 작품, 공연, 그리고 모아온 음반과 장비.",
      image: songs[0]?.cover ?? undefined,
    });
  }, [songs]);

  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/">← 처음으로</Link>

      <p className={styles.overline}>Music — 음악</p>
      <h1 className={styles.title}>음악</h1>
      <p className={styles.lead}>
        쓴 것과 참여한 것, 무대에 선 것, 그리고 모아온 것.
      </p>

      <Section title="자작곡" count={songs.length}>
        <WorkList works={songs} />
      </Section>

      <Section title="참여 크레딧" count={credits.length} to="/music/credits">
        <CreditTable credits={credits.slice(0, PREVIEW.credits)} />
      </Section>

      <Section title="공연" count={performances.length} to="/music/live">
        <PosterGrid performances={performances.slice(0, PREVIEW.live)} />
      </Section>

      <Section title="LP 컬렉션" count={lp.length} to="/music/lp">
        <LpGrid items={lp.slice(0, PREVIEW.lp)} />
      </Section>

      <Section title="장비" count={gear.length} to="/music/gear">
        <GearList groups={gearGroups.slice(0, PREVIEW.gear)} />
      </Section>
    </main>
  );
}
```

`src/routes/Music.module.css`:

```css
.page {
  max-width: 760px;
  margin: 0 auto;
  padding: 108px 28px 140px;
}

.back {
  display: inline-block;
  margin-bottom: 64px;
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  text-decoration: none;
  border-bottom: 1px solid #35343c;
  padding-bottom: 3px;
  transition: color 150ms ease, border-color 150ms ease;
}

.back:hover { color: var(--brass); border-color: var(--brass); }

.overline {
  margin: 0 0 16px;
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--brass);
}

.title {
  margin: 0 0 14px;
  font-size: clamp(30px, 5vw, 40px);
  font-weight: 900;
  line-height: 1.3;
  letter-spacing: -0.025em;
}

.lead {
  margin: 0 0 78px;
  font-size: 16px;
  line-height: 1.9;
  color: var(--ink-soft);
  word-break: keep-all;
}
```

- [ ] **Step 2: 앱관을 만든다**

`src/routes/Apps.tsx`:

```tsx
import { useEffect } from "react";
import { Link } from "react-router";
import { getWorks } from "../lib/works";
import { applyMeta } from "../lib/meta";
import styles from "./Apps.module.css";

export function Apps() {
  const apps = getWorks().filter((w) => w.kind === "app");

  useEffect(() => {
    applyMeta({
      title: "앱 — the KJ Studio",
      description: "개발자 김준이 만든 앱들. 설계부터 아이콘까지 직접 만듭니다.",
      image: apps[0]?.cover ?? undefined,
    });
  }, [apps]);

  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/">← 처음으로</Link>

      <p className={styles.overline}>Apps — 앱</p>
      <h1 className={styles.title}>앱</h1>
      <p className={styles.lead}>
        기능이 많아질수록 화면은 단순해져야 한다고 믿습니다.
      </p>

      <ul className={styles.grid}>
        {apps.map((app) => (
          <li key={app.slug}>
            <Link className={styles.card} to={`/work/${app.slug}`}>
              {app.cover ? (
                <img className={styles.cover} src={app.cover} alt="" loading="lazy" />
              ) : (
                <span className={styles.cover} aria-hidden="true" />
              )}
              <span className={styles.name}>{app.title}</span>
              <span className={styles.meta}>{app.year}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

`src/routes/Apps.module.css`:

```css
.page {
  max-width: 760px;
  margin: 0 auto;
  padding: 108px 28px 140px;
}

.back {
  display: inline-block;
  margin-bottom: 64px;
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  text-decoration: none;
  border-bottom: 1px solid #35343c;
  padding-bottom: 3px;
  transition: color 150ms ease, border-color 150ms ease;
}

.back:hover { color: var(--brass); border-color: var(--brass); }

.overline {
  margin: 0 0 16px;
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--brass);
}

.title {
  margin: 0 0 14px;
  font-size: clamp(30px, 5vw, 40px);
  font-weight: 900;
  line-height: 1.3;
  letter-spacing: -0.025em;
}

.lead {
  margin: 0 0 66px;
  font-size: 16px;
  line-height: 1.9;
  color: var(--ink-soft);
  word-break: keep-all;
}

.grid {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 30px 22px;
}

.card {
  display: block;
  text-decoration: none;
  transition: opacity 150ms ease;
}

.card:hover { opacity: 0.78; }

.cover {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  border-radius: 3px;
  background: #241f27;
  border: 1px solid #332e38;
  margin-bottom: 14px;
}

.name { display: block; font-size: 16px; margin-bottom: 4px; }

.meta {
  display: block;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--ink-soft);
}
```

- [ ] **Step 3: 라우트를 등록한다**

`src/App.tsx` 를 통째로 교체한다:

```tsx
import { Route, Routes } from "react-router";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./routes/Home";
import { Work } from "./routes/Work";
import { About } from "./routes/About";
import { Music } from "./routes/Music";
import { Apps } from "./routes/Apps";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/music" element={<Music />} />
        <Route path="/apps" element={<Apps />} />
        <Route path="/work/:slug" element={<Work />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: 헤더 내비를 넓힌다**

`src/components/Header.tsx` 의 `<nav>` 안을 이렇게 바꾼다 (건반과 소개 사이에 둘을 넣는다):

```tsx
      <nav className={styles.nav} aria-label="주 메뉴">
        <Link to="/" aria-current={pathname === "/" ? "page" : undefined}>
          건반
        </Link>
        <Link to="/music" aria-current={pathname.startsWith("/music") ? "page" : undefined}>
          음악
        </Link>
        <Link to="/apps" aria-current={pathname === "/apps" ? "page" : undefined}>
          앱
        </Link>
        <Link to="/about" aria-current={pathname === "/about" ? "page" : undefined}>
          소개
        </Link>
        <a href="mailto:contact@thekjstudio.com">연락</a>
      </nav>
```

- [ ] **Step 5: 음악관 테스트를 쓴다**

`src/routes/Music.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Music } from "./Music";
import { getCredits, getGear, getLp, getPerformances } from "../lib/content";
import { getWorks } from "../lib/works";

/*
  구조만 본다. 어떤 곡이 실려 있는지는 단언하지 않는다 —
  콘텐츠를 바꾸면 배포가 깨지는 테스트를 다시 만들지 않기 위해서다.
*/
function renderMusic() {
  return render(
    <MemoryRouter>
      <Music />
    </MemoryRouter>,
  );
}

test("다섯 섹션이 정해진 순서로 나온다", () => {
  renderMusic();
  const titles = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
  expect(titles).toEqual(["자작곡", "참여 크레딧", "공연", "LP 컬렉션", "장비"]);
});

test("항목이 있는 섹션마다 전체 페이지로 가는 길이 있다", () => {
  renderMusic();
  for (const path of ["/music/credits", "/music/live", "/music/lp", "/music/gear"]) {
    const link = screen.getAllByRole("link").find((a) => a.getAttribute("href") === path);
    expect(link, `${path} 로 가는 링크가 없다`).toBeDefined();
  }
});

test("자작곡은 미리보기가 아니라 전체를 보여준다 — 전체 페이지가 따로 없다", () => {
  renderMusic();
  const songs = getWorks().filter((w) => w.kind === "music");
  for (const song of songs) {
    const link = screen
      .getAllByRole("link")
      .find((a) => a.getAttribute("href") === `/work/${song.slug}`);
    expect(link, `${song.slug} 링크가 없다`).toBeDefined();
  }
});

test("미리보기는 절제된 개수만 보여준다 — 섹션이 화면 절반을 넘으면 안 된다", () => {
  renderMusic();
  // Section 이 aria-label 을 붙이므로 각 섹션이 region 으로 잡힌다.
  const lpSection = screen.getByRole("region", { name: "LP 컬렉션" });
  const liveSection = screen.getByRole("region", { name: "공연" });

  // 전체보다 적게 보여준다는 것이 핵심이다. 정확한 숫자는 PREVIEW 상수가 쥔다.
  expect(within(lpSection).getAllByRole("img").length).toBeLessThan(getLp().length);
  expect(within(liveSection).getAllByRole("img").length)
    .toBeLessThanOrEqual(getPerformances().length);
});

test("데이터가 실제로 실려 있다 — 빈 껍데기가 아니다", () => {
  expect(getCredits().length + getPerformances().length + getLp().length + getGear().length)
    .toBeGreaterThan(0);
});
```

- [ ] **Step 6: 테스트와 타입 검사**

Run: `npx vitest run src/routes/Music.test.tsx`
Expected: PASS — 5 tests

Run: `npx tsc --noEmit`
Expected: 오류 없음

Run: `npm test`
Expected: PASS — 전부

- [ ] **Step 7: 눈으로 확인한다**

Run: `npm run dev` 후 브라우저에서 `/music` 과 `/apps` 를 연다.

확인할 것:
- 음악관에 다섯 섹션이 **자작곡 → 참여 크레딧 → 공연 → LP 컬렉션 → 장비** 순서로 있다
- 크레딧 3행, 공연 포스터 4장, LP 커버 7장, 장비 분류 3개가 보인다
- 포스터와 LP 커버 이미지가 **실제로 뜬다** (깨진 이미지 없음)
- 각 섹션 오른쪽에 "전체 N →" 이 있다
- 앱관에 앱 카드 3개가 있고 누르면 상세로 간다
- 헤더에 건반 · 음악 · 앱 · 소개 · 연락 다섯 항목이 있다

- [ ] **Step 8: 커밋**

```bash
git add src/routes/Music.tsx src/routes/Music.module.css src/routes/Music.test.tsx \
        src/routes/Apps.tsx src/routes/Apps.module.css \
        src/App.tsx src/components/Header.tsx
git commit -m "음악관과 앱관

음악관은 세로 스택 다섯 섹션. 탭으로 나누지 않는 이유는 탭 뒤는 안 보기
때문이다 — '작곡가이자 수집가'라는 전체상이 한 화면에 한 번도 안 나오면
LP 와 공연을 넣는 의미가 반감된다.

미리보기는 크레딧 3 · 공연 4 · LP 7 · 장비 3 으로 절제한다. 각 섹션이
화면 절반을 넘으면 세로 스택도 난잡해진다.

항목이 0건인 섹션은 렌더하지 않는다. 빈 자리표시자는 사이트를 미완성으로
보이게 만들 뿐 아무것도 알려주지 않는다."
```

---

### Task 6: 하위 전체 페이지 4종

**Files:**
- Create: `src/routes/Collection.module.css` (4개 페이지 공용)
- Create: `src/routes/Credits.tsx` · `Live.tsx` · `Lp.tsx` · `Gear.tsx`
- Create: `src/routes/Lp.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: Task 3 의 `getCredits` `getPerformances` `getLp` `getGear` `groupGear` `searchLp`; Task 4 의 표현 컴포넌트
- Produces: 라우트 `/music/credits` `/music/live` `/music/lp` `/music/gear`

- [ ] **Step 1: 공용 레이아웃 CSS**

`src/routes/Collection.module.css`:

```css
/* 하위 전체 페이지 넷이 공유한다. 목록이 주인공이므로 머리는 낮게 둔다 */
.page {
  max-width: 820px;
  margin: 0 auto;
  padding: 108px 28px 140px;
}

.back {
  display: inline-block;
  margin-bottom: 52px;
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  text-decoration: none;
  border-bottom: 1px solid #35343c;
  padding-bottom: 3px;
  transition: color 150ms ease, border-color 150ms ease;
}

.back:hover { color: var(--brass); border-color: var(--brass); }

.overline {
  margin: 0 0 14px;
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--brass);
}

.title {
  margin: 0 0 10px;
  font-size: clamp(26px, 4.4vw, 34px);
  font-weight: 900;
  letter-spacing: -0.02em;
}

.count {
  margin: 0 0 50px;
  font-family: var(--mono);
  font-size: 11.5px;
  letter-spacing: 0.14em;
  color: var(--ink-soft);
}

.search {
  width: 100%;
  margin: 0 0 42px;
  padding: 12px 14px;
  background: rgb(255 255 255 / 0.03);
  border: 1px solid #2f2e38;
  border-radius: 3px;
  color: var(--ink);
  font-family: var(--mono);
  font-size: 13px;
  letter-spacing: 0.04em;
}

.search::placeholder { color: #5f5b66; }
.search:focus { outline: none; border-color: var(--brass); }

.empty {
  margin: 0;
  font-size: 15px;
  color: var(--ink-soft);
}
```

- [ ] **Step 2: 크레딧 전체 페이지**

`src/routes/Credits.tsx`:

```tsx
import { useEffect } from "react";
import { Link } from "react-router";
import { getCredits } from "../lib/content";
import { applyMeta } from "../lib/meta";
import { CreditTable } from "../components/sections/CreditTable";
import styles from "./Collection.module.css";

export function Credits() {
  const credits = getCredits();

  useEffect(() => {
    applyMeta({
      title: "참여 크레딧 — the KJ Studio",
      description: "김준이 편곡·연주·프로듀싱으로 참여한 작품 목록.",
    });
  }, []);

  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/music">← 음악</Link>
      <p className={styles.overline}>Credits — 참여 크레딧</p>
      <h1 className={styles.title}>참여 크레딧</h1>
      <p className={styles.count}>{credits.length}건</p>
      <CreditTable credits={credits} />
    </main>
  );
}
```

- [ ] **Step 3: 공연 전체 페이지**

`src/routes/Live.tsx`:

```tsx
import { useEffect } from "react";
import { Link } from "react-router";
import { getPerformances } from "../lib/content";
import { applyMeta } from "../lib/meta";
import { PosterGrid } from "../components/sections/PosterGrid";
import styles from "./Collection.module.css";

export function Live() {
  const performances = getPerformances();

  useEffect(() => {
    applyMeta({
      title: "공연 — the KJ Studio",
      description: "김준이 무대에 선 공연들.",
      image: performances[0]?.poster ?? undefined,
    });
  }, [performances]);

  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/music">← 음악</Link>
      <p className={styles.overline}>Live — 공연</p>
      <h1 className={styles.title}>공연</h1>
      <p className={styles.count}>{performances.length}회</p>
      <PosterGrid performances={performances} />
    </main>
  );
}
```

- [ ] **Step 4: 장비 전체 페이지**

`src/routes/Gear.tsx`:

```tsx
import { useEffect } from "react";
import { Link } from "react-router";
import { getGear, groupGear } from "../lib/content";
import { applyMeta } from "../lib/meta";
import { GearList } from "../components/sections/GearList";
import styles from "./Collection.module.css";

export function Gear() {
  const gear = getGear();
  const groups = groupGear(gear);

  useEffect(() => {
    applyMeta({
      title: "장비 — the KJ Studio",
      description: "작업 환경. 모니터·아웃보드·건반·음원 모듈.",
    });
  }, []);

  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/music">← 음악</Link>
      <p className={styles.overline}>Gear — 장비</p>
      <h1 className={styles.title}>장비</h1>
      <p className={styles.count}>{gear.length}점 · {groups.length}개 분류</p>
      <GearList groups={groups} />
    </main>
  );
}
```

- [ ] **Step 5: LP 전체 페이지 — 검색이 붙는 유일한 페이지**

`src/routes/Lp.tsx`:

```tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { getLp, searchLp } from "../lib/content";
import { applyMeta } from "../lib/meta";
import { LpGrid } from "../components/sections/LpGrid";
import styles from "./Collection.module.css";

export function Lp() {
  const all = getLp();
  const [query, setQuery] = useState("");
  const shown = useMemo(() => searchLp(all, query), [all, query]);

  useEffect(() => {
    applyMeta({
      title: "LP 컬렉션 — the KJ Studio",
      description: "모아온 음반들. 아티스트·제목·레이블·장르로 찾을 수 있습니다.",
      image: all[0]?.cover ?? undefined,
    });
  }, [all]);

  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/music">← 음악</Link>
      <p className={styles.overline}>LP — 컬렉션</p>
      <h1 className={styles.title}>LP 컬렉션</h1>
      <p className={styles.count}>
        {query.trim() ? `${shown.length} / ${all.length}장` : `${all.length}장`}
      </p>

      <input
        className={styles.search}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="아티스트 · 제목 · 레이블 · 장르 · 연도"
        aria-label="LP 검색"
      />

      {shown.length === 0 ? (
        <p className={styles.empty}>찾는 음반이 없습니다.</p>
      ) : (
        <LpGrid items={shown} />
      )}
    </main>
  );
}
```

- [ ] **Step 6: 라우트를 등록한다**

`src/App.tsx` 에 import 넷과 Route 넷을 추가한다. import 는 `Apps` 아래에:

```tsx
import { Credits } from "./routes/Credits";
import { Live } from "./routes/Live";
import { Lp } from "./routes/Lp";
import { Gear } from "./routes/Gear";
```

Route 는 `/music` 아래에 (더 구체적인 경로가 먼저 올 필요는 없다 — react-router 7+ 는 순위로 판단한다):

```tsx
        <Route path="/music/credits" element={<Credits />} />
        <Route path="/music/live" element={<Live />} />
        <Route path="/music/lp" element={<Lp />} />
        <Route path="/music/gear" element={<Gear />} />
```

- [ ] **Step 7: LP 검색 테스트를 쓴다**

`src/routes/Lp.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { Lp } from "./Lp";
import { getLp } from "../lib/content";

function renderLp() {
  return render(
    <MemoryRouter>
      <Lp />
    </MemoryRouter>,
  );
}

const covers = () => screen.queryAllByRole("img");

test("처음에는 전부 보여준다", () => {
  renderLp();
  expect(covers()).toHaveLength(getLp().length);
});

test("검색하면 줄어든다", async () => {
  renderLp();
  const before = covers().length;
  // 첫 음반의 아티스트로 검색하면 최소 한 장은 남고, 전체보다는 적어야 한다.
  await userEvent.type(screen.getByRole("searchbox", { name: /LP 검색/ }), getLp()[0].artist);
  expect(covers().length).toBeGreaterThan(0);
  expect(covers().length).toBeLessThanOrEqual(before);
});

test("없는 것을 찾으면 빈 상태를 알려준다", async () => {
  renderLp();
  await userEvent.type(
    screen.getByRole("searchbox", { name: /LP 검색/ }),
    "존재하지않는음반제목zzzz",
  );
  expect(screen.getByText(/찾는 음반이 없습니다/)).toBeInTheDocument();
  expect(covers()).toHaveLength(0);
});

test("검색어를 지우면 다시 전부 보인다", async () => {
  renderLp();
  const box = screen.getByRole("searchbox", { name: /LP 검색/ });
  await userEvent.type(box, "zzzz");
  await userEvent.clear(box);
  expect(covers()).toHaveLength(getLp().length);
});
```

- [ ] **Step 8: 테스트와 타입 검사**

Run: `npx vitest run src/routes/Lp.test.tsx`
Expected: PASS — 4 tests

Run: `npx tsc --noEmit`
Expected: 오류 없음

Run: `npm test`
Expected: PASS — 전부

- [ ] **Step 9: 눈으로 확인한다**

Run: `npm run dev`

- `/music/credits` — 크레딧 3건, Apple Music 링크가 새 탭으로 열린다
- `/music/live` — 포스터 5장이 전부 보이고 이미지가 깨지지 않는다
- `/music/lp` — LP 25장, 검색창에 `misch` 나 `jazz` 를 넣으면 줄어든다
- `/music/gear` — 분류 6개(아웃보드 · 인터페이스·컨버터 · 모니터·헤드폰 · 건반 · 음원 모듈 · 컴퓨터)
- 각 페이지의 "← 음악" 이 `/music` 으로 돌아간다

- [ ] **Step 10: 커밋**

```bash
git add src/routes/Collection.module.css src/routes/Credits.tsx src/routes/Live.tsx \
        src/routes/Lp.tsx src/routes/Gear.tsx src/routes/Lp.test.tsx src/App.tsx
git commit -m "하위 전체 페이지 4종 — 크레딧 · 공연 · LP · 장비

넷이 레이아웃 CSS 를 공유한다. 목록이 주인공인 페이지들이라 머리를
낮게 두고 바로 목록으로 들어간다.

LP 에만 검색을 붙인다. 필터는 넣지 않았다 — 장르가 Discogs 다중
문자열이라 42종으로 쪼개져 축이 되지 않고, 25장 규모에서는 검색만으로
충분하다. 100장을 넘으면 그때 축을 정한다."
```

---

### Task 7: 홈 — 건반 아래에서 갈라진다

이 사이트의 판단 기준선은 **"진입은 하나, 안쪽은 둘"** 이다. 건반에서는 음악과 앱이 계속 섞이고, 분리는 그 아래에서 일어난다. 건반 위에 관을 고르는 토글을 얹지 않는다 — 두 세계가 영영 만나지 않게 되고, 설명이 필요한 장난감은 장난감이 아니다.

**Files:**
- Create: `src/components/HallDoor.tsx` + `HallDoor.module.css`
- Modify: `src/routes/Home.tsx`, `src/routes/Home.module.css`, `src/routes/Home.test.tsx`

**Interfaces:**
- Consumes: Task 2 의 `Work.featured`
- Produces: `<HallDoor musicCount={number} appCount={number} />`

- [ ] **Step 1: 두 관 입구를 만든다**

`src/components/HallDoor.tsx`:

```tsx
import { Link } from "react-router";
import styles from "./HallDoor.module.css";

type Props = { musicCount: number; appCount: number };

/*
  건반은 대표작 큐레이션이라 전부를 담지 못한다. 나머지로 가는 문이 여기다.
  홈에서 관을 고르게 하지 않고 건반을 먼저 만지게 한 뒤, 스크롤한 사람에게만
  보여준다 — 첫 질문이 "너는 뭘 보러 왔니"인 홈은 대개 약하다.
*/
export function HallDoor({ musicCount, appCount }: Props) {
  return (
    <nav className={styles.halls} aria-label="관 선택">
      <Link className={styles.hall} to="/music">
        <span className={styles.name}>음악</span>
        <span className={styles.desc}>자작곡 · 참여 크레딧 · 공연 · LP · 장비</span>
        <span className={styles.count}>{musicCount}곡</span>
      </Link>
      <Link className={styles.hall} to="/apps">
        <span className={styles.name}>앱</span>
        <span className={styles.desc}>설계부터 아이콘까지</span>
        <span className={styles.count}>{appCount}개</span>
      </Link>
    </nav>
  );
}
```

`src/components/HallDoor.module.css`:

```css
.halls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  max-width: 720px;
  margin: 0 auto;
}

.hall {
  display: block;
  padding: 30px 26px 26px;
  border: 1px solid #2c2b35;
  border-radius: 4px;
  text-decoration: none;
  background: rgb(255 255 255 / 0.015);
  transition: border-color 220ms var(--ease-out-strong),
              transform 220ms var(--ease-out-strong);
}

.hall:hover {
  border-color: var(--brass);
  transform: translateY(-2px);
}

.name {
  display: block;
  font-size: 22px;
  letter-spacing: 0.04em;
  margin-bottom: 10px;
}

.desc {
  display: block;
  font-size: 12.5px;
  line-height: 1.75;
  color: var(--ink-soft);
  word-break: keep-all;
  margin-bottom: 16px;
}

.count {
  display: block;
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.16em;
  color: var(--brass);
  opacity: 0.8;
}

@media (max-width: 560px) {
  .halls { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: 홈에 붙인다**

`src/routes/Home.tsx` 를 세 군데 고친다.

(1) import 를 추가한다 (`import { Vinyl } ...` 아래):

```tsx
import { HallDoor } from "../components/HallDoor";
```

(2) `const works = useMemo(() => getWorks(), []);` 바로 아래에 세 줄을 넣는다:

```tsx
  // 건반은 대표작 큐레이션이다. 전체 목록이 아니다 (스펙 §2).
  const featured = useMemo(() => works.filter((w) => w.featured), [works]);
  const musicCount = works.filter((w) => w.kind === "music").length;
  const appCount = works.filter((w) => w.kind === "app").length;
```

(3) `works` 를 쓰던 곳 셋을 `featured` 로 바꾸고, 건반 아래에 문을 넣는다.

- `press` 콜백 안 `engine.preload(works.map(...))` → `featured.map(...)`
- `press` 의 의존성 배열 `[works, muted]` → `[featured, muted]`
- `const selectedWork = works.find(...)` 는 **그대로 둔다** (선택된 것은 언제나 featured 중 하나지만, 전체에서 찾아도 결과가 같고 의미가 더 넓다)
- `<Keyboard works={works} ... />` → `<Keyboard works={featured} ... />`
- `<WorkPanel ... />` 바로 아래에 추가:

```tsx
      <div className={styles.halls}>
        <p className={styles.hallsLead}>더 있습니다</p>
        <HallDoor musicCount={musicCount} appCount={appCount} />
      </div>
```

또한 `facts` 의 `Op. 01 — 05` 하드코딩을 실제 개수로 바꾼다:

```tsx
              <dd>Op. 01 — {String(featured.length).padStart(2, "0")}</dd>
```

- [ ] **Step 3: 스타일을 더한다**

`src/routes/Home.module.css` **끝에** 추가한다:

```css
/* 건반을 만진 뒤에야 보이는 문. 첫 화면에서 관을 고르게 하지 않는다 */
.halls {
  margin: 120px auto 0;
  padding: 0 28px;
}

.hallsLead {
  margin: 0 0 22px;
  text-align: center;
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
```

- [ ] **Step 4: 홈 테스트에 문 검증을 더한다**

`src/routes/Home.test.tsx` 끝에 추가한다:

```ts
test("건반 아래에 두 관으로 가는 문이 있다", () => {
  renderHome();
  const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
  expect(hrefs).toContain("/music");
  expect(hrefs).toContain("/apps");
});
```

- [ ] **Step 5: 테스트와 타입 검사**

Run: `npx vitest run src/routes/Home.test.tsx`
Expected: PASS — 6 tests

Run: `npx tsc --noEmit`
Expected: 오류 없음

Run: `npm test`
Expected: PASS — 전부

- [ ] **Step 6: 눈으로 확인한다**

Run: `npm run dev`

- 건반이 여전히 **5개**이고 순서가 `noire · consolation · hanilpay · streetlight · koinon` 이다
- 건반을 누르면 소리가 나고 패널이 열린다 (기능이 하나도 안 죽었다)
- 스크롤하면 "더 있습니다" 아래 **음악 / 앱** 두 문이 있다
- 문을 누르면 각 관으로 간다
- `Op. 01 — 05` 가 여전히 맞다

- [ ] **Step 7: 커밋**

```bash
git add src/components/HallDoor.tsx src/components/HallDoor.module.css \
        src/routes/Home.tsx src/routes/Home.module.css src/routes/Home.test.tsx
git commit -m "홈: 건반 아래에서 두 관으로 갈라진다

판단 기준선은 '진입은 하나, 안쪽은 둘'이다. 건반에서는 음악과 앱이
계속 섞이고 분리는 그 아래에서만 일어난다. 건반 위에 관 토글을 얹지
않은 이유는 두 세계가 영영 만나지 않게 되기 때문이다.

홈에서 관을 먼저 고르게 하지 않는다 — 첫 질문이 '너는 뭘 보러 왔니'인
홈은 대개 약하다. 건반을 먼저 만지고, 스크롤한 사람에게만 문을 보여준다.

건반을 featured 로 한정했다. Op. 01 — 05 하드코딩도 실제 개수로 바꿨다."
```

---

### Task 8: 검색 노출 — 메타와 sitemap

스펙 §8(선행 문서)이 검색 노출을 명시적 자산으로 잡았다. 라우트가 6개 늘었으므로 sitemap 을 만든다. 구워진 JSON 을 읽어 생성하므로 콘텐츠가 늘면 자동으로 따라온다.

**Files:**
- Create: `scripts/build-sitemap.ts`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `src/content/{songs,apps}.json`
- Produces: `public/sitemap.xml` (빌드 산출물, git 에 넣지 않는다)

- [ ] **Step 1: 생성 스크립트를 만든다**

`scripts/build-sitemap.ts`:

```ts
/*
  라우트가 6개 늘었으므로 sitemap 을 만든다. 구워진 JSON 에서 slug 를 읽으므로
  작업물이 늘면 따로 손대지 않아도 따라온다.

  이 파일은 빌드 산출물이라 git 에 넣지 않는다 — 커밋된 JSON 과 달리 이건
  전적으로 파생물이고, 디프에 남으면 콘텐츠 변경마다 노이즈만 는다.
*/
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://www.thekjstudio.com";

const STATIC_PATHS = [
  "/", "/music", "/apps", "/about",
  "/music/credits", "/music/live", "/music/lp", "/music/gear",
];

function slugs(file: string): string[] {
  const raw = readFileSync(resolve(ROOT, "src/content", file), "utf8");
  return (JSON.parse(raw) as { slug: string }[]).map((x) => x.slug);
}

const paths = [
  ...STATIC_PATHS,
  ...[...slugs("songs.json"), ...slugs("apps.json")].map((s) => `/work/${s}`),
];

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  paths.map((p) => `  <url><loc>${ORIGIN}${p}</loc></url>`).join("\n") +
  `\n</urlset>\n`;

writeFileSync(resolve(ROOT, "public/sitemap.xml"), xml, "utf8");
console.log(`✓ sitemap.xml — ${paths.length}개 경로`);
```

- [ ] **Step 2: 빌드에 연결한다**

`package.json` 의 `build` 를 바꾼다 (`fetch-content` 뒤, `vitest` 앞에 넣는다 — 갓 구운 JSON 을 읽어야 한다):

```jsonc
"build": "node --env-file-if-exists=.env --import tsx scripts/fetch-content.ts && node --import tsx scripts/build-sitemap.ts && vitest run && tsc --noEmit && vite build",
```

`sitemap` 스크립트도 따로 둔다:

```jsonc
"sitemap": "node --import tsx scripts/build-sitemap.ts",
```

- [ ] **Step 3: 산출물을 git 에서 뺀다**

`.gitignore` 에 한 줄 추가:

```
public/sitemap.xml
```

- [ ] **Step 4: 돌려서 확인한다**

Run: `npm run sitemap`
Expected: `✓ sitemap.xml — 13개 경로` (정적 8 + 작업물 5)

Run: `cat public/sitemap.xml | head -12`
Expected: `/`, `/music`, `/apps`, `/about`, `/music/credits`, `/music/live`, `/music/lp`, `/music/gear` 가 순서대로 보인다

- [ ] **Step 5: 전체 빌드**

Run: `npm run build`
Expected: `fetch-content` → `sitemap` → `vitest` → `tsc` → `vite build` 순서로 전부 성공

Run: `git status --short`
Expected: `public/sitemap.xml` 이 나타나지 않는다 (gitignore 됨)

- [ ] **Step 6: 커밋**

```bash
git add scripts/build-sitemap.ts package.json .gitignore
git commit -m "sitemap 생성 — 라우트가 6개 늘었다

구워진 JSON 에서 slug 를 읽으므로 작업물이 늘면 따라온다.
산출물은 git 에 넣지 않는다 — 전적으로 파생물이고 디프에 남으면
콘텐츠 변경마다 노이즈만 는다."
```

---

## 단계 B 완료 판정

전부 초록불이어야 한다.

- [ ] `npm test` 전부 통과
- [ ] `npx tsc --noEmit` 오류 없음
- [ ] `npm run build` 성공 (fetch → sitemap → vitest → tsc → vite)
- [ ] 홈: 건반 5개가 그대로, 소리·패널·상세 링크 정상, 스크롤하면 두 관 입구
- [ ] `/music`: 다섯 섹션이 순서대로, 각 섹션에 "전체 N →"
- [ ] `/apps`: 앱 카드 3개
- [ ] `/music/credits` 3건 · `/music/live` 5건 · `/music/lp` 25장 · `/music/gear` 6분류
- [ ] LP 검색이 실제로 걸러낸다
- [ ] 포스터·LP 커버 이미지가 전부 뜬다 (저장소 파일과 Storage URL 양쪽)
- [ ] **콘텐츠를 바꿔도 빌드가 안 깨진다** — `src/content/apps.json` 의 제목을 임시로 바꿔 `npm run build` 를 돌려 확인하고 원복
- [ ] 누출 회귀 테스트 통과 (`src/lib/content-leak.test.ts`)

---

## 범위 밖 — 다음으로 미루는 것

| 항목 | 어디로 |
|---|---|
| LP 필터 축(장르·연대·레이블) | 100장을 넘은 뒤. 지금은 장르가 Discogs 다중 문자열이라 42종으로 쪼개져 축이 안 된다 |
| 빌드의 "이전 대비 행 수 급감" 감지 | 지금은 `assertContentNotEmpty` 로 0건만 막는다. 스냅샷 비교는 별도 작업 |
| 누출 테스트의 화이트리스트 전환 | 블랙리스트의 근본 한계. 별도 범위 |
| `tsconfig` 의 `types: ["node"]` 를 scripts 로 한정 | 지금은 브라우저 코드가 `process` 를 써도 타입 검사를 통과한다 |
| `pg_default_acl` 전역 기본값 | 사용자가 "그대로 두고 단언 쿼리로 대응"을 선택 |
| `touch_updated_at` 의 `search_path` 미설정 | Supabase advisor WARN |
| 자유 텍스트 컬럼(`notes` 등) 노출 | 노출하려면 값에 가격·일련번호·위치 언급이 없는지 사람이 샘플 검토해야 한다 |
| 입력 앱 (KJ Studio 앱) | 스펙 3 |
