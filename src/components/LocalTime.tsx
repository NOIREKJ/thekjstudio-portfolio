import { useEffect, useState } from "react";

/* 서울의 지금 — 사이트가 살아있다는 가장 작은 증거 */
export function LocalTime() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <time dateTime={now.toISOString()}>
      {now.toLocaleTimeString("ko-KR", {
        hour12: false,
        timeZone: "Asia/Seoul",
      })}{" "}
      KST
    </time>
  );
}
