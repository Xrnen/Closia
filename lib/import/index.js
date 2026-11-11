// Product import: pick the store extractor (or the generic one), fetch through the
// guarded client, normalise the result and classify failures.
import { safeFetch } from './fetcher.js';
import { checkUrl } from './guard.js';
import { genericExtract } from './extract.js';
import { ImportError, MESSAGES } from './errors.js';
import shein from './extractors/shein.js';
import zara from './extractors/zara.js';
import hm from './extractors/hm.js';
import asos from './extractors/asos.js';

export const EXTRACTORS = [shein, zara, hm, asos];
const generic = {
  id: 'generic', name: '',
  async extract({ url, fetchPage }) { const p = await fetchPage(url); return genericExtract(p.text, p.url); },
};

/** Pull the first URL out of shared text ("Nice shirt… https://…"). */
export function urlFromText(text) {
  const m = String(text || '').match(/https?:\/\/[^\s"'<>،]+/i);
  return m ? m[0].replace(/[).,]+$/, '') : '';
}

export async function importProduct(input, { timeoutMs = 12000 } = {}) {
  const raw = urlFromText(input) || String(input || '').trim();
  const url = checkUrl(raw, 'page').href;
  const host = new URL(url).hostname;
  const ex = EXTRACTORS.find(e => e.match(host)) || generic;
  const ctx = {
    url,
    fetchPage: u => safeFetch(u, { kind: 'page', timeoutMs }),
    fetchJSON: async u => JSON.parse((await safeFetch(u, { kind: 'page', accept: 'application/json', timeoutMs })).text),
  };
  const r = await ex.extract(ctx);
  if (!r.images.length) throw new ImportError('NO_IMAGE', '', { store: ex.name || host });
  return {
    ok: true, url, store: ex.name || host.replace(/^www\d?\.|^m\./, ''), extractor: ex.id,
    title: (r.title || '').slice(0, 140), brand: (r.brand || '').slice(0, 60),
    price: r.price || '', currency: (r.currency || '').toUpperCase().slice(0, 3),
    images: r.images, sources: r.sources,
  };
}

export function errorPayload(e, input) {
  const code = e instanceof ImportError ? e.code : 'FETCH_FAILED';
  let host = ''; try { host = new URL(urlFromText(input) || input).hostname; } catch {}
  const ex = EXTRACTORS.find(x => host && x.match(host));
  return { ok: false, code, message: MESSAGES[code] || MESSAGES.FETCH_FAILED, store: ex?.name || host, status: e.status || null, detail: String(e.detail || e.message || '').slice(0, 200) };
}
