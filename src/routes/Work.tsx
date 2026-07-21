import { Link, useParams } from "react-router";
import { getWorks } from "../lib/works";
import styles from "./Work.module.css";

export function Work() {
  const { slug } = useParams();
  const works = getWorks();
  const index = works.findIndex((w) => w.slug === slug);
  const work = index >= 0 ? works[index] : undefined;

  if (!work) {
    return (
      <main className={styles.page}>
        <p>찾을 수 없는 작업입니다.</p>
        <Link className={styles.back} to="/">← 처음으로</Link>
      </main>
    );
  }

  const prev = works[index - 1];
  const next = works[index + 1];

  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/">← 처음으로</Link>

      <p className={styles.overline}>
        Op. {String(index + 1).padStart(2, "0")} — {work.kind}
      </p>
      <h1 className={styles.title}>{work.title}</h1>
      <p className={styles.meta}>
        ♪ {work.note} · {work.year}
      </p>

      <div className={styles.body}>{work.body}</div>

      {work.images.length > 0 && (
        <div className={styles.gallery} aria-label={`${work.title} 화면`}>
          {work.images.map((src) => (
            <img key={src} src={src} alt={`${work.title} 화면`} loading="lazy" />
          ))}
        </div>
      )}

      <nav className={styles.pager} aria-label="다른 작업">
        {prev ? (
          <Link to={`/work/${prev.slug}`} className={styles.pagerLink}>
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={`/work/${next.slug}`} className={styles.pagerLink}>
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
