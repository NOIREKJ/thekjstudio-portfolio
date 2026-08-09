import { Link } from "react-router";
import { getGear } from "../lib/gear";
import styles from "./Teaser.module.css";

// 홈의 스튜디오 티저 — 장비 수 + 대표 이름 몇 개. 재산정보 없음.
export function StudioTeaser() {
  const gear = getGear();
  const names = gear.slice(0, 6).map((g) => g.name);
  return (
    <Link to="/studio" className={styles.teaser}>
      <p className={styles.label}>Studio</p>
      <h2 className={styles.head}>장비 {gear.length}점</h2>
      <p className={styles.body}>{names.join(" · ")}</p>
      <span className={styles.more}>스튜디오 보기 →</span>
    </Link>
  );
}
