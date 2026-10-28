
import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Modal, Field } from "./AdminUI.jsx";
import styles from "./Admin.module.css";

const EMPTY = {
  id: "",
  title: "",
  order: "0",
  itemsText: "",
};

const toForm = (group) => ({
  id: group.id || "",
  title: group.title || "",
  order: String(group.order ?? 0),
  itemsText: (group.items || [])
    .map((item) =>
      [
        item.id || "",
        item.name || "",
        item.emoji || "",
        item.image || "",
      ].join(" | ")
    )
    .join("\n"),
});

function toPayload(form) {
  const items = form.itemsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id = "", name = "", emoji = "", ...imageParts] =
        line.split("|").map((part) => part.trim());

      return {
        id,
        name,
        emoji,
        image: imageParts.join("|").trim(),
      };
    });

  if (items.some((item) => !item.id || !item.name)) {
    throw new Error("Every tile needs an ID and a name.");
  }

  const ids = items.map((item) => item.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Tile IDs must be unique within a group.");
  }

  return {
    id: form.id.trim(),
    title: form.title.trim(),
    order: Number(form.order) || 0,
    items,
  };
}

export default function CategoriesTab({ call, notify, onChange }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setGroups(await call("/categories"));
    } catch (err) {
      notify(`Could not load categories: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [call, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setForm(EMPTY);
    setError("");
    setEditing("new");
  };

  const openEdit = (group) => {
    setForm(toForm(group));
    setError("");
    setEditing("edit");
  };

  const updateField = (key) => (event) => {
    setForm((current) => ({
      ...current,
      [key]: event.target.value,
    }));
  };

  const save = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.id.trim() || !/^[a-z0-9_-]+$/i.test(form.id.trim())) {
      setError("Group ID is required; use letters, numbers, - or _.");
      return;
    }

    if (!form.title.trim()) {
      setError("Enter a group title.");
      return;
    }

    let body;
    try {
      body = toPayload(form);
    } catch (err) {
      setError(err.message);
      return;
    }

    setSaving(true);
    try {
      if (editing === "new") {
        await call("/categories", { method: "POST", body });
      } else {
        const { id, ...changes } = body;
        await call(`/categories/${encodeURIComponent(id)}`, {
          method: "PUT",
          body: changes,
        });
      }

      setEditing(null);
      notify(editing === "new" ? "Category group added" : "Category group saved");
      await load();
      onChange?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (group) => {
    if (!window.confirm(
      `Delete "${group.title}" and all its category tiles?`
    )) return;

    try {
      await call(`/categories/${encodeURIComponent(group.id)}`, {
        method: "DELETE",
      });
      notify("Category group deleted");
      await load();
      onChange?.();
    } catch (err) {
      notify(`Could not delete category group: ${err.message}`);
    }
  };

  return (
    <section>
      <div className={styles.toolbar}>
        <h2>Category groups</h2>
        <button
          type="button"
          className={styles.primary}
          onClick={openNew}
        >
          <Plus size={16} /> Add category group
        </button>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading categories…</p>
      ) : groups.length ? (
        <ul className={styles.list}>
          {groups.map((group) => (
            <li key={group.id} className={styles.row}>
              <div className={styles.rowMain}>
                <strong>{group.title}</strong>
                <span className={styles.meta}>
                  {group.id} · {(group.items || []).length} tiles · order {group.order ?? 0}
                </span>
                <span className={styles.meta}>
                  {(group.items || [])
                    .map((item) => `${item.emoji || ""} ${item.name}`)
                    .join(", ")}
                </span>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label={`Edit ${group.title}`}
                  onClick={() => openEdit(group)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  className={`${styles.iconBtn} ${styles.danger}`}
                  aria-label={`Delete ${group.title}`}
                  onClick={() => remove(group)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>No category groups yet. Add your first one.</p>
      )}

      {editing && (
        <Modal
          title={editing === "new" ? "Add category group" : `Edit ${form.title}`}
          onClose={() => setEditing(null)}
        >
          <form className={styles.form} onSubmit={save} noValidate>
            <div className={styles.grid}>
              <Field
                label="Group ID *"
                hint="Example: electronics. Cannot change after creation."
              >
                <input
                  value={form.id}
                  onChange={updateField("id")}
                  disabled={editing === "edit"}
                />
              </Field>

              <Field label="Display order">
                <input
                  type="number"
                  value={form.order}
                  onChange={updateField("order")}
                />
              </Field>

              <Field label="Group title *" wide>
                <input
                  value={form.title}
                  onChange={updateField("title")}
                  placeholder="Electronics"
                />
              </Field>

              <Field
                label="Category tiles"
                hint="One per line: id | name | emoji | image URL"
                wide
              >
                <textarea
                  rows={8}
                  value={form.itemsText}
                  onChange={updateField("itemsText")}
                  placeholder={"mobiles | Mobile Phones | 📱 |\nspeakers | Speakers | 🔊 |"}
                />
              </Field>
            </div>

            {error && (
              <p className={styles.error} role="alert">{error}</p>
            )}

            <div className={styles.formBtns}>
              <button
                type="button"
                className={styles.ghost}
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.primary}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save category group"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
