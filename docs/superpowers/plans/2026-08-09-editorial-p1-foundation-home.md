# 에디토리얼 포트폴리오 P1 — 기반·셸·홈 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development 또는 superpowers:executing-plans. Steps use checkbox (`- [ ]`).
> **주의:** 홈은 **시각 결과**가 합격선이다. 순수 로직(게터·파생)만 단위 테스트하고, 에디토리얼 레이아웃·톤은 사람 눈(브라우저)으로 본다.

**Goal:** 3D/건반 홈을 버리고, 기존 다크 디자인 시스템 위에 **에디토리얼 홈 + 사이트 셸(네비·라우트)**을 세운다. 장비·LP 데이터 게터를 붙여 홈 티저까지.

**Architecture:** `main` 기반 `editorial` 브랜치. 전역 토큰(`src/styles/global.css`: --stage/--ink/--ink-soft/--brass/--serif/--mono)·Header/Footer·Work/About·콘텐츠 파이프라인 재사용. 홈은 스크롤 섹션 구성(Hero → 소개 → 선별 작업물 → 스튜디오 티저 → 컬렉션 티저 → 연락). `/studio`·`/collection` 은 P1 에선 최소 자리표시 라우트(P2·P3 에서 채움).

**Tech Stack:** React 19 · react-router 8 · TS · Vite · Vitest · CSS Modules

**설계 문서:** `docs/superpowers/specs/2026-08-09-editorial-portfolio-design.md`

## Global Constraints

- **기존 디자인 토큰만 사용**(`src/styles/global.css`). 새 색/폰트 도입 자제 — --stage/--ink/--ink-soft/--brass/--serif/--mono/--ease-out-strong.
- **프라이버시 화이트리스트 유지.** gear/LP 노출에 가격·시세·시리얼·위치 0. 기존 `content-leak.test` 계속 초록.
- **콘텐츠 하드코딩 금지**(Phase B 교훈). 홈/구조 테스트는 특정 제목·장비명이 아니라 데이터 개수·구조로 검증 — 콘텐츠 바뀌어도 Deploy Hook 배포가 안 깨지게.
- **방문자 런타임 Supabase 0.** 구운 JSON → 게터 → 컴포넌트.
- 브랜치 `editorial`. Node `>=22.21.0`. `main` 은 이 플랜에서 병합하지 않는다(배포는 P4).

## File Structure

| 파일 | 책임 |
|---|---|
| `src/lib/gear.ts`(신규) | `getGear()` 화이트리스트 게터(+rackU·rackMounted) |
| `src/lib/lp.ts`(신규) | `getLps()` 화이트리스트 게터 |
| `scripts/content/map.ts`(수정) | `mapGear` 에 `rackU`·`rackMounted` |
| `src/lib/content-types.ts`(수정) | `GearContent` 에 `rackU`·`rackMounted` |
| `src/content/gear.json`·`lp.json`(재생성) | 재빌드 |
| `src/components/Header.tsx`(수정) | 네비: Work·Studio·Collection·About |
| `src/routes/Home.tsx`(교체) | 에디토리얼 홈(섹션 조립) |
| `src/routes/Home.module.css`(교체) | 홈 스타일 |
| `src/components/Hero.tsx`(신규) | 정체성 히어로 |
| `src/components/WorkGrid.tsx`·`WorkCard.tsx`(신규) | 작업물 카드 그리드 |
| `src/components/StudioTeaser.tsx`·`CollectionTeaser.tsx`(신규) | 홈 티저 |
| `src/routes/Studio.tsx`·`Collection.tsx`(신규, 자리표시) | P2·P3 채울 최소 라우트 |
| `src/App.tsx`(수정) | `/studio`·`/collection` 라우트 |

---

### Task 1 — 데이터 게터 + 재빌드 (장비·LP)

**Files:** Create `src/lib/gear.ts`(+test), `src/lib/lp.ts`(+test); Modify `scripts/content/map.ts`, `src/lib/content-types.ts`; 재생성 `src/content/gear.json`·`lp.json`
**Interfaces — Produces:**
- `type Gear = { id; name; category; sortOrder; rackU: number|null; rackMounted: boolean }` · `getGear(): Gear[]`(sortOrder 순)
- `type Lp = { id; artist; title; label; catalogNo; releaseYear; country; genre; format; speed; cover; appleMusicUrl; sortOrder }` · `getLps(): Lp[]`(sortOrder 순)

- [ ] **Step 1: content-types 에 gear 필드 추가** — `GearContent` 에 `rackU: number | null`·`rackMounted: boolean`.
- [ ] **Step 2: map.ts mapGear 확장** — `rackU: row.rack_u == null ? null : Number(row.rack_u)`, `rackMounted: Boolean(row.rack_mounted)`.
- [ ] **Step 3: 게터 테스트**(`src/lib/gear.test.ts`, `src/lib/lp.test.ts`) — 화이트리스트(재산정보 키 부재), 정렬:

```ts
// gear.test.ts
import { getGear } from "./gear";
test("장비를 sortOrder 순으로, 재산정보 없이", () => {
  const g = getGear();
  expect(g.length).toBeGreaterThan(0);
  for (let i = 1; i < g.length; i++) expect(g[i].sortOrder).toBeGreaterThanOrEqual(g[i-1].sortOrder);
  const k = g[0] as Record<string, unknown>;
  for (const f of ["purchasePrice","currentPrice","serialNumber","location","userId","householdId"]) expect(k[f]).toBeUndefined();
});
```
```ts
// lp.test.ts
import { getLps } from "./lp";
test("LP 를 sortOrder 순으로, 안전 필드만", () => {
  const l = getLps();
  expect(l.length).toBeGreaterThan(0);
  for (const f of ["purchasePrice","currentPrice","serialNumber","location"]) expect((l[0] as Record<string,unknown>)[f]).toBeUndefined();
  expect(l[0].appleMusicUrl !== undefined).toBe(true);
});
```

- [ ] **Step 4: 게터 구현** — 구운 JSON 을 명시 필드 화이트리스트로 매핑(spread 금지), sortOrder 정렬. (studio-room 의 `getGear`/`getLps` 패턴 재사용 가능. `getGear` 는 rackU·rackMounted 포함.)
- [ ] **Step 5: 재빌드** `node --env-file-if-exists=.env --import tsx scripts/fetch-content.ts` → `gear.json` 에 `rackU`·`rackMounted`, `lp.json` 25건.
- [ ] **Step 6: 누출 테스트 + 신규 테스트 통과** → **Step 7: 커밋**

---

### Task 2 — Hero + 작업물 카드

**Files:** Create `src/components/Hero.tsx`(+css), `src/components/WorkCard.tsx`(+css), `src/components/WorkGrid.tsx`
**Interfaces:** Consumes `getWorks()`(기존 `src/lib/works.ts`: `Work{ slug,title,kind,note,year,cover?,listen,body }`)
- `WorkCard({ work }: { work: Work })` → 커버·제목·연도·kind(음악/앱). 클릭 → `/work/:slug`(react-router `Link`).
- `WorkGrid({ works }: { works: Work[] })` → 반응형 그리드.
- `Hero()` → the KJ Studio 워드마크 + 한 줄 정체성(테크니컬 아티스트 · 작곡가·개발자). 정적 카피.

- [ ] **Step 1: Hero** — serif 대형 워드마크(--brass 마침표 악센트), --ink-soft 부제. 반응형 타이포.
- [ ] **Step 2: WorkCard** — `<Link to={`/work/${work.slug}`}>` 안에 커버 이미지(`loading="lazy"`, 없으면 --stage 톤 플레이스홀더) + 제목(serif) + `${work.year} · ${work.kind==='music'?'음악':'앱'}`(mono). 호버 미세 상승(--ease-out-strong).
- [ ] **Step 3: WorkGrid** — CSS grid, 모바일 1열 → 데스크 2~3열.
- [ ] **Step 4: 컴파일 + 사람 눈** → **Step 5: 커밋**

---

### Task 3 — 스튜디오·컬렉션 티저

**Files:** Create `src/components/StudioTeaser.tsx`(+css), `src/components/CollectionTeaser.tsx`(+css)
**Interfaces:** Consumes `getGear()`·`getLps()`(Task 1)
- `StudioTeaser()` — 장비 총수 + 대표 장비명 몇 개(카테고리 라벨) + `/studio` 로 가는 링크.
- `CollectionTeaser()` — LP 커버 몇 장 나열(가로 스트립) + 총수 + `/collection` 링크.

- [ ] **Step 1: StudioTeaser** — `getGear()` 개수·상위 몇 개 이름. "스튜디오 — 장비 N점" 헤드 + 링크. 재산정보 없음.
- [ ] **Step 2: CollectionTeaser** — `getLps()` 앞 6~8장 커버 썸네일(lazy) + "컬렉션 — LP N장" + 링크.
- [ ] **Step 3: 컴파일 + 사람 눈** → **Step 4: 커밋**

---

### Task 4 — 에디토리얼 홈 조립 + 네비 + 라우트

**Files:** Modify `src/routes/Home.tsx`·`Home.module.css`, `src/components/Header.tsx`, `src/App.tsx`; Create `src/routes/Studio.tsx`·`Collection.tsx`(자리표시)
- `Home` 을 건반 버전에서 에디토리얼로 **교체**: `<Hero/>` → 소개 카피 → `<WorkGrid works={featured}/>`(getWorks 의 featured, 없으면 전체 앞) → `<StudioTeaser/>` → `<CollectionTeaser/>` → 연락 블록. `applyMeta`(제목·설명·이미지) 유지. 건반·오디오 import 제거.
- `Header` 네비: Work(`/#work` 앵커 또는 홈 스크롤)·Studio(`/studio`)·Collection(`/collection`)·About(`/about`)·연락(mailto). `aria-current`.
- `Studio.tsx`·`Collection.tsx`: 최소 페이지(제목 + "곧" 안내 + 각각 티저 재사용) — P2·P3 에서 대체.
- `App.tsx`: `/studio`·`/collection` 라우트 추가.

- [ ] **Step 1: Home 교체**(섹션 조립, applyMeta, 건반/오디오 의존 제거)
- [ ] **Step 2: Header 네비 갱신**
- [ ] **Step 3: Studio·Collection 자리표시 + App 라우트**
- [ ] **Step 4: 홈 구조 테스트**(`Home.test.tsx` 재작성) — 콘텐츠 하드코딩 없이: 히어로 존재, 작업물 카드 수 = featured 수(또는 >0), 스튜디오·컬렉션 티저 섹션 존재, `/work/:slug` 링크 형식. (Phase B 교훈: 제목·장비명 하드코딩 금지)
- [ ] **Step 5: 기계 검증** — `npm test`·`tsc`·`vite build`. → **Step 6: 사람 눈**(에디토리얼 홈 톤·위계·반응형, 네비 이동) → **Step 7: 커밋**

---

## P1 완료 기준
- [ ] 건반 홈 사라지고 에디토리얼 홈(히어로·작업물·스튜디오/컬렉션 티저·연락)
- [ ] 네비(Work·Studio·Collection·About) 동작, `/studio`·`/collection` 자리표시 라우트
- [ ] `getGear`·`getLps` 게터(화이트리스트) + gear.json 에 rackU·rackMounted, 누출 테스트 초록
- [ ] `npm test`·`tsc`·`vite build`, 콘텐츠 독립 구조 테스트
- [ ] 기존 토큰·Work/About·Footer 재사용, `main` 무변경

## 이후
- **P2** `/studio`(RackDiagram + GearInventory) · **P3** `/collection`(LpGrid + 필터·정렬) · **P4** Work/About 정렬·반응형·접근성·메타·**배포**
- 옛 인터랙티브 컴포넌트(Keyboard/Vinyl/Turntable 등) 제거는 P4 청소(지금은 미사용으로 무해).
