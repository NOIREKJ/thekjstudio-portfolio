import { useEffect, useMemo } from "react";
import { getGear } from "../lib/gear";
import { applyMeta } from "../lib/meta";
import { useT } from "../i18n";
import { RackDiagram } from "../components/RackDiagram";
import { GearInventory } from "../components/GearInventory";
import { Reveal } from "../components/Reveal";
import styles from "./Studio.module.css";

export function Studio() {
  const gear = useMemo(() => getGear(), []);
  const t = useT();

  useEffect(() => {
    applyMeta({
      title: "Studio — the KJ Studio",
      description: "The gear and rack behind the work.",
    });
  }, []);

  return (
    <main className={styles.page}>
      {/* 홈처럼 — 실제 데스크 사진을 전면 히어로로, 제목을 그 위에 */}
      <header className={styles.hero}>
        <div className={styles.heroBg}>
          <img src="/images/gallery/studio-console.jpg" alt={t.studio.photoAlt} />
          <div className={styles.heroScrim} />
        </div>
        <div className={styles.heroInner}>
          <p className={styles.label}>{t.studio.label}</p>
          <h1 className={styles.title}>{t.studio.title}</h1>
          <p className={styles.lede}>{t.studio.lede}</p>
        </div>
      </header>

      <div className={styles.body}>
        <Reveal className={styles.layout}>
          <section className={styles.rackCol} aria-labelledby="rack-h">
            <p id="rack-h" className={styles.colLabel}>{t.studio.rack}</p>
            <RackDiagram gear={gear} />
          </section>

          <section className={styles.invCol} aria-labelledby="inv-h">
            <p id="inv-h" className={styles.colLabel}>{t.studio.equipment(gear.length)}</p>
            <GearInventory gear={gear} />
          </section>
        </Reveal>
      </div>
    </main>
  );
}
