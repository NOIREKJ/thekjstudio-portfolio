import { Link } from "react-router";
import { getWorks } from "../lib/works";
import { getGear } from "../lib/gear";
import { getLps } from "../lib/lp";
import { useT } from "../i18n";
import styles from "./PillarIndex.module.css";

// 홈의 세 기둥 — 잡지 목차처럼 큰 행. 클릭하면 각 페이지로.
export function PillarIndex() {
  const t = useT();
  const rows = [
    { to: "/work", tag: t.pillars.workTag, title: t.pillars.work, count: getWorks().length },
    { to: "/studio", tag: t.pillars.studioTag, title: t.pillars.studio, count: getGear().length },
    { to: "/collection", tag: t.pillars.collectionTag, title: t.pillars.collection, count: getLps().length },
  ];
  return (
    <nav className={styles.index} aria-label={t.pillars.browse}>
      {rows.map((r) => (
        <Link key={r.to} to={r.to} className={styles.row}>
          <span className={styles.en}>{r.tag}</span>
          <span className={styles.ko}>{r.title}</span>
          <span className={styles.count}>{String(r.count).padStart(2, "0")}</span>
          <span className={styles.arrow} aria-hidden="true">→</span>
        </Link>
      ))}
    </nav>
  );
}
