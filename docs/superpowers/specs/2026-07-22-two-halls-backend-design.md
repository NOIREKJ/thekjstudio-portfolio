# the KJ Studio — 두 개의 관, 그리고 서버

**작성일:** 2026-07-22
**상태:** 설계 확정, 구현 계획 대기
**대상:** `thekjstudio-portfolio` 저장소 (기존 사이트를 고친다. 새로 만들지 않는다)
**선행 문서:** `2026-07-21-instrument-site-design.md` — 이 문서는 그것의 일부 결정을 **개정**한다

---

## 1. 무엇을 만드는가

작업물이 음악과 앱 두 갈래로 계속 늘어나고, 여기에 **LP 컬렉션 · 음향 장비 ·
공연 포스터 · 참여 크레딧**이 더해진다. 지금 구조(작업물 하나 = md 파일 하나)로는
난잡해진다.

두 가지를 한다.

1. **사이트를 두 관(館)으로 재구조화한다** — 음악관 / 앱관
2. **콘텐츠의 단일 진실을 Supabase로 옮긴다** — 사이트는 그 서버를 읽는 첫 번째
   소비자이고, 앞으로 만들 앱이 두 번째 소비자가 된다

### 판단 기준선 (개정)

선행 문서의 기준선은 *"이것이 음악과 앱, 두 세계를 잇는가"* 였고, 그 근거로 건반에서
음악/앱을 **일부러 섞어** 배치했으며 *"분리하면 기준선에 어긋난다"* 고 명시했다.

이 문서는 그 기준선을 폐기하지 않고 **층으로 나눈다.**

> **진입은 하나, 안쪽은 둘.**
> 건반에서 두 세계가 만나고, 관 안에서 각자 깊어진다.

분리는 첫 화면이 아니라 그 아래에서 일어난다. 방문자가 처음 만지는 것은 여전히
음악과 앱이 섞인 하나의 악기다.

---

## 2. 결정 기록

| 결정 | 근거 |
|---|---|
| 분류축은 **음악 / 앱** | LP·장비·공연·크레딧은 전부 음악가 정체성의 연장이다. '만든 것/모은 것'으로 가르면 음악과 앱이 다시 한 덩어리가 되어 원래 문제가 안 풀린다 |
| LP·장비·공연·크레딧은 **음악관의 하위 유형** | 앱이 아니다. 별도 최상위 관을 만들면 관이 여섯 개가 되고 그게 곧 난잡이다 |
| 홈은 **건반 + 그 아래 두 관 입구** | 건반을 없애면 이 사이트의 존재 이유가 한 층 뒤로 밀린다. 건반 위에 음악/앱 토글을 얹는 안은 두 세계가 영영 안 만나고, 설명이 필요한 장난감은 장난감이 아니다 |
| 건반은 **전체 목록이 아니라 대표작 큐레이션**으로 재정의 | LP 200장을 건반에 올릴 수 없다. `featured` 지정 항목만 건반이 된다 |
| 음악관은 **세로 스택, 섹션마다 고유 형식** | 5종은 어울리는 표현이 다르다. 크레딧은 표, LP는 정사각 격자, 공연은 세로 포스터, 장비는 사양 목록, 자작곡은 글. 하나의 격자에 다 밀어넣는 것이 난잡해지는 길이다 |
| 탭 방식을 뺀다 | 탭 뒤는 안 본다. "작곡가이자 수집가"라는 전체상이 한 화면에 한 번도 안 나온다 |
| 목차 방식을 뺀다 | 홈에서 관을 고르고 또 고르게 한다. 문이 두 겹이고, 목차 페이지에는 볼 것이 없다 |
| md를 거치지 않고 **바로 Supabase** | 화면 설계가 목업으로 이미 확정됐으므로 md 중간 단계는 순수 낭비다. LP를 md 파일로 만드는 것은 입력 비용이 과하다 |
| **기존 `KJ Data App` 프로젝트를 확장**한다 | 여기에 StudioRack 데이터가 이미 살아 있다 — LP 25건, 장비 3건, Discogs 캐시 69건. Discogs 릴리즈 단위 시세 조회와 Apple Music 매칭이 구현되어 있다. 새로 짜지 않는다 |
| `Hanil Church` 프로젝트에는 **붙이지 않는다** | 교인 개인정보와 개인 포트폴리오를 한 DB에 두지 않는다 |
| `studiorack_*` 테이블은 **이름도 구조도 유지**한다 | iOS RackVault가 아직 그 테이블로 돌고 있다. 새 앱이 설 때까지 살아 있어야 한다. 개명은 앱을 교체할 때 한다 |
| 글 본문(`body`)도 **DB에 둔다** | 앱이 공개 제품이 되면 곡 소개글도 API로 나가야 하는데 md는 앱이 못 읽는다. 단일 진실을 DB에 둔다 |
| 사이트는 **빌드타임에 굽는다** | anon 키가 브라우저에 아예 나가지 않아 보안 표면이 사라진다. 선행 문서 §8이 검색 노출을 명시적 자산으로 잡았고 런타임 조회는 그것을 깬다. 포트폴리오에 실시간 갱신은 필요 없다 |
| 구운 JSON을 **git에 커밋**한다 | 키 없이도 `npm run dev`가 돌고, 디프로 변경이 보이고, Supabase가 죽어도 빌드가 산다. 배포가 DB 가용성에 인질로 잡히면 안 된다 |
| 공개는 **항목별 플래그**, 기본값 비공개 | 민감 필드는 사이트로 나가는 경로에서 아예 제외한다 |

### StudioRack의 처리

**StudioRack(iOS RackVault)은 접고 KJ Studio 앱 하나로 흡수한다.** 새 앱은 처음에는
본인 전용 입력 도구로 시작하고, 나중에 공개 앱으로 전환한다.

이 문서의 범위에서는 **데이터만 흡수**한다. RackVault 앱 자체는 새 앱이 설 때까지
그대로 돌아가야 하므로 테이블을 건드리지 않는다.

---

## 3. 정보 구조

```
/                  홈 — 건반(대표작 큐레이션) + 스크롤 → 두 관 입구
/music             음악관 — 세로 스택 5섹션
  /music/credits     전체 참여 크레딧 (표)
  /music/live        전체 공연 (포스터 격자)
  /music/lp          전체 LP (커버 격자 + 검색·필터)
  /music/gear        전체 장비 (공개 항목만)
/apps              앱관 — 카드 격자
/work/:slug        상세 — 글이 있는 것만 (자작곡 · 앱)
/about
```

### 홈

건반은 그대로다. 다만 **전체 작업물이 아니라 `featured` 지정 항목**이 건반이 된다.
음악과 앱은 계속 섞여 배치되고, 음 높이 오름차순 정렬도 유지한다.

건반 아래로 스크롤하면 **음악 / 앱** 두 입구가 나온다.

### 음악관 — 섹션 순서와 형식

| 섹션 | 형식 | 홈 미리보기 | 깊이 |
|---|---|---|---|
| 자작곡 | 글 목록 (커버 + 제목 + 연도) | 전체 | `/work/:slug` |
| 참여 크레딧 | 표 (작품 / 역할 · 연도) | 3행 | `/music/credits` |
| 공연 | 세로 포스터 격자 | 4장 | `/music/live` |
| LP 컬렉션 | 정사각 커버 격자 | 7장 | `/music/lp` |
| 장비 | 사양 목록 | 3행 | `/music/gear` |

미리보기 개수를 절제하지 않으면 이 안도 난잡해진다. 위 숫자는 설계값이며
구현 중 조정할 수 있으나 **각 섹션이 화면 절반을 넘지 않는다**는 원칙은 지킨다.

### 앱관

카드 격자. 논쟁거리가 없다. 상세는 기존 `/work/:slug`를 그대로 쓴다.

---

## 4. 데이터 모델

Supabase 프로젝트: **`KJ Data App`** (`eiiifadgwbxfutallmsq`, ap-southeast-1)

### 기존 테이블 — 컬럼만 추가

| 테이블 | 현재 행 | 추가 |
|---|---|---|
| `studiorack_records` (LP) | 25 | `visibility` `sort_order` |
| `studiorack_items` (장비) | 3 | `visibility` `sort_order` |
| `discogs_cache` · `profiles` · `households` · `household_members` | — | **손대지 않는다** |

### 신규 테이블 4종

| 테이블 | 고유 컬럼 |
|---|---|
| `songs` | `slug` `title` `year` `note` `sound_path` `cover_path` `body` `listen`(jsonb) `featured` |
| `apps` | `slug` `title` `year` `note` `cover_path` `screens`(jsonb) `body` `links`(jsonb) `featured` |
| `credits` | `artist` `work_title` `album` `roles`(text[]) `year` `url` |
| `performances` | `title` `venue` `date` `poster_path` `role` `url` |

**전 테이블 공통 컬럼**

```
id           uuid       기본키
user_id      uuid       default auth.uid()
household_id uuid       default my_default_household_id()   -- 기존 RLS 구조를 따른다
created_at   timestamptz
updated_at   timestamptz
visibility   text       default 'private'  check in ('public','private')
sort_order   integer    default 0
```

`visibility`의 **기본값은 `private`**다. 실수로 공개되는 것보다 실수로 안 보이는 편이 낫다.

### `featured`와 건반의 제약

건반은 하나의 5음 음계 안에서만 성립한다. 아무렇게나 눌러도 불협이 되지 않는 것이
이 사이트의 핵심 장치이므로 음을 임의로 늘릴 수 없다.

- 사용 가능한 음: **C4 D4 E4 G4 A4 C5 D5** (C장조 5음 음계, 두 옥타브)
- 따라서 **`featured` 상한은 7개**
- `note`는 자동 배정하지 않고 **수동 지정**한다
- 8번째를 켜거나 `note`가 중복되면 **빌드를 실패시킨다**
  — 검사 위치는 `scripts/fetch-content.ts`. DB 제약이 아니라 빌드 검사로 두는 이유는,
  앱에서 8번째를 켜는 순간 실패해야 할 것은 앱의 저장이 아니라 사이트의 배포이기 때문이다

조용히 불협화음이 나는 것보다 빌드가 깨지는 편이 낫다.

### 이미지

경로 규칙 하나로 두 출처를 모두 지원한다.

- `/images/…` 로 시작 → 저장소의 `public/images/` 파일 (기존 자산 그대로)
- `http…` 로 시작 → Supabase Storage 공개 버킷

기존 자산을 Storage로 옮기는 헛수고를 하지 않는다. 신규 자산(LP 커버, 공연 포스터)은
Storage에 올린다.

---

## 5. 보안 경계 — 공개 뷰

이 절이 이 문서에서 가장 중요하다.

`studiorack_records`와 `studiorack_items`에는 `purchase_price` `current_price`
`serial_number` `location` `market_price_usd` 같은 **재산 정보**가 들어 있다.
실명과 작업실 사진이 있는 개인 사이트에서 이것이 새면 그대로 사고다.

**RLS는 행 단위 보안이지 컬럼 단위가 아니다.** "이 LP는 공개"라고 표시하는 순간
그 행 전체가 조회 가능해진다. 따라서 행 필터만으로는 부족하다.

### 공개 뷰 6개가 유일한 출구다

```
public_songs   public_apps   public_credits
public_performances   public_lp   public_gear
```

각 뷰는 두 가지를 동시에 한다.

1. `WHERE visibility = 'public'` — 행 필터
2. **안전한 컬럼만 명시적으로 나열** — `select *`를 쓰지 않는다.
   나중에 민감한 컬럼이 추가돼도 자동으로 새지 않는다

| 뷰 | 내보내는 것 | **절대 내보내지 않는 것** |
|---|---|---|
| `public_lp` | `artist` `title` `label` `catalog_no` `release_year` `country` `genre` `format` `speed` `cover` `apple_music_url` `sort_order` | `purchase_price` `current_price` `purchase_date` `market_price_usd` `market_listings` `market_checked_at` `location` `notes` `media_condition` `sleeve_condition` `user_id` `household_id` `discogs_release_id` |
| `public_gear` | `name` `category` `sort_order` | `purchase_price` `current_price` `serial_number` `location` `is_new` `notes` `user_id` `household_id` |
| `public_songs` · `public_apps` · `public_credits` · `public_performances` | 표시에 필요한 것만 | `user_id` `household_id` |

### 권한

- `anon` 에게는 **뷰 SELECT 권한만** 준다. 원본 테이블 권한은 0
- `authenticated`(앱)는 기존 RLS 정책대로 원본 테이블을 쓴다
- **빌드 스크립트는 원본 테이블을 절대 조회하지 않고 뷰만 읽는다.**
  service key가 RLS를 우회해도 뷰의 컬럼 목록은 우회할 수 없다

### 누출 회귀 테스트

구워진 JSON 전체를 문자열로 훑어 금지 키가 하나라도 있으면 **빌드를 실패시킨다.**

```
purchase_price  current_price  purchase_date  serial_number
market_price    market_listings  location  household_id  user_id
```

사람의 주의력에 재산 목록을 맡기지 않는다. 이 테스트는 스펙 A 단계에서 들어가고
이후 모든 변경에 대해 계속 돈다.

---

## 6. 빌드 배관

```
Supabase ──(빌드 시, service key, 공개 뷰만)──▶ scripts/fetch-content.ts
                                                     │
                                                     ▼
                                            src/content/*.json  (git 커밋)
                                                     │
                                                     ▼
                                          vite build ──▶ Vercel
```

```jsonc
// package.json
"build": "tsx scripts/fetch-content.ts && tsc --noEmit && vite build"
```

### 키가 없을 때의 동작

`SUPABASE_SERVICE_KEY`가 없으면 **실패하지 않는다.** 커밋된 JSON을 그대로 쓰고
경고를 출력한다. 이유:

- 키 없이도 `npm run dev`가 돌아야 한다
- Supabase가 죽어도 배포가 되어야 한다
- git 디프로 콘텐츠 변경이 보여야 한다

### 갱신 경로

앱에서 항목을 등록하면 Vercel **Deploy Hook**을 호출해 재빌드한다.
반영까지 1~2분 걸린다. 포트폴리오에 실시간은 필요 없다.

Deploy Hook 호출은 **앱의 책임**이므로 이 문서의 범위 밖이다(스펙 3).
이 문서에서는 훅 URL을 만들어 두고 수동 호출로 검증한다.

---

## 7. 구현 순서와 검증

두 단계로 나눈다. **배관과 화면을 동시에 뜯으면 무엇이 깨졌는지 판별할 수 없다.**

### 단계 A — 배관 (화면 변경 없음)

1. 마이그레이션: `visibility` `sort_order` 추가, 신규 4테이블, RLS 정책
2. 공개 뷰 6개 + 권한 설정
3. 시드: 기존 `src/works/*.md` 5건 → `songs` 2 + `apps` 3
4. `scripts/fetch-content.ts` 작성, `build`에 연결
5. `src/lib/works.ts`를 md glob 대신 JSON을 읽도록 교체
6. 누출 회귀 테스트 추가
7. `src/works/*.md` 제거 (시드 스크립트에 내용 보존)

**통과 기준:** 사이트가 **지금과 완전히 동일하게 동작한다.** 건반 5개, 소리,
상세 페이지 5개, 기존 Vitest 전부 통과. 화면상 달라진 것이 하나도 없어야 한다.

A가 초록불이 아니면 B로 넘어가지 않는다.

### 단계 B — 화면

1. 라우트 추가: `/music` `/apps` `/music/{credits,live,lp,gear}`
2. 홈 개편: 건반을 `featured`로 한정, 아래 두 관 입구
3. 음악관 5섹션 (섹션마다 고유 형식)
4. 앱관 카드 격자
5. LP 전체 페이지 — 검색·필터
6. 메타 태그 · sitemap 갱신

**통과 기준:** 각 라우트 렌더, LP 25건 표시, `visibility='private'` 항목이
어느 화면에도 나타나지 않음, 누출 테스트 통과.

---

## 8. 범위 밖

| 항목 | 어디로 |
|---|---|
| 입력 앱 (KJ Studio 앱 = 본인 전용 CMS) | 스펙 3 |
| Discogs 신규 연동 개발 | 이미 있다. 스펙 3에서 앱에 연결 |
| 앱의 공개 전환 | 스펙 4 |
| `studiorack_*` 테이블 개명 | 앱 교체 시 |
| iOS RackVault 앱 수정 | 하지 않는다. 새 앱이 설 때까지 그대로 둔다 |
| 한일교회 관련 일체 | 별개 제품. 어떤 이유로도 건드리지 않는다 |
| 다국어 | 여전히 지금 풀 문제가 아니다 |

---

## 9. 미해결

구현 중에 정한다.

- **음악관 각 섹션의 시각 밀도** — 설계값(3·4·7·3)은 실제 데이터를 넣어보고 조정한다
- **LP 전체 페이지의 필터 축** — 장르·연대·레이블 중 무엇을 쓸지는 25건으로는 판단이 안 된다.
  항목이 100을 넘은 뒤에 정한다
- **`featured` 7개를 실제로 무엇으로 채울지** — 콘텐츠 판단이지 설계 판단이 아니다
- **공연·크레딧의 실제 데이터 유무** — 아직 한 건도 없다. 빈 섹션의 처리
  (숨김 / 자리표시)는 데이터를 넣어보고 정한다
