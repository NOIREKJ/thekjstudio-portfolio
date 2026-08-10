import { useEffect } from "react";
import { Link } from "react-router";
import { applyMeta } from "../lib/meta";
import { useT } from "../i18n";
import { Hero } from "../components/Hero";
import { PillarIndex } from "../components/PillarIndex";
import { LpMarquee } from "../components/LpMarquee";
import { Reveal } from "../components/Reveal";
import styles from "./Home.module.css";

export function Home() {
  const t = useT();

  useEffect(() => {
    applyMeta({
      title: "the KJ Studio — I write music, and build apps",
      description:
        "Work, studio gear, and vinyl collection of Joon Kim — composer and developer. Sound and software by the same hands.",
      image: "/images/logo/kjstudio-studio.png",
    });
  }, []);

  return (
    <main className={styles.page}>
      <Hero />

      <Reveal>
        <section className={styles.pillars} aria-label={t.pillars.browse}>
          <PillarIndex />
        </section>
      </Reveal>

      <Reveal>
        <section className={styles.about}>
          <figure className={styles.aboutFig}>
            <img src="/images/gallery/vertical-1-kj-piano.jpeg" alt="At the piano" loading="lazy" />
          </figure>
          <div className={styles.aboutText}>
            <p className={styles.aboutTag}>{t.home.aboutTag}</p>
            <p className={styles.aboutLine}>{t.home.aboutLine}</p>
            <Link to="/about" className={styles.aboutCta}>{t.home.aboutCta}</Link>
          </div>
        </section>
      </Reveal>

      <section className={styles.marquee} aria-label={t.collection.preview}>
        <LpMarquee />
      </section>

      <Reveal>
        <section className={styles.contact} aria-labelledby="contact-h">
          <p id="contact-h" className={styles.sectionLabel}>{t.nav.contact}</p>
          <a className={styles.mail} href="mailto:contact@thekjstudio.com">
            contact@thekjstudio.com
          </a>
        </section>
      </Reveal>
    </main>
  );
}
