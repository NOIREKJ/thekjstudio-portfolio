import { Link } from "react-router";
import type { Work } from "../lib/works";
import { Vinyl } from "./Vinyl";
import styles from "./WorkPanel.module.css";

export function WorkPanel({
  work,
  spinning = true,
}: {
  work: Work;
  spinning?: boolean;
}) {
  const preview = work.body.split("\n\n")[0] ?? "";

  return (
    <section className={styles.panel} aria-live="polite">
      <div className={styles.row}>
        <Vinyl size={68} spinning={spinning} duration="4.5s" />
        <div>
          <p className={styles.nowPlaying}>
            Now Playing — ♪ {work.note}
          </p>
          <h2 className={styles.title}>{work.title}</h2>
        </div>
      </div>
      <p className={styles.body}>{preview}</p>
      <Link className={styles.link} to={`/work/${work.slug}`}>
        자세히 보기 →
      </Link>
    </section>
  );
}
