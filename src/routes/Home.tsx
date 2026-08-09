import { useEffect } from "react";
import { applyMeta } from "../lib/meta";
import { Hero } from "../components/Hero";
import { PillarIndex } from "../components/PillarIndex";
import { LpMarquee } from "../components/LpMarquee";
import styles from "./Home.module.css";

export function Home() {
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

      <section className={styles.pillars} aria-label="둘러보기">
        <PillarIndex />
      </section>

      <section className={styles.marquee} aria-label="컬렉션 미리보기">
        <LpMarquee />
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
