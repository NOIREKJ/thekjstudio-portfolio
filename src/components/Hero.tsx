import styles from "./Hero.module.css";

// 홈 상단 정체성 블록. 인터랙션 없이 타이포로 승부(에디토리얼).
export function Hero() {
  return (
    <header className={styles.hero}>
      <p className={styles.eyebrow}>the KJ Studio</p>
      <h1 className={styles.headline}>
        음악을 쓰고,<br />앱을 만듭니다<span className={styles.dot}>.</span>
      </h1>
      <p className={styles.sub}>
        작곡가이자 개발자 — 소리와 소프트웨어를 같은 손으로 다루는 테크니컬 아티스트.
      </p>
    </header>
  );
}
