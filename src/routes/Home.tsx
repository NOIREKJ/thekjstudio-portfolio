import { useEffect, useMemo } from "react";
import { getWorks } from "../lib/works";
import { applyMeta } from "../lib/meta";
import { Hero } from "../components/Hero";
import { WorkGrid } from "../components/WorkGrid";
import { StudioTeaser } from "../components/StudioTeaser";
import { CollectionTeaser } from "../components/CollectionTeaser";
import styles from "./Home.module.css";

export function Home() {
  const works = useMemo(() => getWorks(), []);

  useEffect(() => {
    applyMeta({
      title: "the KJ Studio — 음악을 쓰고, 앱을 만듭니다",
      description:
        "작곡가이자 개발자 김준의 작업물, 스튜디오 장비, LP 컬렉션. 소리와 소프트웨어를 같은 손으로.",
      image: "/images/projects/noire/horizontal-kj-01.png",
    });
  }, []);

  return (
    <main className={styles.page}>
      <Hero />

      <section id="work" className={styles.section} aria-labelledby="work-h">
        <p id="work-h" className={styles.sectionLabel}>Work</p>
        <WorkGrid works={works} />
      </section>

      <section className={styles.teasers}>
        <StudioTeaser />
        <CollectionTeaser />
      </section>

      <section className={styles.contact} aria-labelledby="contact-h">
        <p id="contact-h" className={styles.sectionLabel}>Contact</p>
        <a className={styles.mail} href="mailto:contact@thekjstudio.com">
          contact@thekjstudio.com
        </a>
      </section>
    </main>
  );
}
