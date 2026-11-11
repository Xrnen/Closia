// Generic, dependency-free product extraction from HTML.
// Priority: JSON-LD Product → Open Graph → Twitter Card → data embedded in scripts.

const decodeEntities = s => String(s ?? '')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
const clean = s => decodeEntities(s).replace(/\s+/g, ' ').trim();

function attrs(tag) {
  const out = {}; const re = /([a-zA-Z_:.-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g; let m;
  while ((m = re.exec(tag))) out[m[1].toLowerCase()] = m[3] ?? m[4] ?? m[5] ?? '';
  return out;
}

/** All <meta> tags as { key: [values] } keyed by property/name/itemprop (lower-case). */
export function parseMeta(html) {
  const map = {}; const re = /<meta\b[^>]*>/gi; let m;
  while ((m = re.exec(html))) {
    const a = attrs(m[0]); const k = (a.property || a.name || a.itemprop || '').toLowerCase();
    if (k && a.content != null) (map[k] ||= []).push(clean(a.content));
  }
  return map;
}

/** Every JSON-LD block, parsed (invalid ones skipped). */
export function parseJsonLd(html) {
  const out = []; const re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi; let m;
  while ((m = re.exec(html))) {
    const raw = m[1].trim().replace(/^<!\[CDATA\[|\]\]>$/g, '');
    try { out.push(JSON.parse(raw)); } catch { try { out.push(JSON.parse(raw.replace(/,\s*([}\]])/g, '$1'))); } catch { /* skip */ } }
  }
  return out;
}

const imgOf = x => !x ? [] : Array.isArray(x) ? x.flatMap(imgOf) : typeof x === 'object' ? imgOf(x.contentUrl || x.url || x['@id']) : [String(x)];

/** First schema.org Product (or ProductGroup) found in JSON-LD blocks. */
export function productFromJsonLd(blocks) {
  let found = null;
  const walk = o => {
    if (found || !o || typeof o !== 'object') return;
    if (Array.isArray(o)) return o.forEach(walk);
    const t = [].concat(o['@type'] || []).join(' ');
    if (/\bProduct(Group)?\b/i.test(t)) {
      const offers = [].concat(o.offers || [], (o.hasVariant || []).flatMap(v => [].concat(v.offers || [])));
      const off = offers.find(x => x && (x.price || x.lowPrice || x.priceSpecification)) || offers[0] || {};
      const spec = [].concat(off.priceSpecification || [])[0] || {};
      found = {
        title: clean(o.name),
        brand: clean(typeof o.brand === 'string' ? o.brand : o.brand?.name),
        price: String(off.price ?? off.lowPrice ?? spec.price ?? '').trim(),
        currency: off.priceCurrency || spec.priceCurrency || '',
        images: [...imgOf(o.image), ...(o.hasVariant || []).flatMap(v => imgOf(v.image))],
      };
      return;
    }
    if (o['@graph']) walk(o['@graph']);
    if (o.mainEntity) walk(o.mainEntity);
  };
  blocks.forEach(walk);
  return found;
}

/** Image URLs embedded in inline scripts/JSON (galleries rendered by JavaScript). */
export function embeddedImages(html, prefer = /product|goods|images3_p|catalog|media|\/pi\/|assets/i) {
  const raw = html.replace(/\\u002F/gi, '/').replace(/\\\//g, '/');
  const re = /(?:https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}\/[^"'\s()<>\\]+?\.(?:jpe?g|png|webp|avif)(?:\?[^"'\s<>\\]*)?/gi;
  const seen = new Map(); let m, n = 0;
  while ((m = re.exec(raw)) && n++ < 5000) {
    let u = m[0]; if (u.startsWith('//')) u = 'https:' + u;
    if (/sprite|logo|icon|banner|flag|payment|avatar|badge|emoji|placeholder|loading|\/\d{2}x\d{2}[._]/i.test(u)) continue;
    seen.set(u, (seen.get(u) || 0) + 1);
  }
  const score = u => (prefer.test(u) ? 10 : 0) + seen.get(u);
  return [...seen.keys()].sort((a, b) => score(b) - score(a));
}

/** Absolute https URLs, de-duplicated, without obvious non-product images. */
export function normalizeImages(list, base, upgrade = u => u) {
  const out = [];
  for (const x of list) {
    if (!x) continue;
    let u; try { u = new URL(String(x).trim(), base); } catch { continue; }
    if (u.protocol === 'http:') u.protocol = 'https:';
    if (u.protocol !== 'https:' || /\.svg(\?|$)/i.test(u.pathname)) continue;
    const s = upgrade(u.href);
    if (!out.includes(s)) out.push(s);
  }
  return out.slice(0, 16);
}

/** Run the generic priority chain over a page. Returns { title, brand, price, currency, images, sources }. */
export function genericExtract(html, pageUrl) {
  const meta = parseMeta(html), first = k => (meta[k] || [])[0] || '';
  const ld = productFromJsonLd(parseJsonLd(html));
  const r = { title: '', brand: '', price: '', currency: '', images: [], sources: {} };
  const take = (field, val, src) => { if (!r[field] && val) { r[field] = val; r.sources[field] = src; } };
  if (ld) {
    take('title', ld.title, 'json-ld'); take('brand', ld.brand, 'json-ld');
    take('price', ld.price, 'json-ld'); take('currency', ld.currency, 'json-ld');
    if (ld.images.length) { r.images.push(...ld.images); r.sources.image = 'json-ld'; }
  }
  const og = [...(meta['og:image:secure_url'] || []), ...(meta['og:image'] || [])];
  if (og.length) { r.images.push(...og); r.sources.image ||= 'open-graph'; }
  const tw = [...(meta['twitter:image'] || []), ...(meta['twitter:image:src'] || [])];
  if (tw.length) { r.images.push(...tw); r.sources.image ||= 'twitter'; }
  take('title', first('og:title'), 'open-graph'); take('title', first('twitter:title'), 'twitter');
  take('price', first('product:price:amount') || first('og:price:amount'), 'open-graph');
  take('currency', first('product:price:currency') || first('og:price:currency'), 'open-graph');
  take('brand', first('product:brand') || first('og:brand'), 'open-graph');
  if (r.images.length < 2) {
    const emb = embeddedImages(html).slice(0, 12);
    if (emb.length) { r.images.push(...emb); r.sources.image ||= 'embedded'; }
  }
  if (!r.title) { const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i); take('title', t && clean(t[1]), 'title-tag'); }
  r.images = normalizeImages(r.images, pageUrl);
  r.price = String(r.price || '').replace(/[^\d.]/g, '');
  return r;
}
