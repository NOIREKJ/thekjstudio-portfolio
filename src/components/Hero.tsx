import styles from "./Hero.module.css";

// 홈 상단 정체성 블록 — 텍스트 + 포트레이트.
export function Hero() {
  return (
    <header className={styles.hero}>
      <div className={styles.text}>
        <p className={styles.eyebrow}>the KJ Studio</p>
        <h1 className={styles.headline}>
          I write music,<br />and build apps<span className={styles.dot}>.</span>
        </h1>
        <p className={styles.sub}>
          Composer and developer — sound and software, made by the same hands.
        </p>
      </div>
      <figure className={styles.portrait}>
        <img src="/images/kimjoonmain.jpeg" alt="Joon Kim" />
      </figure>
    </header>
  );
}
