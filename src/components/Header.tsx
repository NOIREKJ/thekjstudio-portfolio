import { Link, useLocation } from "react-router";
import styles from "./Header.module.css";

export function Header() {
  const { pathname } = useLocation();

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.mark}>
        the KJ Studio
      </Link>
      <nav className={styles.nav} aria-label="주 메뉴">
        <Link to="/work" aria-current={pathname === "/work" ? "page" : undefined}>
          작업
        </Link>
        <Link to="/studio" aria-current={pathname === "/studio" ? "page" : undefined}>
          스튜디오
        </Link>
        <Link to="/collection" aria-current={pathname === "/collection" ? "page" : undefined}>
          컬렉션
        </Link>
        <Link to="/about" aria-current={pathname === "/about" ? "page" : undefined}>
          소개
        </Link>
        <a href="mailto:contact@thekjstudio.com">연락</a>
      </nav>
    </header>
  );
}
