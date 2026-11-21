import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import {
  filterArrangements, getArrangements, type ArrangementFilter,
} from "../lib/arrangements";
import { applyMeta } from "../lib/meta";
import { useT } from "../i18n";
import { Reveal } from "../components/Reveal";
import styles from "./Arrangements.module.css";

const FILTERS: ArrangementFilter[] = ["all", "wip", "done"];

function asFilter(raw: string | null): ArrangementFilter {
  return FILTERS.includes(raw as ArrangementFilter)
    ? (raw as ArrangementFilter)
    : "all";
}

export function Arrangements() {
  const [params, setParams] = useSearchParams();
  const filter = asFilter(params.get("filter"));
  const all = useMemo(() => getArrangements(), []);
  const shown = useMemo(() => filterArrangements(all, filter), [all, filter]);
  const t = useT();

  useEffect(() => {
    applyMeta({
      title: `${t.arrangements.title} — the KJ Studio`,
      description: t.arrangements.lede(all.length),
    });
  }, [t, all.length]);

  // 필터는 URL 에 남긴다 — 새로고침·공유에 살아남아야 한다. replace 를 쓰는
  // 이유는 필터를 네 번 누른 뒤 뒤로가기가 네 번 걸리면 안 되기 때문이다.
  const pick = (next: ArrangementFilter) => {
    const q = new URLSearchParams(params);
    if (next === "all") q.delete("filter");
    else q.set("filter", next);
    setParams(q, { replace: true });
  };

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <p className={styles.label}>{t.arrangements.label}</p>
        <h1 className={styles.title}>{t.arrangements.title}</h1>
        <p className={styles.lede}>{t.arrangements.lede(all.length)}</p>
      </header>

      <div className={styles.body}>
        {all.length > 0 && (
          <div className={styles.filters} role="group" aria-label={t.arrangements.filterAria}>
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`${styles.pill} ${filter === f ? styles.pillOn : ""}`}
                aria-pressed={filter === f}
                onClick={() => pick(f)}
              >
                {t.arrangements[f]}
              </button>
            ))}
          </div>
        )}

        {/*
          데이터가 없을 때 구역을 비우지 않고 "준비 중"을 그린다. 제목만 남고
          아래가 빈 화면은 고장난 것처럼 보인다. 필터 때문에 비었을 때와
          아직 올린 곡이 없을 때는 다른 말을 해야 한다 — 전자는 사용자가
          되돌릴 수 있고 후자는 아니다.
        */}
        {shown.length === 0 ? (
          <p className={styles.empty}>
            {all.length === 0 ? t.arrangements.empty : t.arrangements.emptyFilter}
          </p>
        ) : (
          <Reveal>
            <ul className={styles.grid}>
              {shown.map((a) => (
                <li key={a.slug} className={styles.item}>
                  <Link to={`/arrangements/${a.slug}`} className={styles.card}>
                    <span className={styles.cardTop}>
                      <span className={styles.badge}>{t.arrangements.status[a.status]}</span>
                      {a.genre && <span className={styles.genre}>{a.genre}</span>}
                    </span>
                    <span className={styles.cardTitle}>{a.title}</span>
                    {a.originalArtist && (
                      <span className={styles.artist}>{a.originalArtist}</span>
                    )}
                    {a.keyBpm && <span className={styles.spec}>{a.keyBpm}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </div>
    </main>
  );
}
