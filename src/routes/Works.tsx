import { useEffect, useMemo } from "react";
import { getWorks } from "../lib/works";
import { applyMeta } from "../lib/meta";
import { WorkGrid } from "../components/WorkGrid";
import styles from "./Works.module.css";

export function Works() {
  const works = useMemo(() => getWorks(), []);

  useEffect(() => {
    applyMeta({
      title: "Work — the KJ Studio",
      description: "Music and apps by Joon Kim, composer and developer.",
    });
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <p className={styles.label}>Work</p>
        <h1 className={styles.title}>Work</h1>
        <p className={styles.lede}>Music written and apps built — {works.length} in total.</p>
      </header>
      <WorkGrid works={works} />
    </main>
  );
}
