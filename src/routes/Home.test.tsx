import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Home } from "./Home";
import { getWorks } from "../lib/works";

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

// 콘텐츠 하드코딩 금지 — 특정 제목이 아니라 구조·개수로 검증(Phase B 교훈).

test("히어로 제목이 있다", () => {
  renderHome();
  expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
});

test("작업물 카드가 데이터 수만큼 상세로 링크된다", () => {
  renderHome();
  const count = getWorks().length;
  const links = screen.getAllByRole("link").filter((a) =>
    (a.getAttribute("href") ?? "").startsWith("/work/"),
  );
  expect(links).toHaveLength(count);
});

test("스튜디오·컬렉션 티저로 가는 링크가 있다", () => {
  renderHome();
  const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
  expect(hrefs).toContain("/studio");
  expect(hrefs).toContain("/collection");
});

test("연락 경로가 있다", () => {
  renderHome();
  const mail = screen.getAllByRole("link").find((a) =>
    (a.getAttribute("href") ?? "").startsWith("mailto:"),
  );
  expect(mail).toBeTruthy();
});
