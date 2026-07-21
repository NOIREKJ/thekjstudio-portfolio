import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard } from "../components/Keyboard";
import { WorkPanel } from "../components/WorkPanel";
import { MuteToggle } from "../components/MuteToggle";
import { LocalTime } from "../components/LocalTime";
import { Vinyl } from "../components/Vinyl";
import { createAudioEngine } from "../audio/engine";
import { getWorks } from "../lib/works";
import { applyMeta } from "../lib/meta";
import styles from "./Home.module.css";

export function Home() {
  const works = useMemo(() => getWorks(), []);

  useEffect(() => {
    applyMeta({
      title: "the KJ Studio — 음악을 쓰고, 앱을 만듭니다",
      description:
        "작곡가이자 앱 개발자 Joon Kim의 개인 사이트. 건반을 누르면 소리가 나고 작업이 열립니다.",
      image: "/images/projects/noire/horizontal-kj-01.png",
    });
  }, []);
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

  const release = useCallback((slug: string) => {
    engineRef.current?.release(slug);
  }, []);

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

      <div className={styles.heroVinyl}>
        <Vinyl size={560} duration="46s" label={"K_Joon_P\n— Op.05 —"} />
      </div>

      <header className={styles.intro}>
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
        <Keyboard works={works} selected={selected} onPress={press} onRelease={release} />
      </div>

      <WorkPanel work={selectedWork} spinning={!muted} />
    </main>
  );
}
