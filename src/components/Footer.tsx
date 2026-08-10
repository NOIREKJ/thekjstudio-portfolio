import { useT } from "../i18n";
import styles from "./Footer.module.css";

const LINKS = [
  { name: "GitHub", href: "https://github.com/NOIREKJ" },
  { name: "YouTube", href: "https://www.youtube.com/@K_Joon_P" },
  { name: "Spotify", href: "https://open.spotify.com/user/31waehtdbctb5mqpag7pmrmnmhte" },
  { name: "Apple Music", href: "https://music.apple.com/profile/K_Joon_P" },
  { name: "SoundCloud", href: "https://on.soundcloud.com/5UnKPuPovp5dgfz96" },
];

export function Footer() {
  const t = useT();
  return (
    <footer className={styles.footer}>
      {/* 은은한 로고 배경 — 어둡게 깔려 브랜드가 잔잔히 비친다 */}
      <div className={styles.brand} aria-hidden="true" />
      <div className={styles.inner}>
        <ul className={styles.links}>
          {LINKS.map((link) => (
            <li key={link.name}>
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                {link.name} ↗
              </a>
            </li>
          ))}
          <li>
            <a href="mailto:contact@thekjstudio.com">Email ↗</a>
          </li>
        </ul>
        <p className={styles.note}>{t.footer.note}</p>
      </div>
    </footer>
  );
}
