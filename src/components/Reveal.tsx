import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./Reveal.module.css";

// 스크롤 진입 시 한 번 페이드업. reduced-motion 이면 CSS 가 즉시 보이게 처리.
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // IntersectionObserver 없으면(테스트·구형) 즉시 표시.
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${styles.reveal} ${shown ? styles.in : ""} ${className ?? ""}`}>
      {children}
    </div>
  );
}
