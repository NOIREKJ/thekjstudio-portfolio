import { Link } from "react-router";
import type { Work } from "../lib/works";
import styles from "./WorkCard.module.css";

// 작업물 한 장 — 커버·제목·연도·종류. 클릭 시 상세로.
export function WorkCard({ work }: { work: Work }) {
  const kindLabel = work.kind === "music" ? "음악" : "앱";
  return (
    <Link to={`/work/${work.slug}`} className={styles.card}>
      <div className={styles.cover}>
        {work.cover ? (
          <img src={work.cover} alt="" loading="lazy" />
        ) : (
          <span className={styles.placeholder} aria-hidden="true">{work.title.slice(0, 1)}</span>
        )}
      </div>
      <h3 className={styles.title}>{work.title}</h3>
      <p className={styles.meta}>{work.year} · {kindLabel}</p>
    </Link>
  );
}
