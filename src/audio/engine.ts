import { noteToFrequency } from "../lib/note";
import type { AudioEngine, EngineState, SoundSpec } from "./types";

type Loaded = { note: string; buffer: AudioBuffer | null };

const ATTACK = 0.005;
const DECAY = 1.6;
const PEAK = 0.22;

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
    gain.connect(context.destination);

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
    gain.gain.exponentialRampToValueAtTime(0.0001, now + DECAY);
    osc.start();
    osc.stop(now + DECAY);
  }

  return {
    getState: () => state,
    unlock,
    preload,
    play,
    setMuted: (value: boolean) => { muted = value; },
    isMuted: () => muted,
  };
}
