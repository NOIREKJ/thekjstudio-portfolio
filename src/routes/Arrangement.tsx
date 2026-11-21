import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router";
import {
  canSell, getArrangements, youtubeEmbed,
} from "../lib/arrangements";
import { parseBlocks, type Block } from "../lib/markdownBlocks";
import { applyMeta } from "../lib/meta";
import { useT } from "../i18n";
import styles from "./Arrangement.module.css";

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        const key = `${b.kind}-${i}`;
        if (b.kind === "heading") {
          return b.level === 3
            ? <h3 key={key} className={styles.h3}>{b.text}</h3>
            : <h4 key={key} className={styles.h4}>{b.text}</h4>;
        }
        if (b.kind === "quote") {
          return <blockquote key={key} className={styles.quote}>{b.text}</blockquote>;
        }
        if (b.kind === "list") {
          const items = b.items.map((it, j) => <li key={j}>{it}</li>);
          return b.ordered
            ? <ol key={key} className={styles.list}>{items}</ol>
            : <ul key={key} className={styles.list}>{items}</ul>;
        }
        return <p key={key} className={styles.para}>{b.text}</p>;
      })}
    </>
  );
}

export function Arrangement() {
  const { slug } = useParams();
  const t = useT();
  const all = getArrangements();
  const index = all.findIndex((a) => a.slug === slug);
  const item = index >= 0 ? all[index] : undefined;

  const blocks = useMemo(() => parseBlocks(item?.body ?? null), [item]);
  const embed = useMemo(() => youtubeEmbed(item?.youtubeUrl ?? null), [item]);

  useEffect(() => {
    if (!item) {
      applyMeta({
        title: `${t.arrangementdetail.notFound} — the KJ Studio`,
        description: t.arrangementdetail.notFound,
      });
      return;
    }
    applyMeta({
      title: `${item.title} — the KJ Studio`,
      description: item.note ?? t.arrangements.lede(all.length),
    });
  }, [item, t, all.length]);

  // 없는 slug 는 조용한 목록 폴백 대신 "없다"고 말한다. 빈 목록을 보여주면
  // 방문자는 곡이 사라진 줄 알고, 우리는 깨진 링크를 영원히 모르게 된다.
  if (!item) {
    return (
      <main className={styles.page}>
        <Link className={styles.back} to="/arrangements">
          {t.arrangementdetail.back}
        </Link>
        <p className={styles.notFound}>{t.arrangementdetail.notFound}</p>
      </main>
    );
  }

  const prev = all[index - 1];
  const next = all[index + 1];
  const sell = canSell(item);

  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/arrangements">
        {t.arrangementdetail.back}
      </Link>

      <p className={styles.overline}>
        <span className={styles.badge}>{t.arrangements.status[item.status]}</span>
        {item.genre && <span className={styles.genre}>{item.genre}</span>}
      </p>

      <h1 className={styles.title}>{item.title}</h1>

      {item.originalArtist && (
        <p className={styles.artist}>{item.originalArtist}</p>
      )}

      {(item.keyBpm || item.note) && (
        <dl className={styles.specs}>
          {item.keyBpm && (
            <>
              <dt>{t.arrangementdetail.keyBpm}</dt>
              <dd>{item.keyBpm}</dd>
            </>
          )}
          {item.note && (
            <>
              <dt>{t.arrangementdetail.note}</dt>
              <dd>{item.note}</dd>
            </>
          )}
        </dl>
      )}

      {/*
        악보·구매는 완성된 곡에만. 결제는 사이트가 처리하지 않고 Patreon 쪽으로
        넘긴다 — 새 탭으로 열고 referrer 를 남기지 않는다.
      */}
      {sell && (
        <div className={styles.cta}>
          {item.sheetUrl && (
            <a
              className={styles.ctaPrimary}
              href={item.sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.arrangementdetail.sheetCta} ↗
            </a>
          )}
          {item.purchaseUrl && (
            <a
              className={styles.ctaSecondary}
              href={item.purchaseUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.arrangementdetail.buyCta} ↗
            </a>
          )}
        </div>
      )}

      {blocks.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t.arrangementdetail.noteSection}</h2>
          <div className={styles.prose}><Blocks blocks={blocks} /></div>
        </section>
      )}

      {item.songform && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t.arrangementdetail.songform}</h2>
          <p className={styles.plain}>{item.songform}</p>
        </section>
      )}

      {item.gearSetup && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t.arrangementdetail.gear}</h2>
          <p className={styles.plain}>{item.gearSetup}</p>
        </section>
      )}

      {/* 주소를 알아볼 수 없으면 섹션 자체를 그리지 않는다 — 깨진 iframe 보다 없는 게 낫다 */}
      {embed && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t.arrangementdetail.youtube}</h2>
          <div className={styles.video}>
            <iframe
              src={embed}
              title={`${item.title} — YouTube`}
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {item.behindStory && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t.arrangementdetail.behind}</h2>
          <p className={styles.plain}>{item.behindStory}</p>
        </section>
      )}

      {!sell && (item.sheetUrl || item.purchaseUrl) && (
        <p className={styles.pending}>{t.arrangementdetail.noSheets}</p>
      )}

      <nav className={styles.pager} aria-label={t.arrangementdetail.more}>
        {prev ? (
          <Link to={`/arrangements/${prev.slug}`} className={styles.pagerLink}>
            ← {prev.title}
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`/arrangements/${next.slug}`} className={styles.pagerLink}>
            {next.title} →
          </Link>
        ) : <span />}
      </nav>
    </main>
  );
}
