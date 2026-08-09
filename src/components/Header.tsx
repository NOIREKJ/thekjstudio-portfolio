import { Link, useLocation } from "react-router";
import styles from "./Header.module.css";

export function Header() {
  const { pathname } = useLocation();

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.mark}>
        the KJ Studio
      </Link>
      <nav className={styles.nav} aria-label="Main">
        <Link to="/work" aria-current={pathname === "/work" ? "page" : undefined}>
          Work
        </Link>
        <Link to="/studio" aria-current={pathname === "/studio" ? "page" : undefined}>
          Studio
        </Link>
        <Link to="/collection" aria-current={pathname === "/collection" ? "page" : undefined}>
          Collection
        </Link>
        <Link to="/about" aria-current={pathname === "/about" ? "page" : undefined}>
          About
        </Link>
        <a href="mailto:contact@thekjstudio.com">Contact</a>
      </nav>
    </header>
  );
}
