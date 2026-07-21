import { useEffect } from "react";
import { Link, useParams } from "react-router";
import { getWorks } from "../lib/works";
import { applyMeta } from "../lib/meta";
import styles from "./Work.module.css";

export function Work() {
  const { slug } = useParams();
  const works = getWorks();
  const index = works.findIndex((w) => w.slug === slug);
  const work = index >= 0 ? works[index] : undefined;

  useEffect(() => {
    if (!work) return;
    applyMeta({
      title: `${work.title} — the KJ Studio`,
      description: work.body.split("\n\n")[0] ?? "",
      image: work.cover,
    });
  }, [work]);

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

      {work.listen.length > 0 && (
        <div className={styles.listen}>
          {work.listen.map((link) => (
            <a
              key={link.url}
              className={styles.listenLink}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label} ↗
            </a>
          ))}
        </div>
      )}

      {work.cover && (
        <img
          className={styles.cover}
          src={work.cover}
          alt={`${work.title} 커버`}
        />
      )}

      <div className={styles.body}>{work.body}</div>

      {work.screens.length > 0 && (
        <section className={styles.screens} aria-label={`${work.title} 화면`}>
          <p className={styles.screensLabel}>Screens — 화면</p>
          <div className={styles.screenGrid}>
            {work.screens.map((screen) => (
              <figure key={screen.src}>
                <img
                  src={screen.src}
                  alt={screen.caption || `${work.title} 화면`}
                  loading="lazy"
                />
                {screen.caption && <figcaption>{screen.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
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
