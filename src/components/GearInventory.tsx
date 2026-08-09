import type { Gear } from "../lib/gear";
import { groupByCategory } from "../lib/rackDiagram";
import styles from "./GearInventory.module.css";

// DB 카테고리(한글) → 표시용 영어 라벨. 없으면 원문 유지.
const LABEL: Record<string, string> = {
  "오디오/음향": "Audio",
  "악기": "Instruments",
  "컴퓨터/Mac": "Computer",
};

// 전체 장비를 카테고리별로. 이름만(재산정보 없음).
export function GearInventory({ gear }: { gear: Gear[] }) {
  const groups = groupByCategory(gear);
  return (
    <div className={styles.inventory}>
      {groups.map((group) => (
        <section key={group.category} className={styles.group}>
          <h3 className={styles.cat}>
            {LABEL[group.category] ?? group.category}
            <span className={styles.count}>{group.items.length}</span>
          </h3>
          <ul className={styles.list}>
            {group.items.map((g) => (
              <li key={g.id} className={styles.item}>{g.name}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
