import { useEffect, useMemo, useState } from "react";
import { getLps, type Lp } from "../lib/lp";
import { availableGenres, filterAndSortLps, type LpSort } from "../lib/lpFilter";
import { applyMeta } from "../lib/meta";
import { LpGrid } from "../components/LpGrid";
import { LpDetail } from "../components/LpDetail";
import styles from "./Collection.module.css";

const SORTS: { key: LpSort; label: string }[] = [
  { key: "year-desc", label: "Newest" },
  { key: "year-asc", label: "Oldest" },
  { key: "artist", label: "Artist" },
];

export function Collection() {
  const lps = useMemo(() => getLps(), []);
  const genres = useMemo(() => availableGenres(lps), [lps]);
  const [genre, setGenre] = useState<string | null>(null);
  const [sort, setSort] = useState<LpSort>("year-desc");
  const [selected, setSelected] = useState<Lp | null>(null);

  useEffect(() => {
    applyMeta({ title: "Collection — the KJ Studio", description: "The vinyl collection." });
  }, []);

  const shown = useMemo(() => filterAndSortLps(lps, { genre, sort }), [lps, genre, sort]);

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <p className={styles.label}>Collection</p>
        <h1 className={styles.title}>Collection</h1>
        <p className={styles.lede}>{lps.length} records for the turntable.</p>
      </header>

      <div className={styles.controls}>
        <div className={styles.genres} role="group" aria-label="Filter by genre">
          <button type="button" className={genre == null ? styles.chipOn : styles.chip} onClick={() => setGenre(null)}>
            All
          </button>
          {genres.map((g) => (
            <button key={g} type="button" className={genre === g ? styles.chipOn : styles.chip} onClick={() => setGenre(g)}>
              {g}
            </button>
          ))}
        </div>
        <div className={styles.sorts} role="group" aria-label="Sort">
          {SORTS.map((s) => (
            <button key={s.key} type="button" className={sort === s.key ? styles.sortOn : styles.sort} onClick={() => setSort(s.key)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <LpGrid lps={shown} onOpen={setSelected} />

      {selected && <LpDetail lp={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}
