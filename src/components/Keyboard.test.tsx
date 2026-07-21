import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Keyboard } from "./Keyboard";
import type { Work } from "../lib/works";

const works: Work[] = [
  { slug: "noire", title: "NOIRE", kind: "app", note: "E4", year: 2026, images: [], body: "본문 N" },
  { slug: "consolation", title: "위로", kind: "music", note: "C4", year: 2024, images: [], body: "본문 C" },
];

test("작업물마다 건반을 하나씩 그린다", () => {
  render(<Keyboard works={works} selected={null} onPress={() => {}} />);
  expect(screen.getAllByRole("button")).toHaveLength(2);
});

test("건반에 작업물 제목이 접근 가능한 이름으로 붙는다", () => {
  render(<Keyboard works={works} selected={null} onPress={() => {}} />);
  expect(screen.getByRole("button", { name: /NOIRE/ })).toBeInTheDocument();
});

test("클릭하면 slug와 함께 onPress가 불린다", async () => {
  const onPress = vi.fn();
  render(<Keyboard works={works} selected={null} onPress={onPress} />);
  await userEvent.click(screen.getByRole("button", { name: /NOIRE/ }));
  expect(onPress).toHaveBeenCalledWith("noire");
});

test("Enter로도 누를 수 있다", async () => {
  const onPress = vi.fn();
  render(<Keyboard works={works} selected={null} onPress={onPress} />);
  screen.getByRole("button", { name: /NOIRE/ }).focus();
  await userEvent.keyboard("{Enter}");
  expect(onPress).toHaveBeenCalledWith("noire");
});

test("선택된 건반만 aria-pressed가 참이다", () => {
  render(<Keyboard works={works} selected="noire" onPress={() => {}} />);
  expect(screen.getByRole("button", { name: /NOIRE/ })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: /위로/ })).toHaveAttribute("aria-pressed", "false");
});

test("종류를 눈으로만이 아니라 텍스트로도 알 수 있다", () => {
  render(<Keyboard works={works} selected={null} onPress={() => {}} />);
  expect(screen.getByRole("button", { name: /NOIRE/ })).toHaveTextContent("app");
});
