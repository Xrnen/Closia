// SHEIN. Share links (onelink.shein.com) expose the product in their link-preview
// tags; full product pages usually redirect to a risk-control challenge.
import { genericExtract, normalizeImages } from '../extract.js';

const full = u => u.replace(/_thumbnail_\d+x\d*(?=\.)/, '').replace(/^http:/, 'https:');
const SHARE_TEXT = /^I discovered amazing products on SHEIN|check (it|them) out/i;

export default {
  id: 'shein', name: 'SHEIN',
  match: host => /(^|\.)shein\.com$/.test(host),
  async extract({ url, fetchPage }) {
    const page = await fetchPage(url);
    const r = genericExtract(page.text, page.url);
    // Product data embedded by SHEIN's web app, when the page is served.
    const m = page.text.match(/"goods_name"\s*:\s*"([^"]+)"/);
    if (m && (!r.title || /^SHEIN$/i.test(r.title))) { r.title = m[1]; r.sources.title = 'embedded'; }
    const sale = page.text.match(/"salePrice"\s*:\s*\{[^}]*"amount"\s*:\s*"([\d.]+)"/);
    if (sale && !r.price) { r.price = sale[1]; r.sources.price = 'embedded'; }
    const imgs = [...page.text.matchAll(/"(?:origin_image|goods_img|main_image)"\s*:\s*"([^"]+)"/g)].map(x => x[1].replace(/\\\//g, '/'));
    r.images = normalizeImages([...imgs, ...r.images], page.url, full);
    if (SHARE_TEXT.test(r.title)) r.title = '';
    r.brand ||= 'SHEIN';
    return r;
  },
};
