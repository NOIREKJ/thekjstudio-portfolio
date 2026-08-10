import { useT } from "../i18n";
import styles from "./Hero.module.css";

// 홈 히어로 — the KJ Studio 로고(밝은 버전)가 얹힌 브랜드 씬. 로고 안에 태그라인이
// 있어 화면 텍스트는 없고, 접근성·SEO 용 제목만 시각적으로 숨긴다.
export function Hero() {
  const t = useT();
  return (
    <header className={styles.hero}>
      <div className={styles.bg}>
        <img src="/images/logo/kjstudio-studio.png" alt="the KJ Studio — Music and Develop Studio" />
        <div className={styles.scrim} />
      </div>
      <h1 className={styles.srOnly}>the KJ Studio — {t.hero.l1} {t.hero.l2}</h1>
    </header>
  );
}
