import { useCallback, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { Keyboard } from "../components/Keyboard";
import { WorkPanel } from "../components/WorkPanel";
import { MuteToggle } from "../components/MuteToggle";
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

      <div className={styles.intro}>
        <h1 className={styles.headline}>음악을 쓰고 앱을 만듭니다.</h1>
        <p className={styles.hint}>아래를 눌러보세요. 여러 개를 같이 눌러도 됩니다.</p>
      </div>

      <Keyboard works={works} selected={selected} onPress={press} />

      {selectedWork && <WorkPanel work={selectedWork} />}

      <nav className={styles.nav}>
        <Link to="/about">소개</Link>
      </nav>
    </main>
  );
}
