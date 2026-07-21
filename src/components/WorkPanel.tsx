import { Link } from "react-router";
import type { Work } from "../lib/works";
import { Turntable } from "./Turntable";
import styles from "./WorkPanel.module.css";

/*
  턴테이블 데크. 건반 아래 항상 놓여 있다.
  건반을 누르면 판이 얹히고 톤암이 내려온다. 대기 중엔 톤암이 들려 있다.
*/
export function WorkPanel({
  work,
  spinning = true,
}: {
  work: Work | null;
  spinning?: boolean;
}) {
  const preview = work?.body.split("\n\n")[0] ?? "";

  return (
    <section className={styles.panel} aria-live="polite">
      <div className={styles.deckRow}>
        <Turntable
          playing={work !== null}
          spinning={work !== null && spinning}
          label={work ? `♪ ${work.note}` : undefined}
        />

        <div className={styles.info}>
          {work ? (
            <>
              <p className={styles.nowPlaying}>Now Playing — ♪ {work.note}</p>
              <h2 className={styles.title}>{work.title}</h2>
              <p className={styles.body}>{preview}</p>
              <Link className={styles.link} to={`/work/${work.slug}`}>
                자세히 보기 →
              </Link>
            </>
          ) : (
            <>
              <p className={styles.standby}>Standby</p>
              <p className={styles.idleHint}>
                건반을 누르면 이 턴테이블이 돌기 시작합니다.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
