import { useEffect } from "react";
import { applyMeta } from "../lib/meta";
import { useT } from "../i18n";
import { Reveal } from "../components/Reveal";
import { SoundCloudPlayer } from "../components/SoundCloudPlayer";
import { getCredits } from "../lib/credits";
import { getPerformances } from "../lib/performances";
import styles from "./About.module.css";

export function About() {
  const t = useT();
  const credits = getCredits();
  const performances = getPerformances();

  useEffect(() => {
    applyMeta({
      title: "About — the KJ Studio",
      description:
        "Based in Seoul, I write music and build apps. Music released as K_Joon_P.",
      image: "/images/kimjoonmain.jpeg",
    });
  }, []);

  return (
    <main className={styles.page}>
      {/* 홈처럼 — 라이브 포트레이트를 전면 히어로로 */}
      <header className={styles.hero}>
        <div className={styles.heroBg}>
          <img src="/images/gallery/horizontal-1-kj-blueshirt.jpeg" alt="Joon Kim performing" />
          <div className={styles.heroScrim} />
        </div>
        <div className={styles.heroInner}>
          <p className={styles.overline}>{t.about.overline}</p>
          <h1 className={styles.title}>Joon Kim</h1>
          <p className={styles.meta}>the KJ Studio · Seoul</p>
        </div>
      </header>

      <div className={styles.body}>
        <Reveal>
          <div className={styles.bio}>{t.about.body}</div>

          <dl className={styles.facts}>
            <div className={styles.fact}>
              <dt>{t.about.base}</dt>
              <dd>Seoul, KR</dd>
            </div>
            <div className={styles.fact}>
              <dt>{t.about.alias}</dt>
              <dd>K_Joon_P</dd>
            </div>
            <div className={styles.fact}>
              <dt>{t.about.mail}</dt>
              <dd><a href="mailto:contact@thekjstudio.com">contact@thekjstudio.com</a></dd>
            </div>
          </dl>
        </Reveal>

        {/* 들어보기 — 사이트 안에서 바로 재생 */}
        <Reveal>
          <section className={styles.section} aria-labelledby="listen-h">
            <h2 id="listen-h" className={styles.sectionTitle}>{t.about.listen}</h2>
            <SoundCloudPlayer title="K_Joon_P — SoundCloud" />
          </section>
        </Reveal>

        {/* 참여 크레딧 */}
        {credits.length > 0 && (
          <Reveal>
            <section className={styles.section} aria-labelledby="credits-h">
              <h2 id="credits-h" className={styles.sectionTitle}>{t.about.credits}</h2>
              <ul className={styles.credits}>
                {credits.map((c) => {
                  const inner = (
                    <>
                      <span className={styles.creditWork}>{c.workTitle}</span>
                      <span className={styles.creditArtist}>{c.artist}</span>
                      <span className={styles.creditRoles}>{c.roles.join(" · ")}</span>
                      {c.year && <span className={styles.creditYear}>{c.year}</span>}
                    </>
                  );
                  return (
                    <li key={c.id} className={styles.credit}>
                      {c.url ? (
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className={styles.creditLink}>
                          {inner}<span className={styles.creditArrow}>↗</span>
                        </a>
                      ) : (
                        <span className={styles.creditLink}>{inner}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          </Reveal>
        )}

        {/* 공연 이력 */}
        {performances.length > 0 && (
          <Reveal>
            <section className={styles.section} aria-labelledby="live-h">
              <h2 id="live-h" className={styles.sectionTitle}>{t.about.live}</h2>
              <ul className={styles.live}>
                {performances.map((p) => (
                  <li key={p.id} className={styles.show}>
                    {p.poster && (
                      <div className={styles.poster}>
                        <img src={p.poster} alt={p.title} loading="lazy" />
                      </div>
                    )}
                    <div className={styles.showBody}>
                      <p className={styles.showTitle}>{p.title}</p>
                      {p.venue && <p className={styles.showVenue}>{p.venue}</p>}
                      <p className={styles.showMeta}>
                        {p.date}{p.role && <> · {p.role}</>}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        )}
      </div>
    </main>
  );
}
