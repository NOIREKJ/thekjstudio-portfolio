import { useEffect } from "react";

const LETTERS = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];

function slugForEvent(event: KeyboardEvent, slugs: string[]): string | null {
  if (event.metaKey || event.ctrlKey || event.altKey) return null;

  const target = event.target as HTMLElement | null;
  const tag = target?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return null;

  const index = LETTERS.indexOf(event.key.toLowerCase());
  if (index === -1 || index >= slugs.length) return null;

  return slugs[index];
}

export function useLetterKeys(
  slugs: string[],
  onPress: (slug: string) => void,
  onRelease?: (slug: string) => void,
): void {
  useEffect(() => {
    function handleDown(event: KeyboardEvent) {
      if (event.repeat) return;
      const slug = slugForEvent(event, slugs);
      if (slug) onPress(slug);
    }

    function handleUp(event: KeyboardEvent) {
      const slug = slugForEvent(event, slugs);
      if (slug) onRelease?.(slug);
    }

    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);
    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
    };
  }, [slugs, onPress, onRelease]);
}
