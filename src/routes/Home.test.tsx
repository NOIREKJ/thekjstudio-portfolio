import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { Home } from "./Home";

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

test("소리가 없어도 모든 건반이 보인다", () => {
  renderHome();
  expect(screen.getAllByRole("button", { name: /·/ }).length).toBeGreaterThanOrEqual(5);
});

test("건반을 누르면 패널이 열린다", async () => {
  renderHome();
  await userEvent.click(screen.getByRole("button", { name: /NOIRE/ }));
  expect(screen.getByRole("link", { name: /자세히 보기/ })).toBeInTheDocument();
});

test("음소거 토글이 항상 있다", () => {
  renderHome();
  expect(screen.getByRole("button", { name: /소리/ })).toBeInTheDocument();
});

test("건반 아래에 작업 목록이 있다 — 건반을 못 쓰는 사람의 두 번째 통로", () => {
  renderHome();
  const workLinks = screen
    .getAllByRole("link")
    .filter((link) => link.getAttribute("href")?.startsWith("/work/"));
  expect(workLinks).toHaveLength(5);
});

test("소개 미리보기가 있다", () => {
  renderHome();
  expect(screen.getByRole("link", { name: /소개 더 보기/ })).toBeInTheDocument();
});
