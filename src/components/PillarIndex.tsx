import { Link } from "react-router";
import { getWorks } from "../lib/works";
import { getGear } from "../lib/gear";
import { getArrangements } from "../lib/arrangements";
import { useT } from "../i18n";
import styles from "./PillarIndex.module.css";

// 홈의 바로가기. 기존 목차 레이아웃을 공유한다.
export function PillarIndex({ lpCount }: { lpCount: number }) {
  const t = useT();
  const rows = [
    { to: "/work", tag: t.pillars.workTag, title: t.pillars.work, count: getWorks().length },
    { to: "/arrangements", tag: t.pillars.arrangementsTag, title: t.nav.arrangements, count: getArrangements().length },
    { to: "/studio", tag: t.pillars.studioTag, title: t.pillars.studio, count: getGear().length },
    { to: "/collection", tag: t.pillars.collectionTag, title: t.pillars.collection, count: lpCount },
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
