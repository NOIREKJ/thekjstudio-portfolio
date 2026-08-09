import type { Lp } from "../lib/lp";
import { LpCard } from "./LpCard";
import styles from "./LpGrid.module.css";

export function LpGrid({ lps, onOpen }: { lps: Lp[]; onOpen: (lp: Lp) => void }) {
  return (
    <div className={styles.grid}>
      {lps.map((lp) => (
        <LpCard key={lp.id} lp={lp} onOpen={onOpen} />
      ))}
    </div>
  );
}
