import type { Gear } from "../lib/gear";
import { buildRackDiagram } from "../lib/rackDiagram";
import styles from "./RackDiagram.module.css";

// 장착 장비를 실제 19" 랙처럼 세로로. 3D 아니라 깔끔한 2D 도식.
export function RackDiagram({ gear }: { gear: Gear[] }) {
  const rows = buildRackDiagram(gear);
  if (rows.length === 0) return null;
  return (
    <div className={styles.rack} role="list" aria-label="랙 구성">
      {rows.map((row) => (
        <div key={row.u} className={styles.row} role="listitem">
          <span className={styles.u}>{String(row.u + 1).padStart(2, "0")}</span>
          {row.gear ? (
            <div className={styles.unit}>
              <span className={styles.led} aria-hidden="true" />
              <span className={styles.name}>{row.gear.name}</span>
              <span className={styles.cat}>{row.gear.category}</span>
            </div>
          ) : (
            <div className={styles.empty} aria-label="빈 슬롯" />
          )}
        </div>
      ))}
    </div>
  );
}
