// Guarded HTTP client: allow-listed hosts only, public IPs only, manual redirects
// (each hop re-checked), timeouts, size limits and bot-protection detection.
// It identifies itself honestly and never tries to solve or evade challenges.
import { checkUrl, assertPublicHost } from './guard.js';
import { ImportError } from './errors.js';

export const USER_AGENT = 'Mozilla/5.0 (compatible; ClosiaImporter/1.0; +https://xrnen.github.io/Closia/)';

const CHALLENGE_MARKERS = [
  /bm-verify=|\/_sec\/verify|akam-logo|interstitial\/ic\.html/i,   // Akamai Bot Manager
  /<title>\s*Access Denied\s*<\/title>|errors\.edgesuite\.net/i,     // Akamai edge block
  /px-captcha|_pxCaptcha|perimeterx/i,                               // PerimeterX / HUMAN
  /_Incapsula_Resource|incap_ses_/i,                                 // Imperva
  /cf-chl-|challenge-platform|<title>Just a moment\.\.\.<\/title>/i, // Cloudflare
  /captcha-delivery\.com|geo\.captcha/i,                             // DataDome
  /\/risk\/challenge|captcha_type=/i,                                // SHEIN risk control
];
export const looksLikeChallenge = text => CHALLENGE_MARKERS.some(re => re.test(text));

async function readLimited(res, maxBytes) {
  const len = Number(res.headers.get('content-length') || 0);
  if (len && len > maxBytes) throw new ImportError('TOO_LARGE', `${len} bytes`);
  const reader = res.body.getReader(); const chunks = []; let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { reader.cancel().catch(() => {}); throw new ImportError('TOO_LARGE', `>${maxBytes} bytes`); }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map(c => Buffer.from(c)));
}

/**
 * Fetch an allow-listed URL. kind 'page' returns text, 'image' returns a Buffer.
 * Throws ImportError with BOT_PROTECTION / TIMEOUT / NOT_FOUND / FETCH_FAILED ...
 */
export async function safeFetch(rawUrl, { kind = 'page', accept, timeoutMs = 12000, maxBytes = kind === 'image' ? 12e6 : 4e6, maxRedirects = 5 } = {}) {
  let url = checkUrl(rawUrl, kind);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    for (let hop = 0; ; hop++) {
      await assertPublicHost(url.hostname);
      let res;
      try {
        res = await fetch(url, {
          redirect: 'manual', signal: ctrl.signal,
          headers: {
            'user-agent': USER_AGENT,
            accept: accept || (kind === 'image' ? 'image/avif,image/webp,image/jpeg,image/png,image/*;q=0.8' : 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.5'),
            'accept-language': 'en-US,en;q=0.9,ar;q=0.8',
          },
        });
      } catch (e) {
        if (e.name === 'AbortError' || ctrl.signal.aborted) throw new ImportError('TIMEOUT', `${timeoutMs}ms`);
        throw new ImportError('FETCH_FAILED', e.cause?.code || e.message);
      }
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        if (hop >= maxRedirects) throw new ImportError('FETCH_FAILED', 'too many redirects');
        const next = new URL(res.headers.get('location'), url);
        if (looksLikeChallenge(next.href)) throw new ImportError('BOT_PROTECTION', `redirect to ${next.hostname}${next.pathname}`, { status: res.status });
        url = checkUrl(next.href, kind);   // every hop must stay on allowed hosts
        continue;
      }
      if (res.status === 404 || res.status === 410) throw new ImportError('NOT_FOUND', String(res.status), { status: res.status });
      if (res.status === 429) throw new ImportError('BOT_PROTECTION', 'rate limited by store (429)', { status: 429 });
      const buf = await readLimited(res, maxBytes);
      const type = res.headers.get('content-type') || '';
      if (kind === 'image') {
        if (!res.ok) throw new ImportError(res.status === 403 ? 'BOT_PROTECTION' : 'FETCH_FAILED', `image ${res.status}`, { status: res.status });
        if (!/^image\//i.test(type)) throw new ImportError('NOT_IMAGE', type);
        return { url: url.href, status: res.status, type, body: buf };
      }
      const text = buf.toString('utf8');
      if (looksLikeChallenge(text) || res.status === 403 || res.status === 503) {
        throw new ImportError('BOT_PROTECTION', `${res.status}${looksLikeChallenge(text) ? ' challenge page' : ''}`, { status: res.status });
      }
      if (!res.ok) throw new ImportError('FETCH_FAILED', `HTTP ${res.status}`, { status: res.status });
      return { url: url.href, status: res.status, type, text };
    }
  } finally { clearTimeout(timer); }
}
