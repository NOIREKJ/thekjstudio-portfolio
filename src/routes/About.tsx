import { useEffect } from "react";
import { Link } from "react-router";
import { applyMeta } from "../lib/meta";
import { useT } from "../i18n";
import styles from "./About.module.css";

export function About() {
  const t = useT();
  useEffect(() => {
    applyMeta({
      title: "About — the KJ Studio",
      description:
        "Based in Seoul, I write music and build apps. Music released as K_Joon_P.",
      image: "/images/kimjoonmain.jpeg",
    });
  }, []);

  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/">{t.about.back}</Link>

      <div className={styles.grid}>
        <div>
          <p className={styles.overline}>{t.about.overline}</p>
          <h1 className={styles.title}>Joon Kim</h1>
          <p className={styles.meta}>the KJ Studio · Seoul</p>

          <div className={styles.body}>{t.about.body}</div>

          <dl className={styles.facts}>
            <div className={styles.fact}>
              <dt>{t.about.base}</dt>
              <dd>Seoul, KR</dd>
            </div>
            <div className={styles.fact}>
              <dt>{t.about.alias}</dt>
              <dd>K_Joon_P</dd>
            </div>
            <div className={styles.fact}>
              <dt>{t.about.mail}</dt>
              <dd>
                <a href="mailto:contact@thekjstudio.com">contact@thekjstudio.com</a>
              </dd>
            </div>
          </dl>
        </div>

        <figure className={styles.figure}>
          <img
            src="/images/kimjoonmain.jpeg"
            alt="Joon Kim"
            loading="lazy"
          />
        </figure>
      </div>
    </main>
  );
}
