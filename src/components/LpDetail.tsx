import { useEffect } from "react";
import type { Lp } from "../lib/lp";
import styles from "./LpDetail.module.css";

// 안전 필드만(가격·시리얼 없음). Apple Music 은 새 창 + noopener.
// 레퍼런스(Mac Miller 'Swimming')처럼 커버 슬리브에서 바이닐이 빠져나온다 — 다크 버전.
export function LpDetail({ lp, onClose }: { lp: Lp; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rows: [string, string | number | null][] = [
    ["Label", lp.label],
    ["Catalog", lp.catalogNo],
    ["Country", lp.country],
    ["Format", lp.format],
    ["Speed", lp.speed ? `${lp.speed} RPM` : null],
    ["Genre", lp.genre],
  ];

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-label={`${lp.artist} — ${lp.title}`}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">✕</button>

        <div className={styles.disc}>
          {/* 슬리브 뒤에서 빠져나오는 레코드 */}
          <div className={styles.vinyl} aria-hidden="true">
            <div className={styles.grooves} />
            <div className={styles.label}>
              {lp.cover && <img src={lp.cover} alt="" />}
            </div>
            <div className={styles.hole} />
          </div>
          {/* 커버 슬리브 */}
          <div className={styles.sleeve}>
            {lp.cover ? <img src={lp.cover} alt="" /> : <span className={styles.fallback} aria-hidden="true">{lp.artist.slice(0, 1)}</span>}
          </div>
        </div>

        <div className={styles.info}>
          <p className={styles.artist}>{lp.artist}</p>
          <h2 className={styles.title}>{lp.title}</h2>
          {lp.releaseYear && <p className={styles.year}>{lp.releaseYear}</p>}
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
              Listen on Apple Music →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
