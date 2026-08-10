import { useEffect } from "react";
import { applyMeta } from "../lib/meta";
import { useT } from "../i18n";
import { Hero } from "../components/Hero";
import { PillarIndex } from "../components/PillarIndex";
import { LpMarquee } from "../components/LpMarquee";
import styles from "./Home.module.css";

export function Home() {
  const t = useT();
  useEffect(() => {
    applyMeta({
      title: "the KJ Studio — I write music, and build apps",
      description:
        "Work, studio gear, and vinyl collection of Joon Kim — composer and developer. Sound and software by the same hands.",
      image: "/images/projects/noire/horizontal-kj-01.png",
    });
  }, []);

  return (
    <main className={styles.page}>
      <Hero />

      <section className={styles.pillars} aria-label="Browse">
        <PillarIndex />
      </section>

      <section className={styles.marquee} aria-label="Collection preview">
        <LpMarquee />
      </section>

      <section className={styles.contact} aria-labelledby="contact-h">
        <p id="contact-h" className={styles.sectionLabel}>{t.nav.contact}</p>
        <a className={styles.mail} href="mailto:contact@thekjstudio.com">
          contact@thekjstudio.com
        </a>
      </section>
    </main>
  );
}
