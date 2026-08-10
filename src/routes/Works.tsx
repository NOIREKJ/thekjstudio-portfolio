import { useEffect, useMemo } from "react";
import { getWorks } from "../lib/works";
import { applyMeta } from "../lib/meta";
import { useT } from "../i18n";
import { WorkGrid } from "../components/WorkGrid";
import { Reveal } from "../components/Reveal";
import styles from "./Works.module.css";

export function Works() {
  const works = useMemo(() => getWorks(), []);
  const t = useT();

  useEffect(() => {
    applyMeta({
      title: "Work — the KJ Studio",
      description: "Music and apps by Joon Kim, composer and developer.",
    });
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <p className={styles.label}>{t.work.label}</p>
        <h1 className={styles.title}>{t.work.title}</h1>
        <p className={styles.lede}>{t.work.lede(works.length)}</p>
      </header>
      <Reveal>
        <WorkGrid works={works} />
      </Reveal>
    </main>
  );
}
