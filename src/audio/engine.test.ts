import { createAudioEngine } from "./engine";

class FakeParam {
  value = 0;
  calls: string[] = [];
  setValueAtTime(v: number) { this.value = v; this.calls.push("set"); return this; }
  linearRampToValueAtTime(v: number) { this.value = v; this.calls.push("ramp"); return this; }
  exponentialRampToValueAtTime(v: number) { this.value = v; this.calls.push("exp"); return this; }
  cancelScheduledValues() { this.calls.push("cancel"); return this; }
}

class FakeNode {
  connected: FakeNode[] = [];
  started = false;
  stopped = false;
  frequency = new FakeParam();
  gain = new FakeParam();
  buffer: unknown = null;
  type = "sine";
  connect(target: FakeNode) { this.connected.push(target); return target; }
  disconnect() {}
  start() { this.started = true; }
  stop() { this.stopped = true; }
}

class FakeAudioContext {
  state: "suspended" | "running" = "suspended";
  currentTime = 0;
  destination = new FakeNode();
  oscillators: FakeNode[] = [];
  sources: FakeNode[] = [];
  decodeCalls = 0;
  async resume() { this.state = "running"; }
  createOscillator() { const n = new FakeNode(); this.oscillators.push(n); return n; }
  createBufferSource() { const n = new FakeNode(); this.sources.push(n); return n; }
  createGain() { return new FakeNode(); }
  async decodeAudioData() { this.decodeCalls++; return { duration: 1 }; }
}

function setup(opts: { fetchSample?: (url: string) => Promise<ArrayBuffer> } = {}) {
  const ctx = new FakeAudioContext();
  const engine = createAudioEngine({
    createContext: () => ctx as unknown as AudioContext,
    fetchSample: opts.fetchSample ?? (async () => new ArrayBuffer(8)),
  });
  return { ctx, engine };
}

test("처음에는 잠겨 있다", () => {
  const { engine } = setup();
  expect(engine.getState()).toBe("locked");
});

test("unlock 후 준비 상태가 되고 컨텍스트가 재개된다", async () => {
  const { ctx, engine } = setup();
  await engine.unlock();
  expect(engine.getState()).toBe("ready");
  expect(ctx.state).toBe("running");
});

test("잠긴 상태에서 play를 불러도 던지지 않고 소리도 내지 않는다", () => {
  const { ctx, engine } = setup();
  expect(() => engine.play("a")).not.toThrow();
  expect(ctx.oscillators).toHaveLength(0);
});

test("sound가 없으면 합성음으로 재생한다", async () => {
  const { ctx, engine } = setup();
  await engine.unlock();
  await engine.preload([{ id: "a", note: "C4" }]);
  engine.play("a");
  expect(ctx.oscillators).toHaveLength(1);
  expect(ctx.oscillators[0].started).toBe(true);
  expect(ctx.oscillators[0].frequency.value).toBeCloseTo(261.626, 2);
});

test("sound가 있으면 샘플을 받아 재생한다", async () => {
  const { ctx, engine } = setup();
  await engine.unlock();
  await engine.preload([{ id: "a", note: "C4", sound: "/audio/a.mp3" }]);
  expect(ctx.decodeCalls).toBe(1);
  engine.play("a");
  expect(ctx.sources).toHaveLength(1);
  expect(ctx.oscillators).toHaveLength(0);
});

test("샘플 로딩이 실패하면 던지지 않고 합성음으로 물러난다", async () => {
  const { ctx, engine } = setup({
    fetchSample: async () => { throw new Error("404"); },
  });
  await engine.unlock();
  await expect(
    engine.preload([{ id: "a", note: "C4", sound: "/audio/missing.mp3" }]),
  ).resolves.toBeUndefined();
  engine.play("a");
  expect(ctx.oscillators).toHaveLength(1);
});

test("음소거 상태에서는 소리를 내지 않는다", async () => {
  const { ctx, engine } = setup();
  await engine.unlock();
  await engine.preload([{ id: "a", note: "C4" }]);
  engine.setMuted(true);
  engine.play("a");
  expect(ctx.oscillators).toHaveLength(0);
  expect(engine.isMuted()).toBe(true);
});

test("모르는 id는 조용히 무시한다", async () => {
  const { ctx, engine } = setup();
  await engine.unlock();
  await engine.preload([{ id: "a", note: "C4" }]);
  expect(() => engine.play("없음")).not.toThrow();
  expect(ctx.oscillators).toHaveLength(0);
});

test("떼면 잔향이 짧게 잦아든다 (서스테인 릴리즈)", async () => {
  const { ctx, engine } = setup();
  await engine.unlock();
  await engine.preload([{ id: "a", note: "C4" }]);
  engine.play("a");
  const gainNode = ctx.oscillators[0].connected[0];
  engine.release("a");
  expect(gainNode.gain.calls).toContain("cancel");
  expect(gainNode.gain.calls.filter((c) => c === "exp").length).toBeGreaterThanOrEqual(2);
});

test("모르는 id나 이미 뗀 건반의 release는 조용히 무시한다", async () => {
  const { engine } = setup();
  await engine.unlock();
  await engine.preload([{ id: "a", note: "C4" }]);
  expect(() => engine.release("없음")).not.toThrow();
  engine.play("a");
  engine.release("a");
  expect(() => engine.release("a")).not.toThrow();
});

test("동시에 여러 음을 낼 수 있다 (화음)", async () => {
  const { ctx, engine } = setup();
  await engine.unlock();
  await engine.preload([{ id: "a", note: "C4" }, { id: "b", note: "E4" }]);
  engine.play("a");
  engine.play("b");
  engine.play("a");
  expect(ctx.oscillators).toHaveLength(3);
});
