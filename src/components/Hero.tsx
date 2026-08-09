import styles from "./Hero.module.css";

// 홈 히어로 — 포트레이트를 전면 배경으로 깔고 그 위에 정체성 텍스트(시네마틱).
export function Hero() {
  return (
    <header className={styles.hero}>
      <div className={styles.bg}>
        <img src="/images/kimjoonmain.jpeg" alt="Joon Kim at the keys" />
        <div className={styles.scrim} />
      </div>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>the KJ Studio</p>
        <h1 className={styles.headline}>
          I write music,<br />and build apps<span className={styles.dot}>.</span>
        </h1>
        <p className={styles.sub}>
          Composer and developer — sound and software, made by the same hands.
        </p>
      </div>
    </header>
  );
}
