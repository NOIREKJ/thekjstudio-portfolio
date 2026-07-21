const SEMITONES: Record<string, number> = {
  C: -9, "C#": -8, D: -7, "D#": -6, E: -5, F: -4,
  "F#": -3, G: -2, "G#": -1, A: 0, "A#": 1, B: 2,
};

const PATTERN = /^([A-G]#?)(-?\d)$/;
const A4 = 440;

export function noteToFrequency(note: string): number {
  const match = note.match(PATTERN);
  if (!match) throw new Error(`알 수 없는 음이름입니다: ${note}`);

  const [, name, octave] = match;
  const semitonesFromA4 = SEMITONES[name] + (Number(octave) - 4) * 12;
  return A4 * Math.pow(2, semitonesFromA4 / 12);
}
