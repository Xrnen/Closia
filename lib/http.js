// Shared helpers for the API functions (Vercel Node runtime and the dev server).
const DEFAULT_ORIGINS = ['https://xrnen.github.io', 'http://localhost:8787', 'http://127.0.0.1:8787'];
const allowedOrigins = () => (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : DEFAULT_ORIGINS);

export function cors(req, res) {
  const origin = req.headers.origin || '';
  const self = req.headers.host ? [`https://${req.headers.host}`, `http://${req.headers.host}`] : [];
  if (origin && (allowedOrigins().includes(origin) || self.includes(origin))) {
    res.setHeader('access-control-allow-origin', origin);
    res.setHeader('vary', 'origin');
  }
  res.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type');
  res.setHeader('access-control-max-age', '86400');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return true; }
  return false;
}

export function sendJSON(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
}

export async function readJSONBody(req, limit = 8192) {
  if (req.body && typeof req.body === 'object') return req.body;         // Vercel pre-parses JSON
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  let data = '';
  for await (const chunk of req) { data += chunk; if (data.length > limit) break; }
  try { return JSON.parse(data || '{}'); } catch { return {}; }
}

export const query = req => new URL(req.url, 'http://local').searchParams;

// Best-effort per-instance rate limit (serverless instances are short-lived).
const hits = new Map();
export function rateLimited(req, max = 30, windowMs = 60_000) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  const now = Date.now(), h = hits.get(ip) || { n: 0, t: now };
  if (now - h.t > windowMs) { h.n = 0; h.t = now; }
  h.n++; hits.set(ip, h);
  if (hits.size > 5000) hits.clear();
  return h.n > max;
}

// One JSON line per request — visible in Vercel's function logs.
export function logEvent(evt) { console.log(JSON.stringify({ t: new Date().toISOString(), ...evt })); }
