import { Link } from "react-router";
import styles from "./Work.module.css";

export function About() {
  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/">← 처음으로</Link>
      <h1 className={styles.title}>Joon Kim</h1>
      <p className={styles.meta}>the KJ Studio · Seoul</p>
      <div className={styles.body}>
        {`서울에서 음악을 쓰고 앱을 만듭니다.

두 가지를 따로 하는 것처럼 보이지만, 하는 일은 같습니다.
누군가의 하루를 조금 덜 힘들게 만드는 것.

곡은 K_Joon_P라는 이름으로 냅니다.`}
      </div>
    </main>
  );
}
