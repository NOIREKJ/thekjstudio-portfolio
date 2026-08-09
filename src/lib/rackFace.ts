import type { Gear } from "./gear";

export type Face = "vu" | "leds" | "display" | "knobs";

// 장비 이름으로 랙 유닛의 '앞판 성격'을 고른다 — 사진 없이 CSS 로 실물감을 준다.
// vu: 채널스트립·컴프(아날로그 VU) · leds: 인터페이스·컨버터(레벨 LED)
// display: 신스 음원 모듈(LCD) · knobs: 그 외(노브 줄)
export function rackFace(gear: Gear): Face {
  const n = gear.name.toLowerCase();
  if (n.includes("fusion") || n.includes("bus") || n.includes("737") || n.includes("avalon")) return "vu";
  if (n.includes("apollo") || n.includes("apogee") || n.includes("ad-8000") || n.includes("converter")) return "leds";
  if (n.includes("motif") || n.includes("jv-") || n.includes("proteus") || n.includes("e-mu") || n.includes("emu") || n.includes("module")) return "display";
  return "knobs";
}
