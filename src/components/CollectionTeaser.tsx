import { Link } from "react-router";
import { getLps } from "../lib/lp";
import styles from "./Teaser.module.css";

// 홈의 컬렉션 티저 — LP 커버 가로 스트립 + 총수.
export function CollectionTeaser() {
  const lps = getLps();
  const strip = lps.slice(0, 7);
  return (
    <Link to="/collection" className={styles.teaser}>
      <p className={styles.label}>Collection</p>
      <h2 className={styles.head}>LP {lps.length}장</h2>
      <div className={styles.covers}>
        {strip.map((lp) => (
          <div key={lp.id} className={styles.cover}>
            {lp.cover ? (
              <img src={lp.cover} alt="" loading="lazy" />
            ) : (
              <span className={styles.coverFallback} aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
      <span className={styles.more}>컬렉션 보기 →</span>
    </Link>
  );
}
