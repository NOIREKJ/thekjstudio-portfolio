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
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !email) return;
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setBusy(false);
    if (error) setErr(error.message);
    else setSent(true);
  };

  return (
    <main className={styles.page}>
      <div className={styles.loginCard}>
        <p className={styles.brand}>the KJ Studio</p>
        <h1 className={styles.loginTitle}>Admin</h1>
        {sent ? (
          <p className={styles.notice}>
            {email} 로 로그인 링크를 보냈습니다. 메일함을 확인하세요.
          </p>
        ) : (
          <form onSubmit={send} className={styles.loginForm}>
            <input
              className={styles.input}
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              autoComplete="email"
              required
            />
            <button className={styles.btnPrimary} type="submit" disabled={busy}>
              {busy ? "보내는 중…" : "로그인 링크 받기"}
            </button>
            {err && <p className={styles.error}>{err}</p>}
          </form>
        )}
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

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <div>
          <p className={styles.brand}>the KJ Studio — Admin</p>
          <p className={styles.who}>{email}</p>
        </div>
        <button className={styles.btnGhost} onClick={() => supabase?.auth.signOut()}>로그아웃</button>
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
