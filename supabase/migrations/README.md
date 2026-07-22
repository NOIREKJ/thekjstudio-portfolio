# Supabase 마이그레이션

## 버전 관리 규칙

이 파일들은 Supabase MCP 도구를 통해 원격 데이터베이스에 적용되며, 저장소에는 변경 기록 목적으로 보관됩니다.

마이그레이션을 원격에 적용하면 Supabase는 `supabase_migrations.schema_migrations` 테이블에 자체 타임스탐프로 버전을 기록합니다. **적용 후 반드시 그 원격 버전에 맞춰 로컬 파일명을 수정해야 합니다.** 이렇게 하지 않으면 나중에 Supabase CLI를 연결했을 때 이 마이그레이션을 미적용 상태로 판단하고 재실행을 시도하여 "relation already exists" 같은 오류로 실패합니다.

### 워크플로우

1. 마이그레이션을 작성하고 MCP 도구로 원격에 적용
2. `select version, name from supabase_migrations.schema_migrations where name = '<migration_name>'` 으로 원격의 실제 버전 확인
3. 로컬 파일명을 `<version>_<migration_name>.sql` 형태로 수정
4. 변경사항을 커밋

이 절차를 따르면 로컬과 원격의 마이그레이션 버전이 일치하여 나중에 CLI 기반 작업이나 팀 협업 시 충돌이 없습니다.

## 뷰 생성 시 권한 규칙

`public` 스키마에 뷰를 새로 만들 때는 **`revoke all ... from anon, authenticated` 를 먼저 실행한 다음
`grant select` 를 해야 합니다.** 순서를 바꾸면 안 됩니다.

이유: Supabase 는 `pg_default_acl` 로 `public` 스키마의 신규 객체(테이블·뷰 불문)에
`anon`/`authenticated` 에게 기본적으로 `arwdDxtm`(전 권한: INSERT/SELECT/UPDATE/DELETE 등)을
자동 부여합니다. `grant select` 만 얹으면 이미 있던 쓰기 권한은 그대로 남습니다. 뷰가
단일 테이블 + `where` 절 형태라 Postgres 가 자동 갱신 가능 뷰로 판단하고, 뷰가
`security_invoker = false` 로 소유자 권한 실행이면 그 쓰기가 RLS 를 완전히 우회해
원본 테이블에 그대로 반영됩니다 — 읽기 전용으로 노출하려던 뷰가 실제로는 누구나 쓸 수 있는
구멍이 됩니다.
