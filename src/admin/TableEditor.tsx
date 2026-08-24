import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Field, TableConfig } from "./config";
import styles from "./Admin.module.css";

type Row = Record<string, unknown>;

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
  table, userId, householdId,
}: { table: TableConfig; userId: string; householdId: string | null }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null | "new">(null);
  const [draft, setDraft] = useState<Row>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const ord = table.orderBy ?? { col: "sort_order", ascending: true };
    const { data, error } = await supabase
      .from(table.key)
      .select("*")
      .order(ord.col, { ascending: ord.ascending });
    setLoading(false);
    if (error) { setMsg(error.message); return; }
    setRows((data as Row[]) ?? []);
  }, [table.key]);

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
    if (!supabase) return;
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
    setMsg("저장했습니다. 사이트는 재빌드 후 반영됩니다(약 1–2분).");
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

  const editing = editingId !== null;
  const badge = table.badge ?? { col: "visibility", onValue: "public", onLabel: "공개", offLabel: "비공개" };

  return (
    <section className={styles.editor}>
      <div className={styles.editorHead}>
        <h2 className={styles.editorTitle}>{table.label} <span className={styles.count}>{rows.length}</span></h2>
        {!editing && <button className={styles.btnPrimary} onClick={startNew}>+ 새로 추가</button>}
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
          onDelete={editingId !== "new" ? () => remove(editingId as string) : undefined}
        />
      ) : loading ? (
        <p className={styles.notice}>불러오는 중…</p>
      ) : (
        <ul className={styles.rows}>
          {rows.map((r) => {
            const on = r[badge.col] === badge.onValue;
            return (
              <li key={r.id as string} className={styles.rowItem}>
                <button className={styles.rowBtn} onClick={() => startEdit(r)}>
                  <span className={styles.rowTitle}>{String(r[table.titleCol] ?? "(제목 없음)")}</span>
                  {table.subtitleCol && <span className={styles.rowSub}>{String(r[table.subtitleCol] ?? "")}</span>}
                  <span className={`${styles.badge} ${on ? styles.badgeOn : styles.badgeOff}`}>
                    {on ? badge.onLabel : badge.offLabel}
                  </span>
                </button>
              </li>
            );
          })}
          {rows.length === 0 && <p className={styles.notice}>아직 없습니다.</p>}
        </ul>
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
  const set = (col: string, v: unknown) => setDraft({ ...draft, [col]: v });
  const fields = useMemo(() => table.fields, [table]);

  return (
    <form className={styles.form} onSubmit={(e) => { e.preventDefault(); onSave(); }}>
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
        <button type="submit" className={styles.btnPrimary} disabled={busy}>
          {busy ? "저장 중…" : "저장"}
        </button>
        <button type="button" className={styles.btnGhost} onClick={onCancel}>취소</button>
        {onDelete && (
          <button type="button" className={styles.btnDanger} onClick={onDelete} disabled={busy}>삭제</button>
        )}
      </div>
    </form>
  );
}
