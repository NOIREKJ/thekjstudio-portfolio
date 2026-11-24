import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RedeployPanel } from "./RedeployPanel";

afterEach(() => vi.unstubAllGlobals());

test("only requests a deployment after editing is finished", async () => {
  const request = vi.fn()
    .mockResolvedValueOnce(Response.json({ available: true }))
    .mockResolvedValueOnce(Response.json({ status: "queued" }, { status: 202 }));
  vi.stubGlobal("fetch", request);
  const { rerender } = render(<RedeployPanel accessToken="session-fixture" editing />);
  const button = await screen.findByRole("button", { name: "사이트 재배포" });
  expect(button).toBeDisabled();
  fireEvent.click(button);
  expect(request).toHaveBeenCalledTimes(1);

  rerender(<RedeployPanel accessToken="session-fixture" editing={false} />);
  fireEvent.click(button);
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("배포 요청이 접수됐습니다"));
  expect(request).toHaveBeenNthCalledWith(2, "/api/admin/redeploy", {
    method: "POST",
    headers: { Authorization: "Bearer session-fixture" },
  });
});

test("does not show a deploy control when the endpoint rejects access", async () => {
  const request = vi.fn().mockResolvedValue(new Response(null, { status: 403 }));
  vi.stubGlobal("fetch", request);
  render(<RedeployPanel accessToken="session-fixture" editing={false} />);
  await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
