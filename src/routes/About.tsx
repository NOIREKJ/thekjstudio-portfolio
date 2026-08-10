import { useEffect } from "react";
import { applyMeta } from "../lib/meta";
import { useT } from "../i18n";
import { Reveal } from "../components/Reveal";
import styles from "./About.module.css";

export function About() {
  const t = useT();
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
      </div>
    </main>
  );
}
