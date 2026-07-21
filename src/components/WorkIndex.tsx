import { Link } from "react-router";
import type { Work } from "../lib/works";
import styles from "./WorkIndex.module.css";

/*
  건반의 두 번째 통로.
  건반은 놀이이고, 이 목록은 색인이다 — 스크린리더·검색엔진·
  그냥 목록이 편한 사람은 여기로 들어온다.
*/
export function WorkIndex({ works }: { works: Work[] }) {
  return (
    <section className={styles.index} aria-label="작업 목록">
      <p className={styles.overline}>Index — 작업</p>
      <ol className={styles.list}>
        {works.map((work, i) => (
          <li key={work.slug}>
            <Link to={`/work/${work.slug}`} className={styles.row}>
              <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.name}>{work.title}</span>
              <span className={styles.tag}>
                {work.kind} · {work.year}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
