import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { useLang, useT } from "../i18n";
import styles from "./Header.module.css";

export function Header() {
  const { pathname } = useLocation();
  const { lang, setLang } = useLang();
  const t = useT();
  const [open, setOpen] = useState(false);

  // 라우트가 바뀌면 모바일 메뉴 닫기
  useEffect(() => { setOpen(false); }, [pathname]);

  const items = [
    { to: "/work", label: t.nav.work },
    { to: "/studio", label: t.nav.studio },
    { to: "/collection", label: t.nav.collection },
    { to: "/about", label: t.nav.about },
  ];

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.mark}>the KJ Studio</Link>

      <div className={styles.right}>
        <nav className={`${styles.nav} ${open ? styles.navOpen : ""}`} aria-label={t.pillars.browse}>
          {items.map((it) => (
            <Link key={it.to} to={it.to} aria-current={pathname === it.to ? "page" : undefined}>
              {it.label}
            </Link>
          ))}
          <a href="mailto:contact@thekjstudio.com">{t.nav.contact}</a>
        </nav>

        <button
          type="button"
          className={styles.lang}
          onClick={() => setLang(lang === "ko" ? "en" : "ko")}
          aria-label={lang === "ko" ? "Switch to English" : "한국어로 전환"}
        >
          <span className={lang === "ko" ? styles.on : undefined}>KO</span>
          <span className={styles.slash}>/</span>
          <span className={lang === "en" ? styles.on : undefined}>EN</span>
        </button>

        <button
          type="button"
          className={`${styles.burger} ${open ? styles.burgerOpen : ""}`}
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
}
