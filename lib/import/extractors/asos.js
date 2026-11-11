// ASOS. Product id comes from /prd/<id>. The product JSON endpoint used by the
// ASOS website is tried first, then the page itself. Both sit behind ASOS's bot
// protection, which often stalls server requests (TIMEOUT) or blocks them.
import { genericExtract, normalizeImages } from '../extract.js';
import { ImportError } from '../errors.js';

const big = u => /images\.asos-media\.com/.test(u) ? u.split('?')[0] + '?$n_1920w$&wid=1926&fit=constrain' : u;

export default {
  id: 'asos', name: 'ASOS',
  match: host => /(^|\.)asos\.com$/.test(host),
  async extract({ url, fetchPage, fetchJSON }) {
    const id = (new URL(url).pathname.match(/\/prd\/(\d+)/) || [])[1];
    if (id) {
      try {
        const j = await fetchJSON(`https://www.asos.com/api/product/catalogue/v4/products/${id}?store=COM&lang=en-GB&currency=GBP`);
        const imgs = (j.media?.images || []).map(i => 'https://' + String(i.url).replace(/^https?:\/\//, ''));
        if (imgs.length) return {
          title: j.name || '', brand: j.brand?.name || j.brandName || 'ASOS',
          price: String(j.price?.current?.value ?? ''), currency: j.price?.currency || 'GBP',
          images: normalizeImages(imgs, url, big), sources: { image: 'store-api', title: 'store-api', price: 'store-api' },
        };
      } catch (e) { if (!(e instanceof ImportError) || e.code === 'TIMEOUT') throw e; /* fall back to the page */ }
    }
    const page = await fetchPage(url);
    const r = genericExtract(page.text, page.url);
    r.images = normalizeImages(r.images, page.url, big);
    r.brand ||= 'ASOS';
    return r;
  },
};
