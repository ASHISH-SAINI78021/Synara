// src/Pages/Admin/ImageUploader.jsx
// Upload photos to Cloudinary (through the backend) and keep the list of photo links.
//   images   : the current list (links, or file names from src/assets)
//   onChange : called with the new list
//   call     : the admin request helper passed down by AdminPage
//   max      : how many photos are allowed (1 for repair services)
import { useState } from "react";
import { Upload, Trash2, Star, Plus } from "lucide-react";
import { resolveImage } from "../../utils/resolveImage";
import styles from "./ImageUploader.module.css";

export default function ImageUploader({ images, onChange, call, max = 8, label = "Photos" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");

  const single = max === 1;
  const room = max - images.length;

  const handleFiles = async (e) => {
    let files = Array.from(e.target.files || []);
    e.target.value = ""; // lets you pick the same file again
    if (!files.length) return;

    // one photo only: the new photo replaces the old one
    if (!single) files = files.slice(0, Math.max(room, 0));
    if (!files.length) return setError(`You can have up to ${max} photos.`);

    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      files.forEach((f) => body.append("images", f));
      const data = await call("/uploads", { method: "POST", body, timeoutMs: 60000 });
      const urls = data.images.map((i) => i.url);
      onChange(single ? urls.slice(0, 1) : [...images, ...urls]);
    } catch (err) {
      setError(err.status === 401 ? "Wrong admin key" : err.message);
    } finally {
      setBusy(false);
    }
  };

  const addLink = () => {
    const v = link.trim();
    if (!v) return;
    if (images.includes(v)) return setError("That photo is already added.");
    setError("");
    onChange(single ? [v] : [...images, v].slice(0, max));
    setLink("");
  };

  const makeMain = (i) => onChange([images[i], ...images.filter((_, j) => j !== i)]);
  const remove = (i) => onChange(images.filter((_, j) => j !== i));

  return (
    <div className={styles.box}>
      <span className={styles.label}>{label}</span>

      {images.length ? (
        <ul className={styles.grid}>
          {images.map((src, i) => {
            const shown = resolveImage(src);
            return (
              <li key={`${src}-${i}`} className={styles.item}>
                <div className={`${styles.thumb} ${i === 0 && !single ? styles.main : ""}`}>
                  {shown ? <img src={shown} alt={`Photo ${i + 1}`} /> : <span aria-hidden="true">❔</span>}
                </div>
                {i === 0 && !single ? <span className={styles.badge}>Main</span> : null}
                <div className={styles.actions}>
                  {!single ? (
                    <button
                      type="button"
                      className={styles.mini}
                      aria-label={`Make photo ${i + 1} the main photo`}
                      disabled={i === 0}
                      onClick={() => makeMain(i)}
                    >
                      <Star size={14} />
                    </button>
                  ) : null}
                  <button type="button" className={styles.mini} aria-label={`Remove photo ${i + 1}`} onClick={() => remove(i)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.hint}>No photo yet. The emoji will show instead.</p>
      )}

      <div className={styles.controls}>
        <label className={`${styles.pick} ${busy ? styles.busy : ""}`}>
          <Upload size={16} aria-hidden="true" />
          {busy ? "Uploading…" : single ? "Upload photo" : "Upload photos"}
          <input
            type="file"
            accept="image/*"
            multiple={!single}
            disabled={busy || (!single && room <= 0)}
            onChange={handleFiles}
            className={styles.file}
          />
        </label>

        <div className={styles.linkRow}>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLink();
              }
            }}
            placeholder="or paste a link / file name from src/assets"
            aria-label="Photo link or file name"
          />
          <button type="button" className={styles.mini} aria-label="Add this link" onClick={addLink}>
            <Plus size={16} />
          </button>
        </div>
      </div>

      <p className={styles.hint}>
        {single ? "Photos are saved when you press Save." : "The first photo is the main one. Photos are saved when you press Save."}
      </p>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </div>
  );
}