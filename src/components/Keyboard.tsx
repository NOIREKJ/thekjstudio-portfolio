import { useMemo } from "react";
import type { Work } from "../lib/works";
import { Key } from "./Key";
import { useLetterKeys } from "./useLetterKeys";
import styles from "./Keyboard.module.css";

const LETTERS = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];

type Props = {
  works: Work[];
  selected: string | null;
  onPress: (slug: string) => void;
  onRelease?: (slug: string) => void;
};

export function Keyboard({ works, selected, onPress, onRelease }: Props) {
  const slugs = useMemo(() => works.map((w) => w.slug), [works]);
  useLetterKeys(slugs, onPress, onRelease);

  return (
    <div className={styles.keyboard} role="group" aria-label="작업물 건반">
      {works.map((work, index) => (
        <Key
          key={work.slug}
          work={work}
          letter={LETTERS[index]}
          pressed={selected === work.slug}
          onPress={onPress}
          onRelease={onRelease}
        />
      ))}
    </div>
  );
}
