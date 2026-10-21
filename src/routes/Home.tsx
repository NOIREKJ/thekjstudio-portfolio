import { useEffect, useMemo } from "react";
import { Link } from "react-router";
import { applyMeta } from "../lib/meta";
import { useT } from "../i18n";
import { Hero } from "../components/Hero";
import { PillarIndex } from "../components/PillarIndex";
import { LpMarquee } from "../components/LpMarquee";
import { WorkGrid } from "../components/WorkGrid";
import { Reveal } from "../components/Reveal";
import { getFeaturedWorks } from "../lib/works";
import styles from "./Home.module.css";

export function Home() {
  const t = useT();
  const featured = useMemo(() => getFeaturedWorks(), []);

  useEffect(() => {
    applyMeta({
      title: "the KJ Studio — I write music, and build apps",
      description:
        "Work, studio gear, and vinyl collection of Joon Kim — composer and developer. Sound and software by the same hands.",
      image: "/images/logo/kjstudio-studio.jpg",
    });
  }, []);

  return (
    <main className={styles.page}>
      <Hero />

      <div className={styles.inner}>
        <Reveal>
          <section className={styles.pillars} aria-label={t.pillars.browse}>
            <PillarIndex />
          </section>
        </Reveal>

        {featured.length > 0 && (
          <Reveal>
            <section className={styles.featured} aria-labelledby="featured-h">
              <div className={styles.featuredHead}>
                <div>
                  <p id="featured-h" className={`${styles.sectionLabel} ${styles.featuredTag}`}>
                    {t.home.featuredTag}
                  </p>
                  <p className={styles.featuredLine}>{t.home.featuredLine}</p>
                </div>
                <Link to="/work" className={styles.featuredCta}>{t.home.featuredCta}</Link>
              </div>
              <WorkGrid works={featured} className={styles.featuredGrid} />
            </section>
          </Reveal>
        )}

        <Reveal>
          <section className={styles.about}>
            <figure className={styles.aboutFig}>
              <img src="/images/gallery/vertical-4-kj-piano.jpeg" alt="At the piano" loading="lazy" />
            </figure>
            <div className={styles.aboutText}>
              <p className={styles.aboutTag}>{t.home.aboutTag}</p>
              <p className={styles.aboutLine}>{t.home.aboutLine}</p>
              <Link to="/about" className={styles.aboutCta}>{t.home.aboutCta}</Link>
            </div>
          </section>
        </Reveal>
      </div>

      <section className={styles.marquee} aria-label={t.collection.preview}>
        <LpMarquee />
      </section>

      <div className={styles.inner}>
        <Reveal>
          <section className={styles.contact} aria-labelledby="contact-h">
            <p id="contact-h" className={styles.sectionLabel}>{t.nav.contact}</p>
            <Link className={styles.mail} to="/contact">
              {t.contact.title} →
            </Link>
          </section>
        </Reveal>
      </div>
    </main>
  );
}
