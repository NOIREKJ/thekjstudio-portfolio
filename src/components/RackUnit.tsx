import type { Gear } from "../lib/gear";
import { rackFace } from "../lib/rackFace";
import styles from "./RackUnit.module.css";

// CSS 로 그린 앞판 '얼굴' — 사진 없이 실물 랙 장비 느낌.
function Face({ kind }: { kind: ReturnType<typeof rackFace> }) {
  if (kind === "vu") {
    return (
      <span className={styles.vu} aria-hidden="true">
        <span className={styles.vuArc} />
        <span className={styles.vuNeedle} />
      </span>
    );
  }
  if (kind === "leds") {
    return (
      <span className={styles.leds} aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <i key={i} style={{ height: `${30 + ((i * 37) % 70)}%` }} />
        ))}
      </span>
    );
  }
  if (kind === "display") {
    return (
      <span className={styles.display} aria-hidden="true">
        <span className={styles.displayLine} style={{ width: "70%" }} />
        <span className={styles.displayLine} style={{ width: "45%" }} />
      </span>
    );
  }
  return (
    <span className={styles.knobs} aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <i key={i} style={{ transform: `rotate(${-50 + i * 34}deg)` }} />
      ))}
    </span>
  );
}

export function RackUnit({ gear, u }: { gear: Gear; u: number }) {
  return (
    <div className={styles.unit}>
      <span className={styles.ear} data-side="l"><i /><i /></span>
      <span className={styles.u}>{String(u + 1).padStart(2, "0")}</span>
      <span className={styles.name}>{gear.name}</span>
      <span className={styles.face}><Face kind={rackFace(gear)} /></span>
      <span className={styles.ear} data-side="r"><i /><i /></span>
    </div>
  );
}

export function RackBlank() {
  return (
    <div className={styles.blank} aria-hidden="true">
      <span className={styles.ear} data-side="l"><i /><i /></span>
      <span className={styles.vents}>
        {Array.from({ length: 7 }, (_, i) => <i key={i} />)}
      </span>
      <span className={styles.ear} data-side="r"><i /><i /></span>
    </div>
  );
}
