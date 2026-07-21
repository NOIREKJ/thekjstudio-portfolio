import { useEffect } from "react";
import { Link } from "react-router";
import { applyMeta } from "../lib/meta";
import styles from "./About.module.css";

export function About() {
  useEffect(() => {
    applyMeta({
      title: "소개 — the KJ Studio",
      description:
        "서울에서 음악을 쓰고 앱을 만듭니다. 곡은 K_Joon_P라는 이름으로 냅니다.",
      image: "/images/kimjoonmain.jpeg",
    });
  }, []);

  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/">← 처음으로</Link>

      <div className={styles.grid}>
        <div>
          <p className={styles.overline}>About — 소개</p>
          <h1 className={styles.title}>Joon Kim</h1>
          <p className={styles.meta}>the KJ Studio · Seoul</p>

          <div className={styles.body}>
            {`서울에서 음악을 쓰고 앱을 만듭니다.

두 가지를 따로 하는 것처럼 보이지만, 하는 일은 같습니다.
누군가의 하루를 조금 덜 힘들게 만드는 것.

곡은 K_Joon_P라는 이름으로 냅니다.`}
          </div>

          <dl className={styles.facts}>
            <div className={styles.fact}>
              <dt>Base</dt>
              <dd>Seoul, KR</dd>
            </div>
            <div className={styles.fact}>
              <dt>Alias</dt>
              <dd>K_Joon_P</dd>
            </div>
            <div className={styles.fact}>
              <dt>Mail</dt>
              <dd>
                <a href="mailto:contact@thekjstudio.com">contact@thekjstudio.com</a>
              </dd>
            </div>
          </dl>
        </div>

        <figure className={styles.figure}>
          <img
            src="/images/kimjoonmain.jpeg"
            alt="Joon Kim의 프로필 사진"
            loading="lazy"
          />
        </figure>
      </div>
    </main>
  );
}
