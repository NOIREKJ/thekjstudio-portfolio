import { Link, useLocation } from "react-router";
import { useLang, useT } from "../i18n";
import styles from "./Header.module.css";

export function Header() {
  const { pathname } = useLocation();
  const { lang, setLang } = useLang();
  const t = useT();

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.mark}>
        the KJ Studio
      </Link>
      <nav className={styles.nav} aria-label={t.pillars.browse}>
        <Link to="/work" aria-current={pathname === "/work" ? "page" : undefined}>{t.nav.work}</Link>
        <Link to="/studio" aria-current={pathname === "/studio" ? "page" : undefined}>{t.nav.studio}</Link>
        <Link to="/collection" aria-current={pathname === "/collection" ? "page" : undefined}>{t.nav.collection}</Link>
        <Link to="/about" aria-current={pathname === "/about" ? "page" : undefined}>{t.nav.about}</Link>
        <a href="mailto:contact@thekjstudio.com">{t.nav.contact}</a>
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
      </nav>
    </header>
  );
}
