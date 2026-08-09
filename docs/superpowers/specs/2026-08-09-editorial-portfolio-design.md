# the KJ Studio — 에디토리얼 포트폴리오 설계

**작성:** 2026-08-09

## 배경 / 전환

3D 스튜디오 방(C1~C6a)을 만들어 최종 결과까지 본 뒤, 본인 판단으로 **접는다** —
"사이트는 사이트다워야 한다." 인터랙션(3D 방·건반·턴테이블 장난감)이 주인공인 방향을 버리고,
**콘텐츠가 주인인 에디토리얼 포트폴리오**로 간다. 넣을 콘텐츠는 본인이 가진 것 전부:
작업물(음악·앱), **스튜디오 장비/랙 정보**, **LP 컬렉션**.

**3D 방은 사라지지 않는다** — `studio-room` 브랜치에 그대로 보존(오디오 엔진 등 재사용 여지).

## 기반 / 브랜치 전략

- **새 브랜치를 `main`(프로덕션)에서 딴다.** 3D 없는 깨끗한 라이브 기반.
- **재사용(이미 있음):** Supabase 콘텐츠 파이프라인(`fetch-content` → `public_*` 뷰 → 구운 JSON),
  프라이버시 화이트리스트, `mapLp`/`mapGear`, `lp.json`(25)·`gear.json`(13),
  Work 상세·About 라우트, Header/Footer, 전역 스타일 토큰, 빌드/Deploy Hook.
- **얇게 포팅(studio-room 에서 가져옴):** `getGear`/`getLps` 게터(화이트리스트 파생),
  `mapGear` 에 `rackU`·`rackMounted` 매핑, `content-types` 의 gear 필드 2개. 재빌드로 최신 데이터.
- **버림:** 3D 홈(건반·턴테이블·바이닐이 주인공인 `Home.tsx` 인터랙션). 컴포넌트 자산은
  git 에 남으니 필요 시 정적 장식으로만 소량 재활용 가능(범위 밖 기본).

## 데이터 (전부 정적 스냅샷, 방문자 런타임 조회 0)

| 데이터 | 필드(화이트리스트) | 수 |
|---|---|---|
| Works(음악·앱) | title, year, note, cover, body, listen/links, featured, slug | 곡·앱 |
| Gear(장비) | name, category, **rackU, rackMounted** | 13 |
| LP | artist, title, label, catalogNo, releaseYear, country, genre, format, speed, cover, appleMusicUrl | 25 |

- **재산정보(가격·시세·시리얼·위치)는 계속 차단** — 기존 화이트리스트·누출 회귀 테스트 그대로 유효.
- LP `cover` 는 공개 버킷 URL(이미지). `genre` 는 Discogs식 다중 문자열 →
  **대표 장르 = 첫 토큰**(예: "Jazz, Post Bop, Modal" → Jazz)으로 파생해 필터·표시.

## 사이트 구조 (라우트)

- **`/` 홈** — 에디토리얼. 히어로(the KJ Studio · 테크니컬 아티스트 / 작곡가·개발자, 한 줄 정체성)
  → 스크롤 섹션: 소개, 선별 작업물(featured), 스튜디오 티저, 컬렉션 티저, 연락처.
- **`/studio` 스튜디오** — 장비/랙. **2D 랙 다이어그램**(rackMounted 를 rackU 순 세로 U 목록으로,
  실제 랙처럼) + 카테고리별 **전체 장비 인벤토리**.
- **`/collection` LP 컬렉션** — 커버 그리드(25). 대표 장르·연도 **필터/정렬**. 항목 클릭 →
  상세(아트워크·레이블·카탈로그·연도·국가·포맷·속도·Apple Music 링크).
- **`/work/:slug`** — 기존 작업 상세(재사용, 톤 정렬).
- **`/about`** — 소개(재사용/정련).
- Header(네비: Work·Studio·Collection·About) + Footer 공통.

## 디자인 시스템

- **톤:** 다크 프리미엄(NOIRE 계열) — 딥 차콜 배경, 상아/웜 그레이 텍스트, 절제된 놋쇠/앰버 악센트.
- **타이포:** 기존 자산(serif 제목 + mono 메타/라벨). 큰 제목·넉넉한 여백·명확한 위계.
- **레이아웃:** 넓은 여백, 그리드 기반, 애플식 절제. 콘텐츠가 숨 쉬게.
- **모션:** 최소·품격 — 스크롤 진입 페이드/업, 호버 미세 상승. 과한 인터랙션 금지(전환의 교훈).
- **반응형:** 모바일 우선 그리드(LP 그리드 2열→다열, 랙 다이어그램 세로 유지).

## 컴포넌트 (단위)

**재사용:** `Header`·`Footer`·`Work`·`About`·전역 토큰·`applyMeta`(OG 메타).

**신규(각 한 책임):**
- `Hero` — 홈 상단 정체성 블록.
- `SectionIntro` — 소개 카피 블록.
- `WorkGrid` + `WorkCard` — featured/전체 작업물 카드(커버·제목·연도·역할). 클릭 → `/work/:slug`.
- `RackDiagram` — `getGear()` 의 mounted 를 rackU 순 세로 스택으로(U 라벨·장비명). 순수 배치는 기존
  `rackLayout` 아이디어 재사용하되 2D 전용 얇은 헬퍼.
- `GearInventory` — 카테고리별 그룹 목록(name·category). 재산정보 없음.
- `LpGrid` + `LpCard` — 커버 그리드 + 상세. 안전 필드만(가격·시리얼 없음).
- `useLpFilter`(순수) — 대표 장르·연도로 거르고 정렬. 테스트 대상.
- `primaryGenre(genre: string): string`(순수) — 다중 장르 문자열 → 첫 토큰.

## 데이터 흐름

구운 JSON → 게터(`getWorks`/`getGear`/`getLps`, 화이트리스트) → 컴포넌트. **방문자 런타임 Supabase 0.**
콘텐츠 갱신은 기존 경로(재빌드/Deploy Hook). 관리자 편집(장비 배치 저장 등)은 **범위 밖**(원하면 별도).

## 에러 처리 / 빈 상태

- 데이터 0건 섹션은 렌더 생략(빌드 불변식 `assertContentNotEmpty` 유지).
- 이미지(LP 커버) 로드 실패 시 플레이스홀더(장르색 or 이니셜). `loading="lazy"`.
- 라우트 미매치 → 홈.

## 테스트 전략

- **순수 단위:** `primaryGenre`(다중/단일/빈 문자열), `useLpFilter`(장르·연도 필터·정렬 경계),
  `buildRackDiagram`(rackU 순·빈 U), 게터 화이트리스트(재산정보 부재).
- **구조 테스트(콘텐츠 독립):** 홈/스튜디오/컬렉션이 특정 제목·장비명을 하드코딩하지 않고
  데이터 개수·구조로 검증(Phase B 교훈: 하드코딩 금지, Deploy Hook 배포가 안 깨지게).
- **누출 회귀:** 기존 `content-leak.test` 유지 — gear/LP 노출에 재산정보 0.
- **기계:** `npm test`·`tsc`·`vite build`.

## 구현 단계 (플랜 분해)

1. **P1 — 기반·디자인 시스템·셸·홈:** 새 브랜치, 데이터 게터 포팅, 재빌드, 전역 토큰·Header 네비,
   Hero + 홈 스크롤 섹션(featured 작업물·티저). 라우트 골격.
2. **P2 — 스튜디오(`/studio`):** RackDiagram + GearInventory.
3. **P3 — 컬렉션(`/collection`):** LpGrid + 필터/정렬 + LpCard 상세.
4. **P4 — Work/About 정렬·마감·배포:** 상세·소개 톤 정렬, 반응형·접근성·메타, 프로덕션 배포.

각 단계는 독립적으로 동작·검증 가능. P1 이후 배포해도 사이트가 선다.

## 범위 밖

- 3D 방(보존만), 관리자 런타임 편집(장비 배치 저장), LP 재생 오디오(발췌), 다국어.
- 인터랙티브 건반/턴테이블 홈(대체됨).
