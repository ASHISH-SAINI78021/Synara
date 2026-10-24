// src/Pages/Admin/ServicesTab.jsx  (repair services shown on the Repairs page)
import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { resolveImage } from "../../utils/resolveImage";
import { Modal, Field } from "./AdminUI.jsx";
import styles from "./Admin.module.css";

const inr = (n) => (typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "");
const EMPTY = { id: "", name: "", tags: "", price: "", emoji: "", image: "", order: "" };
const str = (v) => (v == null ? "" : String(v));

export default function ServicesTab({ call, notify, onChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await call("/repairs"));
    } catch (err) {
      notify(`Could not load services: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [call, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openNew = () => {
    const used = items.map((r) => /^r(\d+)$/.exec(r.id)).filter(Boolean).map((m) => Number(m[1]));
    setForm({ ...EMPTY, id: `r${(used.length ? Math.max(...used) : 0) + 1}`, order: String(items.length) });
    setFormError("");
    setEditing("new");
  };
  const openEdit = (r) => {
    setForm({
      id: str(r.id), name: str(r.name), tags: (r.tags || []).join(", "),
      price: str(r.price), emoji: str(r.emoji), image: str(r.image), order: str(r.order),
    });
    setFormError("");
    setEditing("edit");
  };

  const save = async (e) => {
    e.preventDefault();
    if (!/^[a-z0-9_-]+$/i.test(form.id.trim())) return setFormError("Service id: letters, numbers, - or _ only");
    if (!form.name.trim()) return setFormError("Enter the service name");
    if (form.price.trim() === "" || isNaN(Number(form.price)) || Number(form.price) < 0) return setFormError("Enter a valid starting price");

    const body = {
      id: form.id.trim(),
      name: form.name.trim(),
      tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
      price: Number(form.price),
      emoji: form.emoji.trim(),
      image: form.image.trim(),
      order: form.order.trim() === "" || isNaN(Number(form.order)) ? 0 : Number(form.order),
    };
    setSaving(true);
    setFormError("");
    try {
      if (editing === "new") await call("/repairs", { method: "POST", body });
      else {
        const { id, ...rest } = body;
        await call(`/repairs/${encodeURIComponent(id)}`, { method: "PUT", body: rest });
      }
      notify(editing === "new" ? "Service added" : "Service saved");
      setEditing(null);
      await load();
      onChange();
    } catch (err) {
      setFormError(err.message.includes("E11000") ? "That service id is already used. Pick another." : err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete "${r.name}"? This cannot be undone.`)) return;
    try {
      await call(`/repairs/${encodeURIComponent(r.id)}`, { method: "DELETE" });
      notify("Service deleted");
      await load();
      onChange();
    } catch (err) {
      notify(`Could not delete: ${err.message}`);
    }
  };

  const preview = resolveImage(form.image.trim());

  return (
    <section>
      <div className={styles.toolbar}>
        <p className={styles.hint}>The problem options in the booking form come from each service's tags.</p>
        <button type="button" className={styles.primary} onClick={openNew}>
          <Plus size={16} aria-hidden="true" /> Add service
        </button>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : items.length ? (
        <ul className={styles.list}>
          {items.map((r) => (
            <li key={r.id} className={styles.row}>
              <span className={styles.thumb}>
                {resolveImage(r.image) ? <img src={resolveImage(r.image)} alt="" loading="lazy" /> : <span aria-hidden="true">{r.emoji || "🔧"}</span>}
              </span>
              <div className={styles.rowMain}>
                <strong>{r.name}</strong>
                <span className={styles.meta}>{r.id} · {(r.tags || []).join(" · ") || "no tags"}</span>
              </div>
              <div className={styles.price}>
                <span className={styles.small}>from</span>
                <strong>{inr(r.price)}</strong>
              </div>
              <div className={styles.actions}>
                <button type="button" className={styles.iconBtn} aria-label={`Edit ${r.name}`} onClick={() => openEdit(r)}><Pencil size={16} /></button>
                <button type="button" className={`${styles.iconBtn} ${styles.danger}`} aria-label={`Delete ${r.name}`} onClick={() => remove(r)}><Trash2 size={16} /></button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>No repair services yet.</p>
      )}

      {editing ? (
        <Modal title={editing === "new" ? "Add repair service" : `Edit ${form.id}`} onClose={() => setEditing(null)}>
          <form className={styles.form} onSubmit={save} noValidate>
            <div className={styles.grid}>
              <Field label="Service id *" hint="Cannot change later">
                <input value={form.id} onChange={set("id")} disabled={editing === "edit"} />
              </Field>
              <Field label="Position" hint="Smaller number shows first">
                <input value={form.order} onChange={set("order")} inputMode="numeric" />
              </Field>
              <Field label="Name *" wide><input value={form.name} onChange={set("name")} /></Field>
              <Field label="Problem options (tags)" hint="Comma separated, e.g. Screen, Battery, Software" wide>
                <input value={form.tags} onChange={set("tags")} />
              </Field>
              <Field label="Starting price (₹) *"><input value={form.price} onChange={set("price")} inputMode="decimal" /></Field>
              <Field label="Emoji"><input value={form.emoji} onChange={set("emoji")} /></Field>
              <Field label="Photo" hint="A file name from src/assets, or a full https:// link" wide>
                <input value={form.image} onChange={set("image")} />
              </Field>
            </div>
            {form.image.trim() ? (
              <div className={styles.previewRow}>
                <span className={styles.thumb}>{preview ? <img src={preview} alt="" /> : <span aria-hidden="true">❔</span>}</span>
                <small>{preview ? "Photo found" : "Photo not found in src/assets: the emoji will show instead"}</small>
              </div>
            ) : null}
            {formError ? <p className={styles.error} role="alert">{formError}</p> : null}
            <div className={styles.formBtns}>
              <button type="button" className={styles.ghost} onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className={styles.primary} disabled={saving}>{saving ? "Saving…" : "Save service"}</button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
