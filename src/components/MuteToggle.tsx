import styles from "./MuteToggle.module.css";

export function MuteToggle({
  muted,
  onToggle,
}: {
  muted: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={onToggle}
      aria-pressed={muted}
    >
      {muted ? "소리 켜기" : "소리 끄기"}
    </button>
  );
}
