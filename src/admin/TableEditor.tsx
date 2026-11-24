import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Field, TableConfig } from "./config";
import { useAdminCapability } from "./useAdminCapability";
import styles from "./Admin.module.css";

type Row = Record<string, unknown>;
type Visibility = "public" | "private";
const notionPublicationEndpoint = "/api/admin/arrangements-visibility";

// json/stringArray 는 편집 중 문자열로 다루고 저장 시 변환한다.
function toDraft(fields: Field[], row: Row | null): Row {
  const d: Row = {};
  for (const f of fields) {
    const v = row ? row[f.col] : undefined;
    if (f.type === "json") d[f.col] = JSON.stringify(v ?? (f.col === "roles" ? [] : []), null, 2);
    else if (f.type === "stringArray") d[f.col] = Array.isArray(v) ? (v as string[]).join("\n") : "";
    else if (f.type === "visibility") d[f.col] = (v as string) ?? "public";
    else if (f.type === "boolean") d[f.col] = Boolean(v);
    else d[f.col] = v ?? "";
  }
  return d;
}

function fromDraft(fields: Field[], draft: Row): { payload: Row; error?: string } {
  const payload: Row = {};
  for (const f of fields) {
    const raw = draft[f.col];
    if (f.type === "number") payload[f.col] = raw === "" || raw == null ? null : Number(raw);
    else if (f.type === "boolean") payload[f.col] = Boolean(raw);
    else if (f.type === "date") payload[f.col] = raw === "" ? null : raw;
    else if (f.type === "stringArray")
      payload[f.col] = String(raw ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
    else if (f.type === "json") {
      try { payload[f.col] = JSON.parse(String(raw ?? "").trim() || "[]"); }
      catch { return { payload, error: `${f.label}: JSON 형식이 올바르지 않습니다` }; }
    } else if (f.type === "visibility") payload[f.col] = raw || "public";
    else payload[f.col] = raw === "" ? null : raw;
  }
  return { payload };
}

export function TableEditor({
  table, userId, householdId, accessToken, onEditingChange,
}: { table: TableConfig; userId: string; householdId: string | null; accessToken: string; onEditingChange: (editing: boolean) => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null | "new">(null);
  const [draft, setDraft] = useState<Row>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selection, setSelection] = useState<Set<string>>(() => new Set());
  const [search, setSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | Visibility>("all");
  const isArrangement = table.key === "arrangements";
  const canPublish = table.fields.some(field => field.col === "visibility" && field.type === "visibility");
  const notionReady = useAdminCapability(notionPublicationEndpoint, isArrangement ? accessToken : null);
  const editing = editingId !== null;

  useEffect(() => { onEditingChange(editing || bulkBusy); }, [editing, bulkBusy, onEditingChange]);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const ord = table.orderBy ?? { col: "sort_order", ascending: true };
    const query = supabase.from(table.key).select("*").order(ord.col, { ascending: ord.ascending });
    const { data, error } = await (isArrangement ? query.eq("archived", false) : query);
    setLoading(false);
    if (error) { setMsg(error.message); return; }
    setRows((data as Row[]) ?? []);
  }, [table.key, table.orderBy, isArrangement]);

  useEffect(() => { setEditingId(null); load(); }, [load]);

  const startNew = () => {
    setEditingId("new");
    setDraft(toDraft(table.fields, null));
    setMsg(null);
  };
  const startEdit = (row: Row) => {
    setEditingId(row.id as string);
    setDraft(toDraft(table.fields, row));
    setMsg(null);
  };

  const save = async () => {
    if (!supabase || table.readOnly) return;
    const { payload, error } = fromDraft(table.fields, draft);
    if (error) { setMsg(error); return; }
    setBusy(true); setMsg(null);
    let res;
    if (editingId === "new") {
      const ownerFields =
        table.ownerScoped === false
          ? {}
          : { user_id: userId, ...(householdId ? { household_id: householdId } : {}) };
      res = await supabase.from(table.key).insert({ ...payload, ...ownerFields });
    } else {
      res = await supabase.from(table.key).update(payload).eq("id", editingId);
    }
    setBusy(false);
    if (res.error) { setMsg(res.error.message); return; }
    setEditingId(null);
    await load();
    setMsg(table.key === "inquiries"
      ? "저장했습니다."
      : table.key === "rv_records"
      ? "저장했습니다. 공개 컬렉션은 페이지를 다시 열거나 새로고침하면 반영됩니다."
      : "저장했습니다. 사이트 재배포 후 반영됩니다.");
  };

  const remove = async (id: string) => {
    if (!supabase) return;
    if (!window.confirm("정말 삭제할까요?")) return;
    setBusy(true);
    const { error } = await supabase.from(table.key).delete().eq("id", id);
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    setEditingId(null);
    await load();
    setMsg("삭제했습니다.");
  };

  const badge = table.badge ?? { col: "visibility", onValue: "public", onLabel: "공개", offLabel: "비공개" };
  const keyword = search.trim().toLocaleLowerCase();
  const visibleRows = rows.filter(row =>
    (visibilityFilter === "all" || row.visibility === visibilityFilter) &&
    (!keyword || [row[table.titleCol], table.subtitleCol ? row[table.subtitleCol] : null, row.original_artist]
      .some(value => typeof value === "string" && value.toLocaleLowerCase().includes(keyword)))
  );
  const selectedRows = rows.filter(row => selection.has(String(row.id)));
  const selectable = (row: Row) => canPublish && (!isArrangement || row.source === "ssd" || (row.source === "notion" && notionReady));
  const visibleIds = visibleRows.filter(selectable).map(row => String(row.id));
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selection.has(id));

  function toggle(ids: string[], checked: boolean) {
    setSelection(previous => {
      const next = new Set(previous);
      for (const id of ids) checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  async function setVisibility(visibility: Visibility) {
    if (!supabase || bulkBusy) return;
    const selected = selectedRows.filter(selectable);
    if (!selected.length) return;
    const client = supabase;
    const notionIds = selected.filter(row => isArrangement && row.source === "notion").map(row => String(row.id));
    const directIds = selected.filter(row => !isArrangement || row.source === "ssd").map(row => String(row.id));
    setBulkBusy(true);
    setMsg(null);

    const changes: Promise<string[]>[] = [];
    if (directIds.length) {
      const query = client.from(table.key).update({ visibility }).in("id", directIds);
      changes.push((async () => {
        const constrained = isArrangement ? query.eq("source", "ssd").eq("archived", false) : query;
        const { data, error } = await constrained.select("id");
        if (error) throw error;
        return (data ?? []).map(row => String(row.id));
      })());
    }
    if (notionIds.length) {
      changes.push((async () => {
        const response = await fetch(notionPublicationEndpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ ids: notionIds, visibility }),
        });
        if (!response.ok) throw new Error("Notion publication was rejected");
        const result: { updatedIds?: unknown } = await response.json();
        if (!Array.isArray(result.updatedIds)) return [];
        return result.updatedIds.filter(id => typeof id === "string" && notionIds.includes(id));
      })());
    }

    const results = await Promise.allSettled(changes);
    const changed = new Set(results.flatMap(result => result.status === "fulfilled" ? result.value : []));
    const failed = selected.length - changed.size;
    setRows(previous => previous.map(row => changed.has(String(row.id)) ? { ...row, visibility } : row));
    toggle([...changed], false);
    setBulkBusy(false);
    const label = visibility === "public" ? "공개" : "비공개";
    setMsg(failed
      ? `${changed.size}개를 ${label}로 저장했습니다. ${failed}개는 저장하지 못했습니다. 남은 항목을 다시 시도해 주세요.`
      : `${changed.size}개를 ${label}로 저장했습니다. ${table.key === "rv_records" ? "컬렉션을 새로고침하면 반영됩니다." : "사이트 재배포 후 반영됩니다."}`);
  }


  return (
    <section className={styles.editor}>
      <div className={styles.editorHead}>
        <h2 className={styles.editorTitle}>{table.label} <span className={styles.count}>{rows.length}</span></h2>
        {!editing && !table.readOnly && (
          <button className={styles.btnPrimary} disabled={bulkBusy} onClick={startNew}>+ 새로 추가</button>
        )}
      </div>

      {msg && <p className={styles.msg}>{msg}</p>}

      {editing ? (
        <EditForm
          table={table}
          draft={draft}
          setDraft={setDraft}
          busy={busy}
          onSave={save}
          onCancel={() => setEditingId(null)}
          onDelete={
            !table.readOnly && editingId !== "new"
              ? () => remove(editingId as string)
              : undefined
          }
        />
      ) : loading ? (
        <p className={styles.notice}>불러오는 중…</p>
      ) : (
        <>
          {canPublish && (
            <div className={styles.bulk} aria-label="공개 상태 일괄 변경">
              <div className={styles.bulkFilters}>
                <input className={styles.input} type="search" value={search} onChange={event => setSearch(event.target.value)} aria-label="항목 검색" placeholder="제목이나 아티스트로 검색" />
                <select className={styles.select} value={visibilityFilter} onChange={event => setVisibilityFilter(event.target.value as typeof visibilityFilter)} aria-label="공개 상태 필터">
                  <option value="all">공개 상태 전체</option>
                  <option value="public">공개</option>
                  <option value="private">비공개</option>
                </select>
              </div>
              <div className={styles.bulkActions}>
                <label><input className={styles.checkbox} type="checkbox" checked={allVisibleSelected} disabled={bulkBusy || visibleIds.length === 0} onChange={event => toggle(visibleIds, event.target.checked)} /> 현재 목록 전체 선택</label>
                <span role="status">{selectedRows.length}개 선택</span>
                <button className={styles.btnPrimary} type="button" disabled={bulkBusy || !selectedRows.some(selectable)} onClick={() => void setVisibility("public")}>선택 공개</button>
                <button className={styles.btnGhost} type="button" disabled={bulkBusy || !selectedRows.some(selectable)} onClick={() => void setVisibility("private")}>선택 비공개</button>
                {selectedRows.length > 0 && <button className={styles.btnGhost} type="button" disabled={bulkBusy} onClick={() => setSelection(new Set())}>선택 해제</button>}
              </div>
              {isArrangement && !notionReady && <p className={styles.fieldHelp}>Notion 연결 곡은 서버 연동 후 공개 상태를 바꿀 수 있습니다.</p>}
            </div>
          )}
          <ul className={styles.rows}>
            {visibleRows.map((r) => {
              const on = r[badge.col] === badge.onValue;
              return (
                <li key={r.id as string} className={styles.rowItem}>
                  {canPublish && (
                    <input className={styles.checkbox} type="checkbox"
                      aria-label={`${String(r[table.titleCol] ?? "(제목 없음)")} 선택`}
                      checked={selection.has(String(r.id))} disabled={bulkBusy || !selectable(r)}
                      onChange={event => toggle([String(r.id)], event.target.checked)} />
                  )}
                  <button className={styles.rowBtn} disabled={bulkBusy} onClick={() => startEdit(r)}>
                    <span className={styles.rowTitle}>{String(r[table.titleCol] ?? "(제목 없음)")}</span>
                    {table.subtitleCol && <span className={styles.rowSub}>{String(r[table.subtitleCol] ?? "")}</span>}
                    {isArrangement && <span className={styles.rowSource}>{r.source === "notion" ? "Notion" : "SSD"}</span>}
                    <span className={`${styles.badge} ${on ? styles.badgeOn : styles.badgeOff}`}>
                      {on ? badge.onLabel : badge.offLabel}
                    </span>
                  </button>
                </li>
              );
            })}
            {visibleRows.length === 0 && <li className={styles.notice}>{rows.length ? "검색 조건과 일치하는 항목이 없습니다." : "아직 없습니다."}</li>}
          </ul>
        </>
      )}
    </section>
  );
}

function EditForm({
  table, draft, setDraft, busy, onSave, onCancel, onDelete,
}: {
  table: TableConfig;
  draft: Row;
  setDraft: (d: Row) => void;
  busy: boolean;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const set = (col: string, v: unknown) => {
    if (!table.readOnly) setDraft({ ...draft, [col]: v });
  };
  const fields = useMemo(() => table.fields, [table]);

  return (
    <form className={styles.form} onSubmit={(e) => { e.preventDefault(); if (!table.readOnly) onSave(); }}>
      {fields.map((f) => (
        <label key={f.col} className={styles.fieldRow}>
          <span className={styles.fieldLabel}>{f.label}</span>
          {f.type === "textarea" || f.type === "json" ? (
            <textarea
              className={styles.textarea}
              rows={f.type === "json" ? 5 : 4}
              value={String(draft[f.col] ?? "")}
              onChange={(e) => set(f.col, e.target.value)}
              spellCheck={false}
            />
          ) : f.type === "stringArray" ? (
            <textarea
              className={styles.textarea}
              rows={3}
              value={String(draft[f.col] ?? "")}
              onChange={(e) => set(f.col, e.target.value)}
            />
          ) : f.type === "boolean" ? (
            <input type="checkbox" className={styles.checkbox}
              checked={Boolean(draft[f.col])} onChange={(e) => set(f.col, e.target.checked)} />
          ) : f.type === "visibility" ? (
            <select className={styles.input} value={String(draft[f.col] ?? "public")}
              onChange={(e) => set(f.col, e.target.value)}>
              <option value="public">공개 (public)</option>
              <option value="private">비공개 (private)</option>
            </select>
          ) : (
            <input
              className={styles.input}
              type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
              value={String(draft[f.col] ?? "")}
              onChange={(e) => set(f.col, e.target.value)}
            />
          )}
          {f.help && <span className={styles.fieldHelp}>{f.help}</span>}
        </label>
      ))}

      <div className={styles.formActions}>
        {/* 원본이 다른 곳인 테이블은 저장 경로를 열지 않는다 (config 의 readOnly) */}
        {table.readOnly ? (
          <span className={styles.fieldHelp}>
            상세 화면은 읽기 전용입니다. 공개 상태는 목록에서 선택해 바꿀 수 있습니다.
          </span>
        ) : (
          <button type="submit" className={styles.btnPrimary} disabled={busy}>
            {busy ? "저장 중…" : "저장"}
          </button>
        )}
        <button type="button" className={styles.btnGhost} onClick={onCancel}>취소</button>
        {onDelete && (
          <button type="button" className={styles.btnDanger} onClick={onDelete} disabled={busy}>삭제</button>
        )}
      </div>
    </form>
  );
}
