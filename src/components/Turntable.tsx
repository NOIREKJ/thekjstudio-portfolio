import { Vinyl } from "./Vinyl";
import styles from "./Turntable.module.css";

/*
  LP 플레이어.
  playing이면 톤암이 판 위로 내려앉고, spinning이면 판이 돈다.
  소리를 끄면 톤암은 얹힌 채 판만 멈춘다 — 일시정지의 모습 그대로.
*/
export function Turntable({
  playing,
  spinning,
  label,
}: {
  playing: boolean;
  spinning: boolean;
  label?: string;
}) {
  return (
    <div className={styles.deck} aria-hidden="true">
      <div className={styles.platter}>
        <Vinyl size={172} spinning={spinning} duration="3.6s" label={label} />
      </div>

      <div className={styles.tonearm} data-playing={playing}>
        <div className={styles.counterweight} />
        <div className={styles.pivot} />
        <div className={styles.arm}>
          <div className={styles.headshell} />
        </div>
      </div>

      <div className={styles.controls}>
        <span className={styles.speed}>33⅓ RPM</span>
        <span className={styles.brand}>the KJ Studio</span>
        <span className={styles.power} data-on={spinning} />
      </div>
    </div>
  );
}
