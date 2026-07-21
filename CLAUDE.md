# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Once UI의 **Magic Portfolio v2.3.0** 템플릿을 기반으로 한 개인 포트폴리오 사이트 (the KJ Studio / Joon Kim).
Next.js 16 App Router + React 19 + TypeScript, UI는 전부 `@once-ui-system/core`, 콘텐츠는 MDX.
원격 저장소: `NOIREKJ/thekjstudio-portfolio`. Node.js v18.17+ 필요.

## 명령어

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드 (MDX/이미지 경로 오류는 여기서 잡힘)
npm run start        # 빌드 결과 실행
npm run lint         # next lint (eslint: next/core-web-vitals)
npm run biome-write  # Biome 포맷 전체 적용
```

테스트 프레임워크는 설정돼 있지 않다. 검증은 `npm run build` + 실제 페이지 확인으로 한다.
포맷은 Biome(2 space, double quote, 100자)이며 `.lintstagedrc.js`로 스테이지된 파일에 자동 적용된다.
`npm run export`는 Next 16에서 더 이상 유효하지 않은 레거시 스크립트다.

## 아키텍처

### 콘텐츠 / 설정의 단일 소스

페이지 컴포넌트는 하드코딩된 문구를 거의 갖지 않는다. 대신 두 파일에서 전부 읽어온다:

- `src/resources/content.tsx` — 인물 정보, 소셜 링크, 홈/어바웃/워크/갤러리 각 섹션의 텍스트와 표시 여부. JSX를 값으로 담기 때문에 `.tsx`다.
- `src/resources/once-ui.config.ts` — 라우트 on/off, 비밀번호 보호 라우트, 폰트, 테마 토큰(`style`), 배경 이펙트(`effects`), SEO용 `baseURL`·`schema`·`sameAs`.
- `src/resources/index.ts` — 위 둘의 배럴. 앱 코드는 항상 `@/resources`에서 import한다.

**문구·섹션·테마 변경은 컴포넌트가 아니라 이 파일들에서 한다.**

### MDX 콘텐츠 파이프라인

- 프로젝트: `src/app/work/projects/*.mdx` → `/work/<파일명>`
- 블로그: `src/app/blog/posts/*.mdx` → `/blog/<파일명>`
- `src/utils/utils.ts`의 `getPosts(["src","app","work","projects"])`가 빌드 타임에 `fs`로 디렉터리를 읽고 gray-matter로 frontmatter를 파싱한다. **slug = 확장자 뺀 파일명 그대로(대소문자 구분).**
- frontmatter 필드: `title`, `subtitle`, `publishedAt`, `summary`, `image`, `images[]`, `tag`, `team[]`, `link`. 목록 정렬은 `publishedAt` 내림차순.
- 렌더링은 `src/components/mdx.tsx`(`CustomMDX`)가 담당하며 마크다운 요소를 Once UI 컴포넌트로 매핑한다(h1~h6 → `HeadingLink`, 이미지 → `Media`, 링크 → `SmartLink`). MDX 안에서 Once UI 컴포넌트를 직접 써도 된다.
- 프로젝트 이미지는 `public/images/projects/<프로젝트>/`에 둔다.

### 라우트 게이팅과 비밀번호 보호

`src/components/RouteGuard.tsx`가 layout에서 모든 children을 감싼다.
- `routes`에서 `false`인 경로는 `NotFound` 렌더 (현재 `/blog`가 비활성).
- `protectedRoutes`에 있는 경로는 `/api/check-auth`로 쿠키 확인 → 실패 시 비밀번호 입력 UI → `/api/authenticate`가 `PAGE_ACCESS_PASSWORD`(.env)와 비교하고 httpOnly `authToken` 쿠키(1시간)를 심는다.
- **주의: 클라이언트 사이드 가드다.** 페이지 자체는 정적으로 빌드·전송되므로 실제 기밀 콘텐츠를 숨기는 용도로 쓰면 안 된다.

### 테마

`src/app/layout.tsx`의 인라인 `theme-init` 스크립트가 `style`/`dataStyle` 값을 `<html>`의 `data-*` 속성으로 주입하고, localStorage에서 사용자 선택을 복원한다. 색상·라운드·스케일 변경은 `once-ui.config.ts`의 `style` 객체만 건드리면 되고 CSS를 직접 수정할 필요가 없다.

### SEO

`Meta.generate()`와 `Schema` 컴포넌트(Once UI)가 각 페이지의 메타데이터/JSON-LD를 만든다. `src/app/sitemap.ts`·`robots.ts`가 라우트와 MDX 목록에서 자동 생성되고, `/api/og/generate?title=...`이 OG 이미지를 동적으로 렌더한다(`/api/rss`도 존재). 전부 `baseURL`에 의존한다.

## 코드 컨벤션

`.agents` 파일에 Once UI 작성 규칙 전문이 있다. 컴포넌트를 만들거나 수정하기 전에 읽을 것. 핵심:

- `<div>` 금지. 세로 `<Column>`, 가로 `<Row>`, 균등 배치 `<Grid>`.
- hex 코드 금지. `background`/`onBackground`, `solid`/`onSolid` 토큰 쌍을 쓴다(다크모드 자동 대응).
- 크기는 `fillWidth`/`fillHeight`/`maxWidth`, 간격은 `gap`/`padding*`/`margin*` 토큰.
- 새 컴포넌트는 Once UI 프리미티브로 조립하고, 스타일 오버라이드가 과하거나 상태 셀렉터가 필요할 때만 SCSS 모듈을 만든다. Tailwind 등 새 유틸리티 도입 금지.
- 공용 컴포넌트는 `src/components/index.ts` 배럴에 추가하고 `@/components`에서 import한다. import 경로는 `@/*` alias.

## 현재 상태에서 알아둘 것

- `once-ui.config.ts`의 `baseURL`이 아직 템플릿 기본값 `https://demo.magic-portfolio.com`이다. `schema`(name/email), `sameAs`도 Once UI 기본값 그대로여서 OG·sitemap·구조화 데이터가 전부 데모 도메인을 가리킨다. 배포 전 교체 필요.
- `content.tsx`의 `home.featured.href`가 `/work/noire`인데 실제 파일은 `Noire.mdx`라 slug는 `Noire`다. slug 매칭이 대소문자를 구분하므로 이 링크는 404가 난다.
- `protectedRoutes`에 템플릿 데모 경로(`/work/automate-design-handovers-...`)만 남아 있다.
- `src/app/blog/posts/*.mdx`는 여전히 Once UI 템플릿 문서들이다. `/blog` 라우트가 꺼져 있어 노출되진 않지만 실제 글로 교체하거나 삭제해야 한다.
- `HanilPay.mdx`는 인라인 style을 쓴 raw HTML 그리드를 포함한다. Once UI 규칙과는 어긋나지만 의도적으로 유지 중이니, 수정할 때 임의로 갈아엎지 말 것.
