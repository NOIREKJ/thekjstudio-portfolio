import type { ListenLink } from "../lib/works";
import { SoundCloudPlayer } from "./SoundCloudPlayer";
import styles from "./TrackEmbed.module.css";

// 곡의 링크 중 '개별 트랙'으로 임베드 가능한 것을 찾아 정확한 플레이어를 띄운다.
// (프로필/채널 링크는 임베드 안 되므로 건너뛰고, 아무 것도 없으면 SoundCloud 로 폴백.)

function spotify(url: string): string | null {
  const m = url.match(/open\.spotify\.com\/(track|album|playlist|episode)\/([A-Za-z0-9]+)/);
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null;
}
function apple(url: string): string | null {
  // 앨범/곡 페이지만 (프로필 /profile/ 은 제외)
  if (!/music\.apple\.com\/[^/]+\/(album|song)\//.test(url)) return null;
  return url.replace("music.apple.com", "embed.music.apple.com");
}
function youtube(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export function TrackEmbed({ links, title }: { links: ListenLink[]; title: string }) {
  const urls = links.map((l) => l.url);

  for (const u of urls) {
    const s = spotify(u);
    if (s) return (
      <iframe className={styles.spotify} src={s} title={title} loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />
    );
  }
  for (const u of urls) {
    const a = apple(u);
    if (a) return (
      <iframe className={styles.apple} src={a} title={title} loading="lazy"
        allow="autoplay *; encrypted-media *;" />
    );
  }
  for (const u of urls) {
    const y = youtube(u);
    if (y) return (
      <div className={styles.video}>
        <iframe src={y} title={title} loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen />
      </div>
    );
  }
  return <SoundCloudPlayer title={title} />;
}
