// src/lib/api.js
// Where the backend lives:
//   dev  : "/api"  (Vite forwards it to your Express server, see vite.config.js)
//   prod : set VITE_API_URL=https://your-backend.com/api in the hosting dashboard
import { BACKEND_URL } from "../url.js";
const BASE = (BACKEND_URL || "/api").replace(/\/$/, "");

export async function api(path, { method = "GET", body, headers = {}, timeoutMs = 8000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  // a FormData body (picture upload) is sent as it is; everything else is sent as JSON
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        ...(body && !isForm ? { "Content-Type": "application/json" } : {}),
        ...(localStorage.getItem("synara-auth-token") ? { Authorization: `Bearer ${localStorage.getItem("synara-auth-token")}` } : {}),
        ...headers,
      },
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
    if (!res.ok) {
      let msg = "";
      try {
        msg = (await res.json()).error || "";
      } catch {
        /* the server sent no JSON message */
      }
      const err = new Error(msg || `API ${res.status} on ${path}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}