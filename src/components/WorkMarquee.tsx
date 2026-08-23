import { getWorks } from "../lib/works";
import styles from "./WorkMarquee.module.css";

// 작업물 커버(앱 아이콘·앨범 아트)가 흐르는 가로 마퀴 한 줄.
// 홈 히어로의 배경 '벽'으로 두 줄을 반대 방향으로 겹쳐 쓴다.
// 배경 장식이라 링크 없이 aria-hidden 으로 둔다 — 접근성 텍스트는 히어로가 쥔다.
export function WorkMarquee({ reverse = false }: { reverse?: boolean }) {
  const works = getWorks().filter((w) => w.cover);
  if (works.length === 0) return null;

  const row = reverse ? [...works].reverse() : works;
  // -50% 로 끊김 없이 순환하려면 콘텐츠가 동일한 두 벌이어야 한다.
  // 작업물이 6개뿐이라 한 벌을 넉넉히 늘려(2배) 넓은 화면도 채운다.
  const half = [...row, ...row];
  const loop = [...half, ...half];

  return (
    <div className={styles.wrap} aria-hidden="true">
      <div className={`${styles.track} ${reverse ? styles.reverse : ""}`}>
        {loop.map((w, i) => (
          <span key={`${w.slug}-${i}`} className={styles.item}>
            <img src={w.cover as string} alt="" loading="lazy" />
          </span>
        ))}
      </div>
    </div>
  );
}
