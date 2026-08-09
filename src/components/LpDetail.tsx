import { useEffect } from "react";
import type { Lp } from "../lib/lp";
import styles from "./LpDetail.module.css";

// 안전 필드만(가격·시리얼 없음). Apple Music 은 새 창 + noopener.
export function LpDetail({ lp, onClose }: { lp: Lp; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rows: [string, string | number | null][] = [
    ["레이블", lp.label],
    ["카탈로그", lp.catalogNo],
    ["발매", lp.releaseYear],
    ["국가", lp.country],
    ["포맷", lp.format],
    ["속도", lp.speed ? `${lp.speed} RPM` : null],
    ["장르", lp.genre],
  ];

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-label={`${lp.artist} — ${lp.title}`}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">✕</button>
        <div className={styles.cover}>
          {lp.cover ? <img src={lp.cover} alt="" /> : <span className={styles.fallback} aria-hidden="true">{lp.artist.slice(0, 1)}</span>}
        </div>
        <div className={styles.info}>
          <p className={styles.artist}>{lp.artist}</p>
          <h2 className={styles.title}>{lp.title}</h2>
          <dl className={styles.meta}>
            {rows.filter(([, v]) => v != null && v !== "").map(([k, v]) => (
              <div key={k} className={styles.metaRow}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          {lp.appleMusicUrl && (
            <a className={styles.apple} href={lp.appleMusicUrl} target="_blank" rel="noopener noreferrer">
              Apple Music에서 듣기 →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
