import { useEffect, useMemo, useState } from "react";
import { getLps, type Lp } from "../lib/lp";
import { availableGenres, filterAndSortLps, type LpSort } from "../lib/lpFilter";
import { applyMeta } from "../lib/meta";
import { LpGrid } from "../components/LpGrid";
import { LpDetail } from "../components/LpDetail";
import styles from "./Collection.module.css";

const SORTS: { key: LpSort; label: string }[] = [
  { key: "year-desc", label: "발매순" },
  { key: "year-asc", label: "오래된순" },
  { key: "artist", label: "아티스트순" },
];

export function Collection() {
  const lps = useMemo(() => getLps(), []);
  const genres = useMemo(() => availableGenres(lps), [lps]);
  const [genre, setGenre] = useState<string | null>(null);
  const [sort, setSort] = useState<LpSort>("year-desc");
  const [selected, setSelected] = useState<Lp | null>(null);

  useEffect(() => {
    applyMeta({ title: "컬렉션 — the KJ Studio", description: "LP 컬렉션." });
  }, []);

  const shown = useMemo(() => filterAndSortLps(lps, { genre, sort }), [lps, genre, sort]);

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <p className={styles.label}>Collection</p>
        <h1 className={styles.title}>LP 컬렉션</h1>
        <p className={styles.lede}>턴테이블에 올리는 음반 {lps.length}장.</p>
      </header>

      <div className={styles.controls}>
        <div className={styles.genres} role="group" aria-label="장르 필터">
          <button type="button" className={genre == null ? styles.chipOn : styles.chip} onClick={() => setGenre(null)}>
            전체
          </button>
          {genres.map((g) => (
            <button key={g} type="button" className={genre === g ? styles.chipOn : styles.chip} onClick={() => setGenre(g)}>
              {g}
            </button>
          ))}
        </div>
        <div className={styles.sorts} role="group" aria-label="정렬">
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
