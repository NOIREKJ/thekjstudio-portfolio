import type { Work } from "../lib/works";
import styles from "./Key.module.css";

type Props = {
  work: Work;
  letter?: string;
  pressed: boolean;
  onPress: (slug: string) => void;
};

export function Key({ work, letter, pressed, onPress }: Props) {
  return (
    <button
      type="button"
      className={`${styles.key} ${styles[work.kind]}`}
      aria-pressed={pressed}
      onPointerDown={() => onPress(work.slug)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onPress(work.slug);
        }
      }}
    >
      {letter && (
        <span className={styles.letter} aria-hidden="true">
          {letter}
        </span>
      )}
      <span className={styles.title}>{work.title}</span>
      <span className={styles.meta}>
        {work.kind} · {work.year}
      </span>
    </button>
  );
}
