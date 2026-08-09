import { useEffect } from "react";
import { Link } from "react-router";
import { applyMeta } from "../lib/meta";
import styles from "./About.module.css";

export function About() {
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
      <Link className={styles.back} to="/">← Back</Link>

      <div className={styles.grid}>
        <div>
          <p className={styles.overline}>About</p>
          <h1 className={styles.title}>Joon Kim</h1>
          <p className={styles.meta}>the KJ Studio · Seoul</p>

          <div className={styles.body}>
            {`Based in Seoul, I write music and build apps.

They may look like two separate things, but the work is the same —
making someone's day a little less hard.

I release music under the name K_Joon_P.`}
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
            alt="Joon Kim"
            loading="lazy"
          />
        </figure>
      </div>
    </main>
  );
}
