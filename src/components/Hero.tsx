import { useT } from "../i18n";
import { WorkMarquee } from "./WorkMarquee";
import styles from "./Hero.module.css";

// 홈 히어로 — 사진 대신 작업물(앱 아이콘·앨범 아트)이 흐르는 '벽'을 배경으로 깔고
// 그 위에 정체성 텍스트를 얹는다. 벡터/데이터 기반이라 해상도가 깨지지 않고,
// 히어로가 곧 포트폴리오 미리보기가 된다. (컬렉션 LP 마퀴와 톤을 잇는다.)
export function Hero() {
  const t = useT();
  return (
    <header className={styles.hero}>
      <div className={styles.wall}>
        <WorkMarquee />
        <WorkMarquee reverse />
        <WorkMarquee />
      </div>
      <div className={styles.scrim} />
      <div className={styles.inner}>
        <p className={styles.eyebrow}>the KJ Studio</p>
        <h1 className={styles.headline}>
          {t.hero.l1}<br />{t.hero.l2}<span className={styles.dot}>.</span>
        </h1>
        <p className={styles.sub}>{t.hero.sub}</p>
      </div>
    </header>
  );
}
