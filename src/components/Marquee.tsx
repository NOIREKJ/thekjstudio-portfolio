import styles from "./Marquee.module.css";

/*
  흐르는 띠. 두 벌을 이어 붙여 -50%까지 밀면 이음새 없이 돈다.
  두 번째 벌은 장식이므로 스크린리더에게 숨긴다.
*/
export function Marquee({ text }: { text: string }) {
  const strip = `${text} ✦ `.repeat(4);

  return (
    <div className={styles.marquee} aria-label={text}>
      <div className={styles.track}>
        <span>{strip}</span>
        <span aria-hidden="true">{strip}</span>
      </div>
    </div>
  );
}
