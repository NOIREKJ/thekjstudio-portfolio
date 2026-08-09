import { rackFace } from "./rackFace";
import type { Gear } from "./gear";

const g = (name: string): Gear => ({ id: name, name, category: "", sortOrder: 0, rackU: 0, rackMounted: true });

test("컴프·채널스트립은 VU", () => {
  expect(rackFace(g("SSL Fusion"))).toBe("vu");
  expect(rackFace(g("SSL The Bus+"))).toBe("vu");
  expect(rackFace(g("Avalon VT-737SP"))).toBe("vu");
});

test("인터페이스·컨버터는 LED", () => {
  expect(rackFace(g("Universal Audio Apollo Twin X"))).toBe("leds");
  expect(rackFace(g("Apogee AD-8000"))).toBe("leds");
});

test("신스 음원 모듈은 디스플레이", () => {
  expect(rackFace(g("Yamaha Motif Rack"))).toBe("display");
  expect(rackFace(g("Roland JV-2080"))).toBe("display");
  expect(rackFace(g("E-mu Proteus 2000"))).toBe("display");
});

test("그 외는 노브", () => {
  expect(rackFace(g("Something Else"))).toBe("knobs");
});
