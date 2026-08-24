import styles from "./SoundCloudPlayer.module.css";

// K_Joon_P 의 SoundCloud 트랙을 사이트 안에서 바로 들려준다.
// 개별 곡 URL 이 아직 없어 프로필 위젯을 임베드한다 — 전체 트랙이 목록으로 뜬다.
const PROFILE = "https://soundcloud.com/user-151964545";

export function SoundCloudPlayer({ title }: { title: string }) {
  const src =
    "https://w.soundcloud.com/player/?url=" +
    encodeURIComponent(PROFILE) +
    "&color=%23c99a4b&auto_play=false&hide_related=true&show_comments=false" +
    "&show_user=true&show_reposts=false&show_teaser=false&visual=false";

  return (
    <div className={styles.wrap}>
      <iframe
        className={styles.frame}
        title={title}
        allow="autoplay"
        loading="lazy"
        src={src}
      />
    </div>
  );
}
