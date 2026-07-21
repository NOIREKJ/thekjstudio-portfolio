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
      onClick={onToggle}
      aria-pressed={muted}
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        padding: "8px 14px",
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,.15)",
        background: "rgba(255,255,255,.85)",
        cursor: "pointer",
        fontSize: 13,
      }}
    >
      {muted ? "소리 켜기" : "소리 끄기"}
    </button>
  );
}
