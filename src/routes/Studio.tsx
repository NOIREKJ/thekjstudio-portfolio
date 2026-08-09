import { useEffect } from "react";
import { applyMeta } from "../lib/meta";
import styles from "./Placeholder.module.css";

// P1 자리표시 — P2 에서 RackDiagram + GearInventory 로 교체.
export function Studio() {
  useEffect(() => {
    applyMeta({
      title: "스튜디오 — the KJ Studio",
      description: "작업에 쓰는 장비와 랙 구성.",
    });
  }, []);
  return (
    <main className={styles.page}>
      <p className={styles.label}>Studio</p>
      <h1 className={styles.head}>스튜디오</h1>
      <p className={styles.note}>장비와 랙 구성을 곧 여기에 담습니다.</p>
    </main>
  );
}
