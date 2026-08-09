import { Link } from "react-router";
import { getLps } from "../lib/lp";
import styles from "./LpMarquee.module.css";

// LP 커버가 흐르는 가로 마퀴 — 김준님 컬렉션의 '움직이는' 티저.
// 커버 목록을 두 번 이어 붙여 이음매 없이 무한 순환. reduced-motion 이면 멈춘다.
export function LpMarquee() {
  const covers = getLps().filter((lp) => lp.cover).slice(0, 14);
  if (covers.length === 0) return null;
  const loop = [...covers, ...covers];
  return (
    <Link to="/collection" className={styles.wrap} aria-label={`View the collection · ${getLps().length} records`}>
      <div className={styles.track}>
        {loop.map((lp, i) => (
          <span key={`${lp.id}-${i}`} className={styles.item} aria-hidden={i >= covers.length}>
            <img src={lp.cover as string} alt={i < covers.length ? `${lp.artist} — ${lp.title}` : ""} loading="lazy" />
          </span>
        ))}
      </div>
    </Link>
  );
}
