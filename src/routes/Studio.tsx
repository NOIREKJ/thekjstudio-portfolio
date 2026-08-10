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
      <header className={styles.head}>
        <p className={styles.label}>{t.studio.label}</p>
        <h1 className={styles.title}>{t.studio.title}</h1>
        <p className={styles.lede}>{t.studio.lede}</p>
      </header>

      <Reveal>
        <figure className={styles.photo}>
          <img src="/images/gallery/horizontal-4-kj-room.jpg" alt={t.studio.photoAlt} loading="lazy" />
        </figure>
      </Reveal>

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
    </main>
  );
}
