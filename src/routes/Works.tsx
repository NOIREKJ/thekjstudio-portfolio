import { useEffect, useMemo } from "react";
import { getWorks } from "../lib/works";
import { applyMeta } from "../lib/meta";
import { WorkGrid } from "../components/WorkGrid";
import styles from "./Works.module.css";

export function Works() {
  const works = useMemo(() => getWorks(), []);

  useEffect(() => {
    applyMeta({
      title: "작업 — the KJ Studio",
      description: "작곡가이자 개발자 김준의 음악과 앱 작업물.",
    });
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <p className={styles.label}>Work</p>
        <h1 className={styles.title}>작업</h1>
        <p className={styles.lede}>쓴 음악과 만든 앱. {works.length}개.</p>
      </header>
      <WorkGrid works={works} />
    </main>
  );
}
