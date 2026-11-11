// POST /api/import-product  { url }  →  { ok, store, title, brand, price, currency, images[] }
// GET  /api/import-product?url=…     (same, for quick checks)
import { importProduct, errorPayload } from '../lib/import/index.js';
import { cors, sendJSON, readJSONBody, query, rateLimited, logEvent } from '../lib/http.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (!['GET', 'POST'].includes(req.method)) return sendJSON(res, 405, { ok: false, code: 'METHOD' });
  if (rateLimited(req)) return sendJSON(res, 429, errorPayload({ code: 'RATE_LIMITED' }, ''));
  const input = req.method === 'POST' ? (await readJSONBody(req)).url : query(req).get('url');
  const t0 = Date.now();
  try {
    const out = await importProduct(input || '');
    logEvent({ evt: 'import', ok: true, store: out.store, extractor: out.extractor, host: new URL(out.url).hostname, images: out.images.length, source: out.sources.image, ms: Date.now() - t0 });
    return sendJSON(res, 200, out);
  } catch (e) {
    const p = errorPayload(e, input || '');
    logEvent({ evt: 'import', ok: false, code: p.code, store: p.store, status: p.status, detail: p.detail, ms: Date.now() - t0 });
    const http = { INVALID_URL: 400, DOMAIN_NOT_ALLOWED: 400, NOT_FOUND: 404, RATE_LIMITED: 429 }[p.code] || 422;
    return sendJSON(res, http, p);
  }
}
