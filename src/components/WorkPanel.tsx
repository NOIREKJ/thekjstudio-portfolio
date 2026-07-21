import { Link } from "react-router";
import type { Work } from "../lib/works";
import styles from "./WorkPanel.module.css";

export function WorkPanel({ work }: { work: Work }) {
  const preview = work.body.split("\n\n")[0] ?? "";

  return (
    <section className={styles.panel} aria-live="polite">
      <h2 className={styles.title}>{work.title}</h2>
      <p className={styles.body}>{preview}</p>
      <Link className={styles.link} to={`/work/${work.slug}`}>
        자세히 보기 →
      </Link>
    </section>
  );
}
