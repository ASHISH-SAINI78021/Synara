// src/lib/api.js
// Where the backend lives:
//   dev  : "/api"  (Vite forwards it to your Express server, see vite.config.js)
//   prod : set VITE_API_URL=https://your-backend.com/api in the hosting dashboard
const BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export async function api(path, { method = "GET", body, headers = {}, timeoutMs = 8000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
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
