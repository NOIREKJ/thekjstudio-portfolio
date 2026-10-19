import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Home } from "./Home";
import { getFeaturedWorks } from "../lib/works";

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

/*
  히어로의 마퀴는 커버가 흐르는 배경이라 aria-hidden 이고 링크가 없다.
  대표작 구역이 홈에서 작업물로 들어가는 유일한 길이므로, 눌러서 갈 수
  있는지를 본다. 대표작이 몇 개인지는 데이터가 정하는 일이라 세지 않는다.
*/
test("대표작이 켜져 있으면 홈에서 눌러 들어갈 수 있다", () => {
  const featured = getFeaturedWorks();
  renderHome();

  const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
  for (const work of featured) {
    expect(hrefs).toContain(`/work/${work.slug}`);
  }
});

test("연락 경로가 있다", () => {
  renderHome();
  const contact = screen.getAllByRole("link").find((a) =>
    (a.getAttribute("href") ?? "") === "/contact",
  );
  expect(contact).toBeTruthy();
});
