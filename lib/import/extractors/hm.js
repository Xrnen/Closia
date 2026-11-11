// H&M. Pages include JSON-LD and Next.js data with image.hm.com assets. H&M's
// edge usually returns 403 "Access Denied" to server requests (BOT_PROTECTION).
import { genericExtract, normalizeImages } from '../extract.js';

const big = u => u.replace(/([?&])imwidth=\d+/, '$1imwidth=1260');

export default {
  id: 'hm', name: 'H&M',
  match: host => /(^|\.)hm\.com$/.test(host),
  async extract({ url, fetchPage }) {
    const page = await fetchPage(url);
    const r = genericExtract(page.text, page.url);
    const assets = [...page.text.matchAll(/https:\\?\/\\?\/image\.hm\.com\\?\/assets\\?\/[^"'\s\\]+?\.(?:jpe?g|png|webp)(?:\?[^"'\s\\]*)?/gi)].map(m => m[0].replace(/\\\//g, '/'));
    r.images = normalizeImages([...r.images, ...assets], page.url, big);
    r.brand ||= 'H&M';
    return r;
  },
};
