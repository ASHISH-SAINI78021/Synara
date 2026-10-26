// middleware/rateLimit.js - tiny in-memory limiter so nobody can burn your EmailJS monthly quota
export function rateLimit({ windowMs = 10 * 60 * 1000, max = 10, message = "Too many requests. Please try again in a few minutes." } = {}) {
  const hits = new Map();
  setInterval(() => {
    const cut = Date.now() - windowMs;
    for (const [k, list] of hits) {
      const keep = list.filter((t) => t > cut);
      if (keep.length) hits.set(k, keep);
      else hits.delete(k);
    }
  }, windowMs).unref();
  return (req, res, next) => {
    const key = String(req.get("x-forwarded-for") || req.ip || "unknown").split(",")[0].trim();
    const now = Date.now();
    const list = (hits.get(key) || []).filter((t) => t > now - windowMs);
    if (list.length >= max) return res.status(429).json({ error: message });
    list.push(now);
    hits.set(key, list);
    next();
  };
}
