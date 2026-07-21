export type SoundSpec = { id: string; note: string; sound?: string };

export type EngineState = "locked" | "ready";

export interface AudioEngine {
  getState(): EngineState;
  unlock(): Promise<void>;
  preload(specs: SoundSpec[]): Promise<void>;
  play(id: string): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
}
