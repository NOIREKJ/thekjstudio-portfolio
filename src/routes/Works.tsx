import { useEffect, useMemo } from "react";
import { getWorks } from "../lib/works";
import { applyMeta } from "../lib/meta";
import { useT } from "../i18n";
import { WorkGrid } from "../components/WorkGrid";
import { Reveal } from "../components/Reveal";
import styles from "./Works.module.css";

export function Works() {
  const works = useMemo(() => getWorks(), []);
  const music = useMemo(() => works.filter((w) => w.kind === "music"), [works]);
  const apps = useMemo(() => works.filter((w) => w.kind === "app"), [works]);
  const t = useT();

  useEffect(() => {
    applyMeta({
      title: "Work — the KJ Studio",
      description: "Music and apps by Joon Kim, composer and developer.",
    });
  }, []);

  return (
    <main className={styles.page}>
      {/* 홈처럼 — 라이브 연주 사진을 전면 히어로로 */}
      <header className={styles.hero}>
        <div className={styles.heroBg}>
          <img src="/images/gallery/work-mic.jpg" alt="Studio microphone" />
          <div className={styles.heroScrim} />
        </div>
        <div className={styles.heroInner}>
          <p className={styles.label}>{t.work.label}</p>
          <h1 className={styles.title}>{t.work.title}</h1>
          <p className={styles.lede}>{t.work.lede(works.length)}</p>
        </div>
      </header>

      <div className={styles.body}>
        {apps.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t.work.apps}</h2>
            <Reveal>
              <WorkGrid works={apps} />
            </Reveal>
          </section>
        )}
        {music.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t.work.music}</h2>
            <Reveal>
              <WorkGrid works={music} />
            </Reveal>
          </section>
        )}
      </div>
    </main>
  );
}
