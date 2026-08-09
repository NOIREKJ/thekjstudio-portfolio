import type { Gear } from "../lib/gear";
import { buildRackDiagram } from "../lib/rackDiagram";
import { RackUnit, RackBlank } from "./RackUnit";
import styles from "./RackDiagram.module.css";

// 실제 19" 랙처럼 — 프레임 안에 유닛이 쌓이고, 각 유닛은 성격 있는 앞판을 가진다.
export function RackDiagram({ gear }: { gear: Gear[] }) {
  const rows = buildRackDiagram(gear);
  if (rows.length === 0) return null;
  return (
    <div className={styles.frame} role="list" aria-label="Studio rack">
      <div className={styles.stack}>
        {rows.map((row) =>
          row.gear ? (
            <div key={row.u} role="listitem"><RackUnit gear={row.gear} u={row.u} /></div>
          ) : (
            <div key={row.u} role="presentation"><RackBlank /></div>
          ),
        )}
      </div>
    </div>
  );
}
