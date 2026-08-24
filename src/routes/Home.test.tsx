import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Home } from "./Home";

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

// 콘텐츠 하드코딩 금지 — 구조·경로로 검증(Phase B 교훈).

test("히어로 제목이 있다", () => {
  renderHome();
  expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
});

test("세 기둥(작업·스튜디오·컬렉션)으로 가는 링크가 있다", () => {
  renderHome();
  const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
  expect(hrefs).toContain("/work");
  expect(hrefs).toContain("/studio");
  expect(hrefs).toContain("/collection");
});

test("연락 경로가 있다", () => {
  renderHome();
  const contact = screen.getAllByRole("link").find((a) =>
    (a.getAttribute("href") ?? "") === "/contact",
  );
  expect(contact).toBeTruthy();
});
