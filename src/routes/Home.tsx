import { useEffect, useMemo } from "react";
import { Link } from "react-router";
import { applyMeta } from "../lib/meta";
import { useT } from "../i18n";
import { Hero } from "../components/Hero";
import { PillarIndex } from "../components/PillarIndex";
import { LpMarquee } from "../components/LpMarquee";
import { CatalogueIndex } from "../components/CatalogueIndex";
import { Reveal } from "../components/Reveal";
import { getWorks } from "../lib/works";
import styles from "./Home.module.css";

export function Home() {
  const t = useT();
  /*
    인덱스는 전부 싣는다. 대표작을 골라 몇 개만 보여주던 것은 카드 격자라
    자리가 비쌌기 때문이다. 줄은 싸다 — 아홉 줄이 카드 넉 장보다 짧고,
    고른다는 행위 자체가 나머지를 덜 중요해 보이게 만든다. 카탈로그는
    전부 실어야 카탈로그다.
  */
  const works = useMemo(() => getWorks(), []);

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

        {works.length > 0 && (
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
              <CatalogueIndex works={works} />
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
