import { Link, useParams } from "react-router";
import { getWork } from "../lib/works";
import styles from "./Work.module.css";

export function Work() {
  const { slug } = useParams();
  const work = slug ? getWork(slug) : undefined;

  if (!work) {
    return (
      <main className={styles.page}>
        <p>찾을 수 없는 작업입니다.</p>
        <Link className={styles.back} to="/">← 처음으로</Link>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/">← 처음으로</Link>
      <h1 className={styles.title}>{work.title}</h1>
      <p className={styles.meta}>{work.kind} · {work.year}</p>
      <div className={styles.body}>{work.body}</div>
    </main>
  );
}
