import { useEffect } from "react";
import { applyMeta } from "../lib/meta";
import styles from "./Placeholder.module.css";

// P1 자리표시 — P3 에서 LpGrid + 필터/정렬로 교체.
export function Collection() {
  useEffect(() => {
    applyMeta({
      title: "컬렉션 — the KJ Studio",
      description: "LP 컬렉션.",
    });
  }, []);
  return (
    <main className={styles.page}>
      <p className={styles.label}>Collection</p>
      <h1 className={styles.head}>LP 컬렉션</h1>
      <p className={styles.note}>음반을 곧 여기에 담습니다.</p>
    </main>
  );
}
