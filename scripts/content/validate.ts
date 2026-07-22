/*
  건반은 하나의 5음 음계 안에서만 성립한다. 아무렇게나 눌러도 불협이 되지 않는 것이
  이 사이트의 핵심 장치이므로 음을 임의로 늘릴 수 없다.

  DB 제약이 아니라 빌드 검사로 두는 이유: 앱에서 여덟 번째를 켜는 순간
  실패해야 할 것은 앱의 저장이 아니라 사이트의 배포다.
*/
export const PENTATONIC = ["C4", "D4", "E4", "G4", "A4", "C5", "D5"] as const;

export type FeaturedCheck = {
  slug: string;
  note: string | null;
  featured: boolean;
};

export function validateFeatured(items: FeaturedCheck[]): void {
  const featured = items.filter((i) => i.featured);

  if (featured.length > PENTATONIC.length) {
    throw new Error(
      `건반은 최대 7개입니다. 지금 ${featured.length}개가 켜져 있습니다: ` +
        featured.map((i) => i.slug).join(", "),
    );
  }

  const noteless = featured.filter((i) => !i.note);
  if (noteless.length > 0) {
    throw new Error(
      `건반이 되려면 음이 있어야 합니다. 음이 없는 항목: ` +
        noteless.map((i) => i.slug).join(", "),
    );
  }

  const allowed: readonly string[] = PENTATONIC;
  const outside = featured.filter((i) => !allowed.includes(i.note!));
  if (outside.length > 0) {
    throw new Error(
      `5음 음계(${PENTATONIC.join(" ")}) 밖의 음입니다: ` +
        outside.map((i) => `${i.slug}=${i.note}`).join(", "),
    );
  }

  const byNote = new Map<string, string[]>();
  for (const item of featured) {
    const slugs = byNote.get(item.note!) ?? [];
    slugs.push(item.slug);
    byNote.set(item.note!, slugs);
  }
  const collisions = [...byNote.entries()].filter(([, slugs]) => slugs.length > 1);
  if (collisions.length > 0) {
    throw new Error(
      `음이 겹칩니다: ` +
        collisions.map(([note, slugs]) => `${note} — ${slugs.join(", ")}`).join(" / "),
    );
  }
}
