import { noteToFrequency } from "./note";

test("A4는 440Hz다", () => {
  expect(noteToFrequency("A4")).toBeCloseTo(440, 5);
});

test("한 옥타브 위는 두 배다", () => {
  expect(noteToFrequency("A5")).toBeCloseTo(880, 5);
});

test("5음 음계의 음들을 변환한다", () => {
  expect(noteToFrequency("C4")).toBeCloseTo(261.626, 2);
  expect(noteToFrequency("D4")).toBeCloseTo(293.665, 2);
  expect(noteToFrequency("E4")).toBeCloseTo(329.628, 2);
  expect(noteToFrequency("G4")).toBeCloseTo(391.995, 2);
});

test("올림표를 처리한다", () => {
  expect(noteToFrequency("F#4")).toBeCloseTo(369.994, 2);
});

test("알 수 없는 음이름은 실패한다", () => {
  expect(() => noteToFrequency("H9")).toThrow(/H9/);
});
