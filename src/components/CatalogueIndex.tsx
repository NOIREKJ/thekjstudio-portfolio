import { useState } from "react";
import { Link } from "react-router";
import type { Work } from "../lib/works";
import { useT } from "../i18n";
import styles from "./CatalogueIndex.module.css";

/*
  작업물을 카드가 아니라 카탈로그의 '줄'로 세운다.

  카드 격자는 커버가 있는 작업물에만 공평하다 — 커버 없는 항목은 빈 사각형이
  되어 덜 만든 것처럼 보인다. 지금 아홉 중 셋이 커버가 없다. 줄로 세우면
  번호·제목·연도·종류가 본문이고 커버는 곁들이라, 커버 유무가 위계를 바꾸지
  않는다. 곡과 앱을 같은 격으로 두려는 것도 같은 이유다.

  커버는 마우스를 올린 줄만 떠오른다(포인터가 있는 기기에서만). 손가락
  기기에서는 hover 가 없으므로 줄 자체로 완결되어야 한다.
*/
export function CatalogueIndex({ works }: { works: Work[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [previewY, setPreviewY] = useState<number | null>(null);
  const t = useT();
  const active = works.find((w) => w.slug === hovered);

  // 미리보기가 설 높이를 줄에서 직접 읽는다 — 줄 높이가 제목 길이에 따라
  // 달라지므로 번호로 계산하면 어긋난다.
  const follow = (slug: string) => (event: { currentTarget: HTMLElement }) => {
    const row = event.currentTarget;
    const list = row.closest("ol");
    if (list) setPreviewY(row.offsetTop - list.offsetTop + row.offsetHeight / 2);
    setHovered(slug);
  };

  return (
    <div className={styles.wrap}>
      <ol className={styles.list} onMouseLeave={() => setHovered(null)}>
        {works.map((work, index) => (
          <li key={work.slug}>
            <Link
              to={`/work/${work.slug}`}
              className={styles.row}
              onMouseEnter={follow(work.slug)}
              onFocus={follow(work.slug)}
            >
              <span className={styles.no}>{String(index + 1).padStart(2, "0")}</span>
              <span className={styles.title}>{work.title}</span>
              <span className={styles.kind}>
                {work.kind === "music" ? t.workcard.music : t.workcard.app}
              </span>
              <span className={styles.year}>{work.year}</span>
            </Link>
          </li>
        ))}
      </ol>

      {/*
        따라다니는 미리보기. 장식이라 aria-hidden 이고, 줄에 이미 같은
        정보가 글자로 있다. 커버가 없는 작업물이면 아무것도 띄우지 않는다 —
        빈 액자를 띄우면 그 작업물만 모자라 보인다.
      */}
      <div
        className={styles.preview}
        aria-hidden="true"
        style={previewY === null ? undefined : { ["--preview-y" as string]: `${previewY}px` }}
      >
        {active?.cover && <img src={active.cover} alt="" />}
      </div>
    </div>
  );
}
