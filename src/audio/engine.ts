import { noteToFrequency } from "../lib/note";
import type { AudioEngine, EngineState, SoundSpec } from "./types";

type Loaded = { note: string; buffer: AudioBuffer | null };

const ATTACK = 0.005;
const PEAK = 0.22;
/* 누르고 있는 동안의 자연 감쇠 — 피아노 현은 잡고 있어도 천천히 죽는다 */
const SUSTAIN = 5.5;
/* 떼었을 때 잔향이 잦아드는 시간 */
const RELEASE = 0.35;

export function createAudioEngine(options: {
  createContext?: () => AudioContext;
  fetchSample?: (url: string) => Promise<ArrayBuffer>;
} = {}): AudioEngine {
  const createContext = options.createContext ?? (() => new AudioContext());
  const fetchSample =
    options.fetchSample ??
    (async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${url}: ${response.status}`);
      return response.arrayBuffer();
    });

  let context: AudioContext | null = null;
  let state: EngineState = "locked";
  let muted = false;
  const loaded = new Map<string, Loaded>();
  /* 울리고 있는 목소리들. 같은 건반을 연타하면 여러 개가 겹친다 */
  const voices = new Map<string, GainNode[]>();

  async function unlock(): Promise<void> {
    if (state === "ready") return;
    context = createContext();
    await context.resume();
    state = "ready";
  }

  async function preload(specs: SoundSpec[]): Promise<void> {
    await Promise.all(
      specs.map(async (spec) => {
        let buffer: AudioBuffer | null = null;
        if (spec.sound && context) {
          try {
            const data = await fetchSample(spec.sound);
            buffer = await context.decodeAudioData(data);
          } catch {
            // 샘플이 없거나 깨졌으면 합성음으로 물러난다. 실패시키지 않는다.
            buffer = null;
          }
        }
        loaded.set(spec.id, { note: spec.note, buffer });
      }),
    );
  }

  function play(id: string): void {
    if (state !== "ready" || muted || !context) return;
    const entry = loaded.get(id);
    if (!entry) return;

    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(PEAK, now + ATTACK);
    /* 잡고 있어도 천천히 잦아든다 — release가 오면 이 스케줄을 지우고 짧게 접는다 */
    gain.gain.exponentialRampToValueAtTime(0.0001, now + SUSTAIN);
    gain.connect(context.destination);

    const list = voices.get(id) ?? [];
    list.push(gain);
    voices.set(id, list);

    if (entry.buffer) {
      const source = context.createBufferSource();
      source.buffer = entry.buffer;
      source.connect(gain);
      source.start();
      return;
    }

    const osc = context.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(noteToFrequency(entry.note), now);
    osc.connect(gain);
    osc.start();
    /* stop은 한 번만 예약한다 — release는 소리(gain)만 접고 오실레이터는 그대로 죽게 둔다 */
    osc.stop(now + SUSTAIN + 0.2);
  }

  function release(id: string): void {
    if (state !== "ready" || !context) return;
    const list = voices.get(id);
    if (!list || list.length === 0) return;

    const now = context.currentTime;
    for (const gain of list) {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + RELEASE);
    }
    voices.delete(id);
  }

  return {
    getState: () => state,
    unlock,
    preload,
    play,
    release,
    setMuted: (value: boolean) => { muted = value; },
    isMuted: () => muted,
  };
}
