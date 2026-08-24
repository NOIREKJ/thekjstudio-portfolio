import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { TABLES } from "./config";
import { TableEditor } from "./TableEditor";
import styles from "./Admin.module.css";

export function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!supabase) {
    return (
      <main className={styles.page}>
        <p className={styles.notice}>
          Supabase 환경변수(VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY)가 없습니다.
        </p>
      </main>
    );
  }

  if (!ready) return <main className={styles.page}><p className={styles.notice}>불러오는 중…</p></main>;
  if (!session) return <Login />;
  return <Dashboard email={session.user.email ?? ""} userId={session.user.id} />;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !email || !password) return;
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    // 성공 시 onAuthStateChange 가 세션을 갱신해 대시보드로 넘어간다.
    if (error) setErr(error.message);
  };

  return (
    <main className={styles.page}>
      <div className={styles.loginCard}>
        <p className={styles.brand}>the KJ Studio</p>
        <h1 className={styles.loginTitle}>Admin</h1>
        <form onSubmit={submit} className={styles.loginForm}>
          <input
            className={styles.input}
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            autoComplete="username"
            required
          />
          <input
            className={styles.input}
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            autoComplete="current-password"
            required
          />
          <button className={styles.btnPrimary} type="submit" disabled={busy}>
            {busy ? "로그인 중…" : "로그인"}
          </button>
          {err && <p className={styles.error}>{err}</p>}
        </form>
      </div>
    </main>
  );
}

function Dashboard({ email, userId }: { email: string; userId: string }) {
  const [tableKey, setTableKey] = useState(TABLES[0].key);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const table = TABLES.find((t) => t.key === tableKey)!;

  useEffect(() => {
    if (!supabase) return;
    supabase.rpc("my_household_ids").then(({ data }) => {
      const ids = (data as string[] | null) ?? [];
      setHouseholdId(ids[0] ?? null);
    });
  }, []);

  const changePassword = async () => {
    if (!supabase) return;
    const next = window.prompt("새 비밀번호 (최소 6자):");
    if (!next) return;
    const { error } = await supabase.auth.updateUser({ password: next });
    window.alert(error ? `실패: ${error.message}` : "비밀번호를 변경했습니다.");
  };

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <div>
          <p className={styles.brand}>the KJ Studio — Admin</p>
          <p className={styles.who}>{email}</p>
        </div>
        <div className={styles.topActions}>
          <button className={styles.btnGhost} onClick={changePassword}>비밀번호 변경</button>
          <button className={styles.btnGhost} onClick={() => supabase?.auth.signOut()}>로그아웃</button>
        </div>
      </header>

      <nav className={styles.tabs}>
        {TABLES.map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${t.key === tableKey ? styles.tabActive : ""}`}
            onClick={() => setTableKey(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <TableEditor table={table} userId={userId} householdId={householdId} />
    </main>
  );
}
