import { Link } from "react-router";
import { getLps } from "../lib/lp";
import styles from "./LpMarquee.module.css";

// LP 커버가 흐르는 가로 마퀴 — 컬렉션의 '움직이는' 티저.
// to=null 이면 링크 없이 배경 장식으로(컬렉션 히어로 배경 등).
export function LpMarquee({ to = "/collection" as string | null }: { to?: string | null }) {
  const covers = getLps().filter((lp) => lp.cover).slice(0, 14);
  if (covers.length === 0) return null;
  const loop = [...covers, ...covers];

  const track = (
    <div className={styles.track}>
      {loop.map((lp, i) => (
        <span key={`${lp.id}-${i}`} className={styles.item} aria-hidden={i >= covers.length}>
          <img src={lp.cover as string} alt={i < covers.length ? `${lp.artist} — ${lp.title}` : ""} loading="lazy" />
        </span>
      ))}
    </div>
  );

  if (to == null) {
    return <div className={styles.wrap} aria-hidden="true">{track}</div>;
  }
  return (
    <Link to={to} className={styles.wrap} aria-label={`View the collection · ${getLps().length} records`}>
      {track}
    </Link>
  );
}
