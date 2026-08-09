import type { Lp } from "../lib/lp";
import styles from "./LpCard.module.css";

// 커버 한 장 — 클릭하면 상세가 열린다.
export function LpCard({ lp, onOpen }: { lp: Lp; onOpen: (lp: Lp) => void }) {
  return (
    <button type="button" className={styles.card} onClick={() => onOpen(lp)}>
      <span className={styles.cover}>
        {lp.cover ? (
          <img src={lp.cover} alt={`${lp.artist} — ${lp.title}`} loading="lazy" />
        ) : (
          <span className={styles.fallback} aria-hidden="true">{lp.artist.slice(0, 1)}</span>
        )}
      </span>
      <span className={styles.artist}>{lp.artist}</span>
      <span className={styles.title}>{lp.title}</span>
    </button>
  );
}
