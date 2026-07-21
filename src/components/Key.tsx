import type { Work } from "../lib/works";
import styles from "./Key.module.css";

export function Key({ work, letter, pressed, onPress, onRelease }: {
  work: Work;
  letter?: string;
  pressed: boolean;
  onPress: (slug: string) => void;
  onRelease?: (slug: string) => void;
}) {
  // 건반에는 짧은 이름만 새긴다. 전체 제목은 라벨과 패널의 몫이다.
  const shortTitle = work.title.split(" (")[0];

  return (
    <button
      type="button"
      className={`${styles.key} ${styles[work.kind]}`}
      aria-pressed={pressed}
      aria-label={`${work.title} — ${work.kind} · ${work.year}`}
      onPointerDown={() => onPress(work.slug)}
      onPointerUp={() => onRelease?.(work.slug)}
      onPointerCancel={() => onRelease?.(work.slug)}
      onPointerLeave={() => onRelease?.(work.slug)}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
          event.preventDefault();
          onPress(work.slug);
        }
      }}
      onKeyUp={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onRelease?.(work.slug);
        }
      }}
    >
      {letter && (
        <span className={styles.letter} aria-hidden="true">
          {letter}
        </span>
      )}
      <span className={styles.title}>{shortTitle}</span>
      <span className={styles.meta}>
        {work.kind} · {work.year}
      </span>
    </button>
  );
}
