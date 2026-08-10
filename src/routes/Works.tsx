import { useEffect, useMemo } from "react";
import { getWorks } from "../lib/works";
import { applyMeta } from "../lib/meta";
import { useT } from "../i18n";
import { WorkGrid } from "../components/WorkGrid";
import { Reveal } from "../components/Reveal";
import styles from "./Works.module.css";

export function Works() {
  const works = useMemo(() => getWorks(), []);
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
          <img src="/images/gallery/horizontal-2-kj-blueshirt.jpeg" alt="Joon Kim on the keys" />
          <div className={styles.heroScrim} />
        </div>
        <div className={styles.heroInner}>
          <p className={styles.label}>{t.work.label}</p>
          <h1 className={styles.title}>{t.work.title}</h1>
          <p className={styles.lede}>{t.work.lede(works.length)}</p>
        </div>
      </header>

      <div className={styles.body}>
        <Reveal>
          <WorkGrid works={works} />
        </Reveal>
      </div>
    </main>
  );
}
