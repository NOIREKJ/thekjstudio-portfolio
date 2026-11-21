# 라이브 편곡 아카이브 (`/arrangements`) — 설계

2026-11-22 · 노션 스펙 `🤖 Claude Code 전달용 — 사이트·노션·Patreon 연동 스펙` 구현분

## 무엇을 만드는가

곡별 편곡 작업을 노션에서 관리하고, 사이트는 그 사본을 빌드 시점에 구워 보여준다.

- `/arrangements` — 목록. 상태 배지 + 전체/작업중/완성 필터
- `/arrangements/:slug` — 곡 상세. 편곡 노트·편성/장비·송폼·유튜브·악보/구매 CTA

데이터 흐름은 기존 `songs`/`apps` 와 완전히 같다. **런타임에 DB 를 부르지 않는다.**

```
노션 트래커 ──(sync, 별건)──▶ Supabase arrangements
                                      │
                            public_arrangements (뷰)
                                      │
                   fetch-content.ts ──▶ src/content/arrangements.json (커밋)
                                      │
                              getArrangements() ──▶ 화면
```

## 이미 적용된 것 (이 작업 밖)

- 마이그레이션 `20261121152519_arrangements.sql` — 테이블 + `public_arrangements` 뷰.
  권한 단언 쿼리 0행 확인.
- `20261121152519_arrangements_source.sql` 성격의 후속 컬럼 — `source`(notion/ssd),
  `source_path`, `owner_name`. SSD 스캔으로 들어온 행과 노션 원본 행을 가른다.
- 데이터 73행 적재 (노션 8 + SSD 65). **SSD 65행은 전부 `visibility='private'`** 이라
  공개 뷰에 나오지 않는다. 지금 공개는 4행.

## 결정과 그 이유

### 1. 상태 코드는 DB 에, 화면 문구는 i18n 에

노션의 한국어 옵션(`🚀 완성·배포`)을 DB 에 그대로 넣지 않는다. `done` 으로 정규화하고
ko/en 라벨은 `i18n.tsx` 가 쥔다. 노션에서 옵션 이름을 다듬어도 사이트가 안 깨진다.

`idea · arranging · sheet · recording · done` 다섯 가지. DB `check` 제약이 같은 목록을
들고 있으므로, 모르는 값은 애초에 들어오지 못한다.

### 2. 필터는 `작업중`/`완성` 두 묶음

`작업중` = `idea·arranging·sheet·recording`, `완성` = `done`. 다섯 상태를 다 노출하면
방문자에게는 의미 없는 내부 공정이 보인다. 묶음 정의는 `lib/arrangements.ts` 한 곳에만 둔다.

URL 쿼리(`?filter=wip`)로도 유지해 공유·새로고침에 살아남게 한다.

### 3. CTA 는 `done` 일 때만

악보·구매 버튼은 `status === 'done'` 인 곡에만 단다. 편곡중인 곡에 구매 버튼이 붙으면
받을 수 없는 것을 파는 셈이 된다. `visibility` 는 **보지 않는다** — 뷰가 이미 걸렀고,
공개 범위의 정의는 뷰 하나여야 한다(두 곳에서 판단하면 어긋난다).

결제는 사이트가 처리하지 않는다. Patreon/사운드리더로 넘기는 외부 링크만 둔다.

### 4. 상세 본문은 허용 블록만 렌더

`body_markdown` 은 노션 본문을 직렬화한 것이다. 소제목·문단·불릿·번호·인용만 그리고
HTML 은 이스케이프한다. 지금 들어오는 건 사람이 쓴 텍스트뿐이지만, 렌더 경로를 하나로
좁혀 두면 나중에 노션 본문에 무엇이 들어와도 안전하다.

### 5. 어드민은 읽기 전용

노션이 원본이므로 `/admin` 에서 고친 값은 다음 동기화에 조용히 덮인다. 그게 가장 나쁜
결과라서 `arrangements` 는 목록 + "노션에서 수정" 링크만 노출한다.

### 6. 402(쿼터 초과)를 가용성 문제로 분류 — 정책 변경

`shouldFallback` 은 5xx·429 만 가용성 문제로 보고 나머지 4xx 는 빌드를 깬다. 그 판단은
맞지만 **402 는 그 사이에 있다.** Supabase 무료 플랜이 Realtime 월 한도를 넘기면 프로젝트
전체가 402 로 막히는데(2026-11-18~12-10 실제로 그랬다), 이건 키 오타나 grant 유실 같은
설정 결함이 아니라 서비스가 일시적으로 거부하는 상태다.

402 를 설정 결함으로 두면 **쿼터가 풀리는 날까지 사이트를 한 번도 다시 배포할 수 없다** —
편곡과 무관한 오타 수정조차. 그래서 402 만 폴백 대상에 넣고, 대신 경고를 `⚠ 쿼터` 로
못 박아 조용히 지나가지 않게 한다. 조용한 폴백 금지 원칙은 "신호 없이 넘어가는 것"을
막자는 것이고, 큰 소리로 말하는 폴백은 그 원칙을 거스르지 않는다.

## 손대는 곳

| 파일 | 무엇 |
| --- | --- |
| `src/lib/content-types.ts` | `ArrangementStatus`, `ArrangementContent` |
| `scripts/content/map.ts` | `mapArrangement` |
| `scripts/fetch-content.ts` | `SOURCES` 에 `public_arrangements` 한 줄 |
| `scripts/content/fetch.ts` | `shouldFallback` 에 402 |
| `src/lib/arrangements.ts` | `getArrangements`·`getArrangement`·`filterArrangements` |
| `src/routes/Arrangements.tsx` | 목록 |
| `src/routes/Arrangement.tsx` | 상세 |
| `src/App.tsx` · `Header.tsx` · `i18n.tsx` · `gen-sitemap.ts` | 새 섹션 네 곳 |
| `src/admin/config.ts` · `TableEditor.tsx` | `readOnly` |
| `src/content/arrangements.json` | 시드 (커밋) |

기존 `*.module.css` 토큰과 `global.css` 를 재사용한다. 새 디자인 시스템을 만들지 않는다.

## 완료 기준

- [ ] `npm test` 통과 — 상태 매핑·필터·누출 테스트 포함
- [ ] `npm run build` 통과
- [ ] 비공개 곡이 `arrangements.json`·화면 어디에도 없다
- [ ] `done` 아닌 곡에 악보·구매 CTA 가 없다
- [ ] 없는 slug 는 404 (빈 목록 폴백 금지)
- [ ] ko/en 전환 시 새 문구가 양쪽 다 번역돼 있다

## 동기화 (`scripts/sync-arrangements.ts`)

노션이 원본, Supabase 가 사본. `npm run sync:arrangements`, 15분 cron
(`.github/workflows/sync-arrangements.yml`) + 수동 실행.

### 바뀐 페이지만 처리한다

노션의 `last_edited_time` 이 DB 의 `synced_at` 보다 새 것일 때만 본문 블록과
악보 파일을 받는다. 15분 cron 이라 이게 없으면 **매 15분마다 전 곡의 본문과
악보를 다시 내려받는다** — 노션 rate limit(3req/s)에도, 받는 쪽에도 낭비다.
전부 다시 돌리려면 `--all`.

### 악보 파일 — 노션 URL 을 그대로 저장하면 안 된다

노션 파일 속성이 돌려주는 URL 은 **서명 URL 이라 1시간이면 죽는다.** 그걸 DB 에
넣으면 배포된 악보 버튼이 하루도 못 간다. 그래서 받은 즉시 내려받아 Supabase
Storage 의 공개 버킷(`sheets`)으로 옮기고, 거기서 나온 공개 URL 을 저장한다.
오브젝트 이름은 `<slug>.<확장자>` 라 같은 곡을 다시 올리면 덮어쓴다.

외부 링크(구글 드라이브 등)는 만료가 없으므로 복사하지 않고 그대로 쓴다.

### 필요한 시크릿 (GitHub Actions)

| 이름 | 쓰임 |
| --- | --- |
| `NOTION_TOKEN` | 인테그레이션 시크릿. **Vite 번들(`VITE_*`)에 절대 금지** |
| `NOTION_ARRANGEMENTS_DATABASE_ID` | `41a1d2419cb48091bfe5e60ca360b840` |
| `SUPABASE_URL` | 기존과 같음 |
| `SUPABASE_SERVICE_ROLE_KEY` | **동기화에서만.** 빌드·번들·브라우저 노출 금지 |
| `VERCEL_DEPLOY_HOOK` | 재배포 트리거 (선택) |

저장소가 public 이므로 전부 Actions Secrets 로 둔다. 로컬은 `.env`.

### 지금 돌릴 수 없다

Supabase 조직이 402(무료 플랜 Realtime 한도 초과, ~2026-12-10)라 PostgREST
쓰기와 Storage 업로드가 모두 막혀 있다. 스크립트는 그 상태를 알아보고 무엇
때문에 막혔는지 말하며 멈춘다(아무것도 쓰지 않는다). 쿼터가 풀리거나 플랜을
올리면 그대로 돈다.

## 남은 것 (이 작업 범위 밖)

- Patreon 티어·Shop 세팅 — 사이트 코드는 금액을 모른다. 링크만 쓴다.
- 곡별 유튜브 링크 — 노션에 `유튜브` 속성을 만들어 뒀다. 채우면 상세에 뜬다.
  사이트가 가진 건 채널 링크뿐이라 곡별 영상은 사람이 넣어야 한다.
