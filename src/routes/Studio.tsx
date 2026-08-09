import { useEffect, useMemo } from "react";
import { getGear } from "../lib/gear";
import { applyMeta } from "../lib/meta";
import { RackDiagram } from "../components/RackDiagram";
import { GearInventory } from "../components/GearInventory";
import styles from "./Studio.module.css";

export function Studio() {
  const gear = useMemo(() => getGear(), []);

  useEffect(() => {
    applyMeta({
      title: "Studio — the KJ Studio",
      description: "The gear and rack behind the work.",
    });
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <p className={styles.label}>Studio</p>
        <h1 className={styles.title}>Studio</h1>
        <p className={styles.lede}>
          The tools I make sound with — outboard and sound modules in the rack, and everything else.
        </p>
      </header>

      <div className={styles.layout}>
        <section className={styles.rackCol} aria-labelledby="rack-h">
          <p id="rack-h" className={styles.colLabel}>Rack</p>
          <RackDiagram gear={gear} />
        </section>

        <section className={styles.invCol} aria-labelledby="inv-h">
          <p id="inv-h" className={styles.colLabel}>Equipment · {gear.length}</p>
          <GearInventory gear={gear} />
        </section>
      </div>
    </main>
  );
}
