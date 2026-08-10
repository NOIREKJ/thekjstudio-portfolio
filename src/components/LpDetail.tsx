import { useEffect } from "react";
import type { Lp } from "../lib/lp";
import { useT } from "../i18n";
import styles from "./LpDetail.module.css";

// 안전 필드만(가격·시리얼 없음). 스트리밍 링크는 새 창 + noopener.
// 레퍼런스(Mac Miller 'Swimming')처럼 커버 슬리브에서 바이닐이 빠져나온다 — 다크 버전.
export function LpDetail({ lp, onClose }: { lp: Lp; onClose: () => void }) {
  const t = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // 데이터엔 Apple Music URL 만 있어 Spotify·YouTube 는 '아티스트 앨범' 검색 링크로 연다.
  const q = encodeURIComponent(`${lp.artist} ${lp.title}`);
  const links = [
    lp.appleMusicUrl ? { label: t.lp.apple, url: lp.appleMusicUrl } : null,
    { label: t.lp.spotify, url: `https://open.spotify.com/search/${q}` },
    { label: t.lp.youtube, url: `https://music.youtube.com/search?q=${q}` },
  ].filter((x): x is { label: string; url: string } => x != null);

  const rows: [string, string | number | null][] = [
    [t.lp.Label, lp.label],
    [t.lp.Catalog, lp.catalogNo],
    [t.lp.Country, lp.country],
    [t.lp.Format, lp.format],
    [t.lp.Speed, lp.speed ? `${lp.speed} RPM` : null],
    [t.lp.Genre, lp.genre],
  ];

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-label={`${lp.artist} — ${lp.title}`}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.close} onClick={onClose} aria-label={t.lp.close}>✕</button>

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
          <div className={styles.links}>
            {links.map((link) => (
              <a key={link.label} className={styles.link} href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label} ↗
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
