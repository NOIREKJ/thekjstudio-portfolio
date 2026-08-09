import { Link } from "react-router";
import { getWorks } from "../lib/works";
import { getGear } from "../lib/gear";
import { getLps } from "../lib/lp";
import styles from "./PillarIndex.module.css";

// 홈의 세 기둥 — 잡지 목차처럼 큰 행. 클릭하면 각 페이지로.
export function PillarIndex() {
  const rows = [
    { to: "/work", en: "Work", ko: "작업", count: getWorks().length, unit: "" },
    { to: "/studio", en: "Studio", ko: "스튜디오", count: getGear().length, unit: "점" },
    { to: "/collection", en: "Collection", ko: "컬렉션", count: getLps().length, unit: "장" },
  ];
  return (
    <nav className={styles.index} aria-label="둘러보기">
      {rows.map((r) => (
        <Link key={r.to} to={r.to} className={styles.row}>
          <span className={styles.en}>{r.en}</span>
          <span className={styles.ko}>{r.ko}</span>
          <span className={styles.count}>{String(r.count).padStart(2, "0")}{r.unit}</span>
          <span className={styles.arrow} aria-hidden="true">→</span>
        </Link>
      ))}
    </nav>
  );
}
