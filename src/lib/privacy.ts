/*
  개인정보 처리 기준 — **방침 문구와 삭제 자동화가 같은 값을 본다.**

  두 곳에 따로 적으면 반드시 어긋나고, 어긋나는 순간 "방침에는 1년이라 적어
  놓고 실제로는 안 지운다" 가 된다. 그건 방침을 어기는 것이다.
*/

/*
  문의 처리가 끝난(won·lost) 뒤 이 기간이 지나면 파기한다.

  ⚠️ **김준님이 확정해야 하는 값이다.** 1년으로 잡은 근거는 교회 예산이 연 단위라
  "올해는 어렵고 내년에" 가 흔하기 때문이다. 더 짧게 잡으면 정당한 후속 연락
  대상을 잃고, 더 길게 잡으면 보관할 이유를 설명하기 어려워진다.
  이 값을 바꾸면 방침 문구와 삭제 작업이 **같이** 따라간다.
*/
export const RETENTION_DAYS = 365;

export const retentionLabel = (days = RETENTION_DAYS): string =>
  days % 365 === 0 ? `${days / 365}년` : days % 30 === 0 ? `${days / 30}개월` : `${days}일`;

/*
  처리를 맡긴 곳. 전부 해외 사업자라 **국외 이전**에 해당한다 —
  방침에 이전받는 자·국가·항목·시점·방법·목적·보유기간을 밝혀야 한다.
*/
export type Processor = {
  name: string; country: string; purpose: string; items: string;
};

export const PROCESSORS: Processor[] = [
  { name: "Vercel Inc.", country: "미국", purpose: "웹사이트 호스팅 및 문의 접수 처리", items: "문의 시 입력한 모든 항목" },
  { name: "Supabase Inc.", country: "미국", purpose: "문의 내용 저장", items: "문의 시 입력한 모든 항목" },
  { name: "Resend (Plus Five Five, Inc.)", country: "미국", purpose: "문의 알림 메일 발송", items: "문의 시 입력한 모든 항목" },
  { name: "Telegram FZ-LLC", country: "아랍에미리트", purpose: "문의 도착 알림", items: "교회명·담당자명·연락처·문의 내용 일부" },
];
