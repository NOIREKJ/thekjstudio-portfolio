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
      title: "스튜디오 — the KJ Studio",
      description: "작업에 쓰는 장비와 랙 구성.",
    });
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <p className={styles.label}>Studio</p>
        <h1 className={styles.title}>스튜디오</h1>
        <p className={styles.lede}>
          소리를 만드는 도구들. 랙에 걸린 아웃보드와 음원, 그리고 전체 장비.
        </p>
      </header>

      <div className={styles.layout}>
        <section className={styles.rackCol} aria-labelledby="rack-h">
          <p id="rack-h" className={styles.colLabel}>Rack</p>
          <RackDiagram gear={gear} />
        </section>

        <section className={styles.invCol} aria-labelledby="inv-h">
          <p id="inv-h" className={styles.colLabel}>전체 장비 · {gear.length}</p>
          <GearInventory gear={gear} />
        </section>
      </div>
    </main>
  );
}
