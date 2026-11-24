import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TABLES } from "./config";
import { TableEditor } from "./TableEditor";

const db = vi.hoisted(() => ({
  from: vi.fn(),
  rows: [] as Record<string, unknown>[],
  changes: vi.fn(),
  filter: vi.fn(),
}));
vi.mock("../lib/supabase", () => ({ supabase: { from: db.from } }));

beforeEach(() => {
  db.rows = [];
  db.changes.mockReset();
  db.filter.mockReset();
  db.from.mockImplementation(() => ({
    select: () => ({
      order: () => Object.assign(Promise.resolve({ data: db.rows }), {
        eq: () => Promise.resolve({ data: db.rows }),
      }),
    }),
    update: db.changes,
  }));
  db.changes.mockReturnValue({ in: db.filter });
  db.filter.mockImplementation((_column, ids: string[]) => {
    const result = { select: () => Promise.resolve({ data: ids.map(id => ({ id })) }), eq: () => result };
    return result;
  });
});

afterEach(() => vi.unstubAllGlobals());

function openTable(key: string) {
  const table = TABLES.find(table => table.key === key)!;
  render(<TableEditor table={table} userId="test-user" householdId="test-household" accessToken="test-session" onEditingChange={vi.fn()} />);
}

test("selects the visible filtered LPs and updates only their ids", async () => {
  db.rows = [
    { id: "jazz", title: "Jazz album", artist: "Artist", visibility: "private" },
    { id: "opera", title: "Opera album", artist: "Artist", visibility: "private" },
  ];
  openTable("rv_records");
  const search = await screen.findByRole("searchbox", { name: "항목 검색" });
  fireEvent.change(search, { target: { value: "Jazz" } });
  fireEvent.click(screen.getByRole("checkbox", { name: "현재 목록 전체 선택" }));
  fireEvent.click(screen.getByRole("button", { name: "선택 공개" }));
  await waitFor(() => expect(db.filter).toHaveBeenCalledWith("id", ["jazz"]));
  expect(db.changes).toHaveBeenCalledWith({ visibility: "public" });
  expect(await screen.findByText("1개를 공개로 저장했습니다. 컬렉션을 새로고침하면 반영됩니다.")).toBeInTheDocument();
});

test("keeps Notion rows disabled before the server is ready", async () => {
  db.rows = [
    { id: "ssd", title: "SSD song", source: "ssd", visibility: "private" },
    { id: "notion", title: "Notion song", source: "notion", visibility: "private" },
  ];
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
  openTable("arrangements");
  expect(await screen.findByRole("checkbox", { name: "SSD song 선택" })).toBeEnabled();
  expect(screen.getByRole("checkbox", { name: "Notion song 선택" })).toBeDisabled();
});

test("sends Notion songs to the server and SSD songs to the existing database path", async () => {
  db.rows = [
    { id: "ssd", title: "SSD song", source: "ssd", visibility: "private" },
    { id: "notion", title: "Notion song", source: "notion", visibility: "private" },
  ];
  const request = vi.fn().mockResolvedValueOnce(Response.json({ available: true }))
    .mockResolvedValueOnce(Response.json({ updatedIds: [] }));
  vi.stubGlobal("fetch", request);
  openTable("arrangements");
  const notion = await screen.findByRole("checkbox", { name: "Notion song 선택" });
  await waitFor(() => expect(notion).toBeEnabled());
  fireEvent.click(screen.getByRole("checkbox", { name: "현재 목록 전체 선택" }));
  fireEvent.click(screen.getByRole("button", { name: "선택 공개" }));
  await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  expect(JSON.parse(request.mock.calls[1][1].body)).toEqual({ ids: ["notion"], visibility: "public" });
  expect(db.filter).toHaveBeenCalledWith("id", ["ssd"]);
  expect(await screen.findByText(/1개는 저장하지 못했습니다/)).toBeInTheDocument();
  expect(notion).toBeChecked();
});

test("does not treat inquiries as public content", async () => {
  db.rows = [{ id: "lead", contact: "테스트 문의", stage: "new" }];
  openTable("inquiries");
  await screen.findByRole("button", { name: /테스트 문의/ });
  expect(screen.queryByRole("button", { name: "선택 공개" })).not.toBeInTheDocument();
});
