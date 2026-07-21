import { useCallback, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { Keyboard } from "../components/Keyboard";
import { WorkPanel } from "../components/WorkPanel";
import { WorkIndex } from "../components/WorkIndex";
import { MuteToggle } from "../components/MuteToggle";
import { Marquee } from "../components/Marquee";
import { LocalTime } from "../components/LocalTime";
import { Vinyl } from "../components/Vinyl";
import { createAudioEngine } from "../audio/engine";
import { getWorks } from "../lib/works";
import styles from "./Home.module.css";

export function Home() {
  const works = useMemo(() => getWorks(), []);
  const [selected, setSelected] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const engineRef = useRef<ReturnType<typeof createAudioEngine> | null>(null);

  const press = useCallback(
    (slug: string) => {
      // 화면은 소리와 무관하게 항상 반응한다.
      setSelected(slug);

      void (async () => {
        try {
          if (!engineRef.current) {
            const engine = createAudioEngine();
            await engine.unlock();
            await engine.preload(
              works.map((w) => ({ id: w.slug, note: w.note, sound: w.sound })),
            );
            engine.setMuted(muted);
            engineRef.current = engine;
          }
          engineRef.current.play(slug);
        } catch {
          // 오디오를 못 쓰는 환경(자동재생 차단, jsdom, 미지원 브라우저)에서도
          // 사이트는 온전히 동작해야 한다. 조용히 넘어간다.
        }
      })();
    },
    [works, muted],
  );

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      engineRef.current?.setMuted(next);
      return next;
    });
  }, []);

  const selectedWork = works.find((w) => w.slug === selected) ?? null;

  return (
    <main className={styles.page}>
      <MuteToggle muted={muted} onToggle={toggleMute} />

      <header className={styles.intro}>
        <div className={styles.heroVinyl}>
          <Vinyl size={560} duration="46s" label={"K_Joon_P\n— Op.05 —"} />
        </div>
        <div className={styles.heroGrid}>
          <div>
            <p className={styles.overline}>Composer · App Developer</p>
            <h1 className={styles.headline}>
              the KJ
              <br />
              <em>Studio</em>
              <span className={styles.dot}>.</span>
            </h1>
          </div>

          <dl className={styles.facts}>
            <div className={styles.fact}>
              <dt>Base</dt>
              <dd>Seoul, KR</dd>
            </div>
            <div className={styles.fact}>
              <dt>Local</dt>
              <dd>
                <LocalTime />
              </dd>
            </div>
            <div className={styles.fact}>
              <dt>Works</dt>
              <dd>Op. 01 — 05</dd>
            </div>
          </dl>
        </div>

        <p className={styles.sub}>음악을 쓰고, 앱을 만듭니다.</p>
        <p className={styles.hint}>건반을 눌러보세요 — 같이 누르면 화음이 됩니다</p>
      </header>

      <div className={styles.stage}>
        <Keyboard works={works} selected={selected} onPress={press} />
      </div>

      {selectedWork && <WorkPanel work={selectedWork} spinning={!muted} />}

      <Marquee text="음악을 쓰고, 앱을 만듭니다 — Composing &amp; Building, Seoul" />

      <WorkIndex works={works} />

      <section className={styles.about} aria-label="소개 미리보기">
        <p className={styles.aboutOverline}>About — 소개</p>
        <p className={styles.aboutBody}>
          서울에서 음악을 쓰고 앱을 만듭니다. 두 가지를 따로 하는 것처럼
          보이지만, 하는 일은 같습니다 — 누군가의 하루를 조금 덜 힘들게
          만드는 것. 곡은 K_Joon_P라는 이름으로 냅니다.
        </p>
        <Link to="/about" className={styles.aboutLink}>
          소개 더 보기 →
        </Link>
      </section>
    </main>
  );
}
