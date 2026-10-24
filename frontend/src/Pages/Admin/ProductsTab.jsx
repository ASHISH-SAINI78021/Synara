// src/Pages/Admin/ProductsTab.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { resolveImage } from "../../utils/resolveImage";
import { Modal, Field } from "./AdminUI.jsx";
import styles from "./Admin.module.css";

const inr = (n) => (typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "");

const EMPTY = {
  id: "", section: "popular", order: "", name: "", price: "", mrp: "", off: "", rating: "", reviews: "",
  emoji: "", image: "", unit: "1 unit", stock: "", delivery: "Same day", brand: "Synara", category: "",
  description: "", highlights: "", specs: "", offerText: "", offerCode: "", offerMore: "",
  replacement: "", warranty: "",
};

const str = (v) => (v == null ? "" : String(v));

function toForm(p) {
  return {
    id: str(p.id), section: str(p.section), order: str(p.order), name: str(p.name),
    price: str(p.price), mrp: str(p.mrp), off: str(p.off), rating: str(p.rating), reviews: str(p.reviews),
    emoji: str(p.emoji), image: str(p.image), unit: str(p.unit), stock: str(p.stock),
    delivery: str(p.delivery), brand: str(p.brand),
    category: Array.isArray(p.category) ? p.category.join(", ") : str(p.category),
    description: str(p.description),
    highlights: (p.highlights || []).join("\n"),
    specs: (p.specs || []).map((s) => `${s.label}: ${s.value}`).join("\n"),
    offerText: str(p.offer?.text), offerCode: str(p.offer?.code), offerMore: str(p.offer?.more),
    replacement: str(p.replacement), warranty: str(p.warranty),
  };
}

const num = (v) => (String(v).trim() === "" || isNaN(Number(v)) ? null : Number(v));
const lines = (v) => v.split("\n").map((s) => s.trim()).filter(Boolean);

function toPayload(f) {
  const price = Number(f.price);
  const mrp = num(f.mrp);
  // discount: use what you typed, otherwise work it out from price and MRP
  const off = num(f.off) ?? (mrp && mrp > price ? Math.round((1 - price / mrp) * 100) : null);
  const cats = f.category.split(",").map((s) => s.trim()).filter(Boolean);
  const reviews = f.reviews.trim() === "" ? null : isNaN(Number(f.reviews)) ? f.reviews.trim() : Number(f.reviews);
  return {
    id: f.id.trim(),
    section: f.section,
    order: num(f.order) ?? 0,
    name: f.name.trim(),
    price,
    mrp,
    off,
    rating: num(f.rating),
    reviews,
    emoji: f.emoji.trim(),
    image: f.image.trim(),
    unit: f.unit.trim(),
    stock: num(f.stock),
    delivery: f.delivery.trim(),
    brand: f.brand.trim(),
    category: cats.length === 0 ? null : cats.length === 1 ? cats[0] : cats,
    description: f.description.trim(),
    highlights: lines(f.highlights),
    specs: lines(f.specs).map((l) => {
      const i = l.indexOf(":");
      return i < 0 ? { label: l, value: "" } : { label: l.slice(0, i).trim(), value: l.slice(i + 1).trim() };
    }),
    offer: { text: f.offerText.trim(), code: f.offerCode.trim(), more: num(f.offerMore) },
    replacement: f.replacement.trim(),
    warranty: f.warranty.trim(),
  };
}

function validate(f, mode) {
  if (!/^[a-z0-9_-]+$/i.test(f.id.trim())) return "Product id: use only letters, numbers, - or _ (no spaces)";
  if (!f.name.trim()) return "Enter the product name";
  if (f.price.trim() === "" || isNaN(Number(f.price)) || Number(f.price) < 0) return "Enter a valid price";
  if (num(f.mrp) !== null && num(f.mrp) < Number(f.price)) return "MRP should not be lower than the price";
  return "";
}

function suggestId(section, items) {
  const prefix = section === "popular" ? "p" : "a";
  const used = items.map((p) => new RegExp(`^${prefix}(\\d+)$`).exec(p.id)).filter(Boolean).map((m) => Number(m[1]));
  return `${prefix}${(used.length ? Math.max(...used) : 0) + 1}`;
}

export default function ProductsTab({ call, notify, onChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sec, setSec] = useState("all");
  const [editing, setEditing] = useState(null); // { mode: "new" | "edit" }
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await call("/products"));
    } catch (err) {
      notify(`Could not load products: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [call, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return items.filter(
      (p) => (sec === "all" || p.section === sec) && (!t || `${p.name} ${p.id}`.toLowerCase().includes(t))
    );
  }, [items, q, sec]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openNew = () => {
    const section = sec === "accessories" ? "accessories" : "popular";
    setForm({
      ...EMPTY,
      section,
      id: suggestId(section, items),
      order: String(items.filter((p) => p.section === section).length),
    });
    setFormError("");
    setEditing({ mode: "new" });
  };
  const openEdit = (p) => {
    setForm(toForm(p));
    setFormError("");
    setEditing({ mode: "edit" });
  };

  const save = async (e) => {
    e.preventDefault();
    const problem = validate(form, editing.mode);
    if (problem) return setFormError(problem);
    setSaving(true);
    setFormError("");
    try {
      const body = toPayload(form);
      if (editing.mode === "new") {
        await call("/products", { method: "POST", body });
      } else {
        const { id, ...rest } = body;
        await call(`/products/${encodeURIComponent(id)}`, { method: "PUT", body: rest });
      }
      notify(editing.mode === "new" ? "Product added" : "Product saved");
      setEditing(null);
      await load();
      onChange();
    } catch (err) {
      setFormError(err.message.includes("E11000") ? "That product id is already used. Pick another." : err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await call(`/products/${encodeURIComponent(p.id)}`, { method: "DELETE" });
      notify("Product deleted");
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
        <label className={styles.search}>
          <Search size={16} aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or id" aria-label="Search products" />
        </label>
        <div className={styles.chips} role="group" aria-label="Filter by row">
          {[["all", "All"], ["popular", "Popular"], ["accessories", "Accessories"]].map(([v, l]) => (
            <button key={v} type="button" aria-pressed={sec === v} className={sec === v ? `${styles.chip} ${styles.on}` : styles.chip} onClick={() => setSec(v)}>
              {l}
            </button>
          ))}
        </div>
        <button type="button" className={styles.primary} onClick={openNew}>
          <Plus size={16} aria-hidden="true" /> Add product
        </button>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : shown.length ? (
        <ul className={styles.list}>
          {shown.map((p) => (
            <li key={p.id} className={styles.row}>
              <span className={styles.thumb}>
                {resolveImage(p.image) ? <img src={resolveImage(p.image)} alt="" loading="lazy" /> : <span aria-hidden="true">{p.emoji || "📦"}</span>}
              </span>
              <div className={styles.rowMain}>
                <strong>{p.name}</strong>
                <span className={styles.meta}>
                  {p.id} · {p.section} · order {p.order ?? 0}
                  {typeof p.stock === "number" ? ` · ${p.stock} in stock` : ""}
                </span>
              </div>
              <div className={styles.price}>
                <strong>{inr(p.price)}</strong>
                {p.mrp > p.price ? <del>{inr(p.mrp)}</del> : null}
              </div>
              <div className={styles.actions}>
                <button type="button" className={styles.iconBtn} aria-label={`Edit ${p.name}`} onClick={() => openEdit(p)}>
                  <Pencil size={16} />
                </button>
                <button type="button" className={`${styles.iconBtn} ${styles.danger}`} aria-label={`Delete ${p.name}`} onClick={() => remove(p)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>No products found.</p>
      )}

      {editing ? (
        <Modal title={editing.mode === "new" ? "Add product" : `Edit ${form.id}`} onClose={() => setEditing(null)}>
          <form className={styles.form} onSubmit={save} noValidate>
            <div className={styles.grid}>
              <Field label="Product id *" hint="Used in the link, e.g. /product/a12. Cannot change later.">
                <input value={form.id} onChange={set("id")} disabled={editing.mode === "edit"} />
              </Field>
              <Field label="Row on the home page *">
                <select value={form.section} onChange={set("section")}>
                  <option value="popular">Popular Electronics</option>
                  <option value="accessories">Accessories</option>
                </select>
              </Field>
              <Field label="Name *" wide>
                <input value={form.name} onChange={set("name")} />
              </Field>
              <Field label="Price (₹) *">
                <input value={form.price} onChange={set("price")} inputMode="decimal" />
              </Field>
              <Field label="MRP (₹)">
                <input value={form.mrp} onChange={set("mrp")} inputMode="decimal" />
              </Field>
              <Field label="Discount %" hint="Leave empty to work it out from price and MRP">
                <input value={form.off} onChange={set("off")} inputMode="numeric" />
              </Field>
              <Field label="Position in row" hint="Smaller number shows first">
                <input value={form.order} onChange={set("order")} inputMode="numeric" />
              </Field>
              <Field label="Stock">
                <input value={form.stock} onChange={set("stock")} inputMode="numeric" />
              </Field>
              <Field label="Unit">
                <input value={form.unit} onChange={set("unit")} />
              </Field>
              <Field label="Emoji" hint="Shown when there is no photo">
                <input value={form.emoji} onChange={set("emoji")} />
              </Field>
              <Field label="Photo" hint="A file name from src/assets (e.g. neckband.png) or a full https:// link">
                <input value={form.image} onChange={set("image")} />
              </Field>
            </div>

            {form.image.trim() ? (
              <div className={styles.previewRow}>
                <span className={styles.thumb}>
                  {preview ? <img src={preview} alt="" /> : <span aria-hidden="true">❔</span>}
                </span>
                <small>{preview ? "Photo found" : "Photo not found in src/assets: the emoji will show instead"}</small>
              </div>
            ) : null}

            <details className={styles.more}>
              <summary>More details (optional)</summary>
              <div className={styles.grid}>
                <Field label="Rating (0–5)"><input value={form.rating} onChange={set("rating")} inputMode="decimal" /></Field>
                <Field label="Review count"><input value={form.reviews} onChange={set("reviews")} /></Field>
                <Field label="Delivery"><input value={form.delivery} onChange={set("delivery")} /></Field>
                <Field label="Brand"><input value={form.brand} onChange={set("brand")} /></Field>
                <Field label="Category id(s)" hint="Tile id(s), comma separated, e.g. chargers" wide>
                  <input value={form.category} onChange={set("category")} />
                </Field>
                <Field label="Description" wide>
                  <textarea rows={3} value={form.description} onChange={set("description")} />
                </Field>
                <Field label="Highlights" hint="One per line" wide>
                  <textarea rows={3} value={form.highlights} onChange={set("highlights")} />
                </Field>
                <Field label="Specs" hint="One per line, like  Battery: 5000 mAh" wide>
                  <textarea rows={3} value={form.specs} onChange={set("specs")} />
                </Field>
                <Field label="Offer text"><input value={form.offerText} onChange={set("offerText")} /></Field>
                <Field label="Offer code"><input value={form.offerCode} onChange={set("offerCode")} /></Field>
                <Field label="More offers (count)"><input value={form.offerMore} onChange={set("offerMore")} inputMode="numeric" /></Field>
                <Field label="Replacement"><input value={form.replacement} onChange={set("replacement")} /></Field>
                <Field label="Warranty"><input value={form.warranty} onChange={set("warranty")} /></Field>
              </div>
            </details>

            {formError ? <p className={styles.error} role="alert">{formError}</p> : null}
            <div className={styles.formBtns}>
              <button type="button" className={styles.ghost} onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className={styles.primary} disabled={saving}>
                {saving ? "Saving…" : "Save product"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
