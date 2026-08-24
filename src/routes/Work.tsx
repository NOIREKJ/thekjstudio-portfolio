import { useEffect } from "react";
import { Link, useParams } from "react-router";
import { getWorks } from "../lib/works";
import { applyMeta } from "../lib/meta";
import { useLang, useT } from "../i18n";
import { SoundCloudPlayer } from "../components/SoundCloudPlayer";
import styles from "./Work.module.css";

export function Work() {
  const { slug } = useParams();
  const { lang } = useLang();
  const t = useT();
  const works = getWorks();
  const index = works.findIndex((w) => w.slug === slug);
  const work = index >= 0 ? works[index] : undefined;

  // 곡·앱 설명은 한국어가 원본이고 영어 번역이 있으면 언어에 맞춰 고른다.
  const body = work ? (lang === "en" && work.bodyEn ? work.bodyEn : work.body) : "";

  useEffect(() => {
    if (!work) return;
    applyMeta({
      title: `${work.title} — the KJ Studio`,
      description: body.split("\n\n")[0] ?? "",
      image: work.cover,
    });
  }, [work, body]);

  if (!work) {
    return (
      <main className={styles.page}>
        <p>{t.workdetail.notFound}</p>
        <Link className={styles.back} to="/">{t.workdetail.back}</Link>
      </main>
    );
  }

  const prev = works[index - 1];
  const next = works[index + 1];

  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/">{t.workdetail.back}</Link>

      <p className={styles.overline}>
        Op. {String(index + 1).padStart(2, "0")} — {work.kind}
      </p>
      <h1 className={styles.title}>{work.title}</h1>
      <p className={styles.meta}>{work.year}</p>

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
          alt={work.title}
        />
      )}

      <div className={styles.body}>{body}</div>

      {work.kind === "music" && (
        <section className={styles.player} aria-label={`${work.title} ${t.workdetail.play}`}>
          <p className={styles.screensLabel}>{t.workdetail.play}</p>
          <SoundCloudPlayer title={`${work.title} — SoundCloud`} />
        </section>
      )}

      {work.screens.length > 0 && (
        <section className={styles.screens} aria-label={`${work.title} ${t.workdetail.screens}`}>
          <p className={styles.screensLabel}>{t.workdetail.screens}</p>
          <div className={styles.screenGrid}>
            {work.screens.map((screen) => (
              <figure key={screen.src} className={styles.phoneFig}>
                <div className={styles.phone}>
                  <img
                    src={screen.src}
                    alt={screen.caption || work.title}
                    loading="lazy"
                  />
                </div>
                {screen.caption && <figcaption>{screen.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}

      <nav className={styles.pager} aria-label={t.workdetail.more}>
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
