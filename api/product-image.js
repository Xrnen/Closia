// GET /api/product-image?url=…  →  image bytes from an allow-listed CDN, so the app
// can save the picture locally (the browser cannot read cross-origin pixels).
import { safeFetch } from '../lib/import/fetcher.js';
import { errorPayload } from '../lib/import/index.js';
import { cors, sendJSON, query, rateLimited, logEvent } from '../lib/http.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return sendJSON(res, 405, { ok: false, code: 'METHOD' });
  if (rateLimited(req, 120)) return sendJSON(res, 429, errorPayload({ code: 'RATE_LIMITED' }, ''));
  const url = query(req).get('url') || '';
  try {
    const img = await safeFetch(url, { kind: 'image', timeoutMs: 15000 });
    res.statusCode = 200;
    res.setHeader('content-type', img.type);
    res.setHeader('cache-control', 'public, max-age=86400');
    res.setHeader('x-content-type-options', 'nosniff');
    res.end(img.body);
  } catch (e) {
    const p = errorPayload(e, url);
    logEvent({ evt: 'image', ok: false, code: p.code, store: p.store, status: p.status, detail: p.detail });
    sendJSON(res, p.code === 'DOMAIN_NOT_ALLOWED' || p.code === 'INVALID_URL' ? 400 : 422, p);
  }
}
