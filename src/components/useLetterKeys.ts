import { useEffect } from "react";

const LETTERS = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];

export function useLetterKeys(
  slugs: string[],
  onPress: (slug: string) => void,
): void {
  useEffect(() => {
    function handle(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.repeat) return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;

      const index = LETTERS.indexOf(event.key.toLowerCase());
      if (index === -1 || index >= slugs.length) return;

      onPress(slugs[index]);
    }

    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [slugs, onPress]);
}
