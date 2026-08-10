import type { Gear } from "../lib/gear";
import { groupByCategory } from "../lib/rackDiagram";
import { useT } from "../i18n";
import styles from "./GearInventory.module.css";

// 전체 장비를 카테고리별로. 이름만(재산정보 없음).
export function GearInventory({ gear }: { gear: Gear[] }) {
  const t = useT();
  const groups = groupByCategory(gear);
  return (
    <div className={styles.inventory}>
      {groups.map((group) => (
        <section key={group.category} className={styles.group}>
          <h3 className={styles.cat}>
            {t.studio.cat[group.category] ?? group.category}
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
