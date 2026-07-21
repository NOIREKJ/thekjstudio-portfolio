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
