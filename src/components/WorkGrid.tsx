import type { Work } from "../lib/works";
import { WorkCard } from "./WorkCard";
import styles from "./WorkGrid.module.css";

export function WorkGrid({ works }: { works: Work[] }) {
  return (
    <div className={styles.grid}>
      {works.map((w) => (
        <WorkCard key={w.slug} work={w} />
      ))}
    </div>
  );
}
