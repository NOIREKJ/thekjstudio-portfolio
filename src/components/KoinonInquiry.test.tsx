import { render, screen } from "@testing-library/react";
import { KoinonInquiry } from "./KoinonInquiry";
import { LanguageProvider, STR } from "../i18n";

// jsdom 의 navigator.language 는 en 이라 기본이 영어로 잡힌다. 한국어로 고정한다.
beforeEach(() => localStorage.setItem("lang", "ko"));
const show = () => render(<LanguageProvider><KoinonInquiry /></LanguageProvider>);
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
  expect(consent).toMatch(/보관|삭제/);
});

test("예산을 묻지 않는다 — 가격을 말하지 않으면서 예산을 묻는 건 앞뒤가 안 맞는다", () => {
  show();
  for (const word of ["예산", "요금"]) {
    expect(screen.queryByText(new RegExp(word))).toBeNull();
  }
});
