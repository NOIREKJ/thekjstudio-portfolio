import { fireEvent, render } from "@testing-library/react";
import { useLetterKeys } from "./useLetterKeys";

function Harness({ onPress }: { onPress: (slug: string) => void }) {
  useLetterKeys(["consolation", "streetlight", "noire"], onPress);
  return <input aria-label="입력칸" />;
}

test("a s d 가 순서대로 건반에 대응한다", () => {
  const onPress = vi.fn();
  render(<Harness onPress={onPress} />);
  fireEvent.keyDown(window, { key: "a" });
  fireEvent.keyDown(window, { key: "d" });
  expect(onPress).toHaveBeenNthCalledWith(1, "consolation");
  expect(onPress).toHaveBeenNthCalledWith(2, "noire");
});

test("배정되지 않은 글자는 무시한다", () => {
  const onPress = vi.fn();
  render(<Harness onPress={onPress} />);
  fireEvent.keyDown(window, { key: "z" });
  expect(onPress).not.toHaveBeenCalled();
});

test("수식키를 누른 조합은 무시한다 (브라우저 단축키 보호)", () => {
  const onPress = vi.fn();
  render(<Harness onPress={onPress} />);
  fireEvent.keyDown(window, { key: "a", metaKey: true });
  fireEvent.keyDown(window, { key: "a", ctrlKey: true });
  expect(onPress).not.toHaveBeenCalled();
});

test("입력칸에 포커스가 있으면 무시한다", () => {
  const onPress = vi.fn();
  const { getByLabelText } = render(<Harness onPress={onPress} />);
  const input = getByLabelText("입력칸");
  input.focus();
  fireEvent.keyDown(input, { key: "a" });
  expect(onPress).not.toHaveBeenCalled();
});

test("길게 눌러 생기는 반복 입력은 무시한다", () => {
  const onPress = vi.fn();
  render(<Harness onPress={onPress} />);
  fireEvent.keyDown(window, { key: "a", repeat: true });
  expect(onPress).not.toHaveBeenCalled();
});
