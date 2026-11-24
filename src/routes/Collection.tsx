import { useEffect, useMemo, useState } from "react";
import { usePublicLps } from "../lib/usePublicLps";
import { availableGenres, filterAndSortLps, type LpSort } from "../lib/lpFilter";
import { applyMeta } from "../lib/meta";
import { useT } from "../i18n";
import { LpGrid } from "../components/LpGrid";
import { LpDetail } from "../components/LpDetail";
import { LpMarquee } from "../components/LpMarquee";
import { Reveal } from "../components/Reveal";
import styles from "./Collection.module.css";

export function Collection() {
  const lps = usePublicLps();
  const genres = useMemo(() => availableGenres(lps), [lps]);
  const [genre, setGenre] = useState<string | null>(null);
  const [sort, setSort] = useState<LpSort>("year-desc");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = lps.find(lp => lp.id === selectedId);
  const activeGenre = genre && genres.includes(genre) ? genre : null;
  const t = useT();

  const SORTS: { key: LpSort; label: string }[] = [
    { key: "year-desc", label: t.collection.newest },
    { key: "year-asc", label: t.collection.oldest },
    { key: "artist", label: t.collection.artist },
  ];

  useEffect(() => {
    applyMeta({ title: "Collection — the KJ Studio", description: "The vinyl collection." });
  }, []);

  const shown = useMemo(() => filterAndSortLps(lps, { genre: activeGenre, sort }), [lps, activeGenre, sort]);

  return (
    <main className={styles.page}>
      {/* 홈처럼 — 흐르는 LP 커버를 배경으로 한 히어로 */}
      <header className={styles.hero}>
        <div className={styles.heroBg}>
          <LpMarquee lps={lps} to={null} />
          <div className={styles.heroScrim} />
        </div>
        <div className={styles.heroInner}>
          <p className={styles.label}>{t.collection.label}</p>
          <h1 className={styles.title}>{t.collection.title}</h1>
          <p className={styles.lede}>{t.collection.lede(lps.length)}</p>
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.controls}>
          <div className={styles.genres} role="group" aria-label={t.collection.filterAria}>
            <button type="button" className={activeGenre == null ? styles.chipOn : styles.chip} onClick={() => setGenre(null)}>
              {t.collection.all}
            </button>
            {genres.map((g) => (
              <button key={g} type="button" className={activeGenre === g ? styles.chipOn : styles.chip} onClick={() => setGenre(g)}>
                {g}
              </button>
            ))}
          </div>
          <div className={styles.sorts} role="group" aria-label={t.collection.sortAria}>
            {SORTS.map((s) => (
              <button key={s.key} type="button" className={sort === s.key ? styles.sortOn : styles.sort} onClick={() => setSort(s.key)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <Reveal>
          <LpGrid lps={shown} onOpen={lp => setSelectedId(lp.id)} />
        </Reveal>
      </div>

      {selected && <LpDetail lp={selected} onClose={() => setSelectedId(null)} />}
    </main>
  );
}
