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
