import type { CSSProperties } from "react";
import styles from "./Vinyl.module.css";

/*
  LP. 홈이 파인 검은 판, 놋쇠 라벨, 가운데 구멍.
  spinning이 false면 판이 멈춘다 — 소리를 끄면 턴테이블도 선다.
*/
export function Vinyl({
  size = 64,
  spinning = true,
  duration = "6s",
  label,
}: {
  size?: number;
  spinning?: boolean;
  duration?: string;
  label?: string;
}) {
  return (
    <div
      className={styles.disc}
      data-spinning={spinning}
      style={{ width: size, height: size, "--spin": duration } as CSSProperties}
      aria-hidden="true"
    >
      <div className={styles.sheen} />
      <div className={styles.label}>{label}</div>
      <div className={styles.hole} />
    </div>
  );
}
