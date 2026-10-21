import type { Work } from "../lib/works";
import { WorkCard } from "./WorkCard";
import styles from "./WorkGrid.module.css";

// className 은 쓰는 쪽이 열 수를 조정할 자리다 — 홈의 대표작은 /work 목록과
// 개수가 달라서 같은 3열에 두면 마지막 한 장이 혼자 다음 줄로 떨어진다.
export function WorkGrid({ works, className = "" }: { works: Work[]; className?: string }) {
  return (
    <div className={`${styles.grid} ${className}`.trim()}>
      {works.map((w) => (
        <WorkCard key={w.slug} work={w} />
      ))}
    </div>
  );
}
