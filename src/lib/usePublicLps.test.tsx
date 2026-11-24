import { renderHook, waitFor } from "@testing-library/react";
import { getLps } from "./lp";
import { usePublicLps } from "./usePublicLps";

beforeEach(() => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://portfolio.example");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "test-public-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test("shows a newly published LP without changing the built-in snapshot", async () => {
  const response = vi.fn().mockResolvedValue(Response.json([
    { id: "new-record", artist: "Artist", title: "New record", visibility: "public", location: "private data" },
  ]));
  vi.stubGlobal("fetch", response);

  const { result } = renderHook(usePublicLps);
  await waitFor(() => expect(result.current.map(record => record.id)).toEqual(["new-record"]));
  expect(response.mock.calls[0][0].pathname).toBe("/rest/v1/public_lp");
  expect(response.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
  expect(result.current[0]).not.toHaveProperty("location");
  expect(result.current[0]).not.toHaveProperty("visibility");
});

test("keeps the snapshot if the public list is unavailable", async () => {
  const response = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
  vi.stubGlobal("fetch", response);
  const { result } = renderHook(usePublicLps);
  await waitFor(() => expect(response).toHaveBeenCalled());
  expect(result.current).toEqual(getLps());
});
