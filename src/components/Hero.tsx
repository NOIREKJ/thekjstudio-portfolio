import styles from "./Hero.module.css";

// 홈 상단 정체성 블록. 인터랙션 없이 타이포로 승부(에디토리얼).
export function Hero() {
  return (
    <header className={styles.hero}>
      <p className={styles.eyebrow}>the KJ Studio</p>
      <h1 className={styles.headline}>
        I write music,<br />and build apps<span className={styles.dot}>.</span>
      </h1>
      <p className={styles.sub}>
        Composer and developer — sound and software, made by the same hands.
      </p>
    </header>
  );
}
