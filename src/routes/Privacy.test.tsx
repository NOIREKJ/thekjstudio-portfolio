import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Privacy } from "./Privacy";
import { LanguageProvider } from "../i18n";
import { PROCESSORS, RETENTION_DAYS, retentionLabel } from "../lib/privacy";

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
const show = () =>
  render(<MemoryRouter><LanguageProvider><Privacy /></LanguageProvider></MemoryRouter>);

test("보유 기간 표기가 상수와 어긋나지 않는다", () => {
  show();
  // 방침 문구와 삭제 자동화가 같은 값을 봐야 한다. 두 곳에 적으면 반드시 어긋나고,
  // 어긋나는 순간 "1년이라 적어 놓고 안 지운다" 가 된다.
  expect(screen.getByText(retentionLabel())).toBeInTheDocument();
});

test("retentionLabel 이 기간을 사람 말로 바꾼다", () => {
  expect(retentionLabel(365)).toBe("1년");
  expect(retentionLabel(730)).toBe("2년");
  expect(retentionLabel(90)).toBe("3개월");
  expect(retentionLabel(45)).toBe("45일");
});

/*
  국외 이전 고지는 빠뜨리기 쉽고, 빠지면 고지 의무를 어긴 채로 폼이 돌아간다.
  수탁자를 하나 추가하고 표에 넣는 걸 잊는 경우를 막는다.
*/
test("위탁받는 곳이 하나도 빠짐없이 표에 있다", () => {
  show();
  expect(PROCESSORS.length).toBeGreaterThan(0);
  for (const p of PROCESSORS) {
    expect(screen.getByText(p.name), `${p.name} 이 표에 없다`).toBeInTheDocument();
  }
});

test("법이 요구하는 항목이 모두 있다", () => {
  show();
  for (const heading of [
    /받는 항목과 목적/, /보유 기간/, /제3자 제공/, /처리 위탁 및 국외 이전/,
    /파기/, /정보주체의 권리/, /안전성 확보조치/, /개인정보 보호책임자/,
    /권익침해 구제/, /방침 변경/,
  ]) {
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  }
});

test("고유식별정보·금융정보는 받지 않는다고 못 박는다", () => {
  show();
  expect(screen.getByText(/고유식별정보와 금융정보는 받지 않습니다/)).toBeInTheDocument();
});

test("보유 기간을 0 이나 음수로 두지 않는다 — 그러면 들어오자마자 지워진다", () => {
  expect(RETENTION_DAYS).toBeGreaterThan(0);
});
