import { render, screen } from "@testing-library/react";
import { KoinonInquiry } from "./KoinonInquiry";
import { MemoryRouter } from "react-router";
import { LanguageProvider, STR } from "../i18n";

/*
  언어 고정 — localStorage 를 쓰지 않는다.

  ⚠️ 빌드 환경(Vercel)의 Node 에는 실험적 `localStorage` 전역이 있는데 값이
  undefined 이고, 그게 jsdom 의 window.localStorage 를 가린다. 그래서
  `localStorage.setItem(...)` 이 "Cannot read properties of undefined" 로
  터졌다 — 내 맥에서는 jsdom 것이 잡혀 통과했고 CI 에서만 깨졌다.

  i18n 은 저장된 언어 → navigator.language 순으로 보므로, 저장분을 지우고
  navigator 로 고정하면 두 환경에서 똑같이 동작한다.
*/
beforeEach(() => {
  try {
    window.localStorage.removeItem("lang");
  } catch {
    /* localStorage 가 없는 환경일 수 있다 — 없으면 저장분도 없다 */
  }
  Object.defineProperty(window.navigator, "language", { value: "ko", configurable: true });
});
// 동의 문구 옆 방침 링크가 <Link> 라 라우터 컨텍스트가 필요하다.
const show = () =>
  render(<MemoryRouter><LanguageProvider><KoinonInquiry /></LanguageProvider></MemoryRouter>);
const ko = STR.ko.koinon;

/*
  톤 규칙은 김준님이 두 번 지시한 것이고 문구는 i18n 에 흩어져 있어, 나중에
  다듬다가 조용히 깨지기 쉽다. 그래서 테스트로 못 박는다.

  - "무료 파일럿" 이라는 표현을 쓰지 않는다 (유료 요금제 모델이다)
  - 요금제가 미확정이라 금액·모집 인원을 노출하지 않는다
*/
const BANNED = [
  "무료 파일럿", "무료파일럿", "free pilot", "Free Pilot",
  "무료 체험", "베타 테스터", "선착순",
];

test("금지된 표현이 코이논 문구에 없다", () => {
  for (const [lang, d] of Object.entries(STR)) {
    const text = JSON.stringify(d.koinon);
    for (const bad of BANNED) {
      expect(text, `${lang} 에 "${bad}" 가 들어 있다`).not.toContain(bad);
    }
  }
});

/*
  교인 수 **구간**은 물어봐도 된다 — 그건 교회의 규모이고 모집 인원이 아니다.
  막는 것은 금액과 "N개 교회 모집" 같은 모집 수다.
*/
test("금액이나 모집 인원이 문구에 없다", () => {
  for (const [lang, d] of Object.entries(STR)) {
    const text = JSON.stringify(d.koinon);
    expect(text, `${lang}: 원화 금액`).not.toMatch(/[0-9][0-9,]*\s*(원|만원)\b/);
    expect(text, `${lang}: 달러 금액`).not.toMatch(/\$\s?[0-9]/);
    expect(text, `${lang}: 월 요금`).not.toMatch(/월\s*[0-9]+\s*(원|만)/);
    expect(text, `${lang}: 모집 교회 수`).not.toMatch(/[0-9]+\s*개?\s*교회\s*(모집|한정|선정)/);
  }
});

/* ── 폼이 실제로 서는지 ───────────────────────────────────────────────── */

test("필수 칸과 동의가 다 차야 제출이 열린다", async () => {
  const { default: userEvent } = await import("@testing-library/user-event");
  const user = userEvent.setup();
  show();

  const button = screen.getByRole("button", { name: ko.f.submit });
  expect(button).toBeDisabled();

  await user.type(screen.getByLabelText(ko.f.church), "한일교회");
  await user.type(screen.getByLabelText(ko.f.person), "김준");
  await user.type(screen.getByLabelText(ko.f.contact), "kj@example.com");
  // 동의 전에는 잠겨 있어야 한다 — 개인정보를 동의 없이 받지 않는다.
  expect(button).toBeDisabled();

  await user.click(screen.getByRole("checkbox"));
  expect(button).toBeEnabled();
});

test("동의 문구에 수집 항목과 보유 기간이 적혀 있다", () => {
  show();
  const consent = screen.getByRole("checkbox").closest("label")?.textContent ?? "";
  expect(consent).toContain("교회명");
  expect(consent).toContain("연락처");
  expect(consent).toMatch(/파기|삭제|보관/);
  // 해외 사업자를 거친다는 사실도 밝혀야 한다(국외 이전).
  expect(consent).toMatch(/해외|국외/);
});

test("예산을 묻지 않는다 — 가격을 말하지 않으면서 예산을 묻는 건 앞뒤가 안 맞는다", () => {
  show();
  for (const word of ["예산", "요금"]) {
    expect(screen.queryByText(new RegExp(word))).toBeNull();
  }
});

/*
  카드뉴스는 사이트 코드가 아니라 public 의 정적 파일이라 i18n 검사에 안 걸린다.
  같은 톤 규칙이 걸려 있으므로 파일을 직접 훑는다 — 인스타에 올라가는 순간
  되돌리기 어려운 쪽이라 오히려 더 조여야 한다.
*/
test("카드뉴스에도 금지된 표현과 금액이 없다", async () => {
  const { readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const html = await readFile(join(process.cwd(), "public/marketing/koinon-cards.html"), "utf8");

  expect(html).toContain("KOINON"); // 파일을 제대로 읽었는지

  // 주석에는 규칙 자체가 적혀 있으므로(= 금지어가 등장한다) 떼고 본다.
  const body = html.replace(/<!--[\s\S]*?-->/g, "");

  for (const bad of [...BANNED, "현역 군인", "군인"]) {
    expect(body, `카드뉴스에 "${bad}" 가 들어 있다`).not.toContain(bad);
  }
  expect(body).not.toMatch(/[0-9][0-9,]*\s*(원|만원)\b/);
  expect(body).not.toMatch(/\$\s?[0-9]/);
  expect(body).not.toMatch(/[0-9]+\s*개?\s*교회\s*(모집|한정|선정)/);
});
