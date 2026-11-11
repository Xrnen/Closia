// Zara. Product pages carry JSON-LD / og:image and an embedded view payload with
// media paths. Zara's edge (Akamai Bot Manager) usually answers server requests
// with an interstitial challenge, which surfaces as BOT_PROTECTION.
import { genericExtract, normalizeImages } from '../extract.js';

const sized = u => u.replace(/\{width\}/g, '1024').replace(/\/w\/\d+\//, '/w/1024/');

export default {
  id: 'zara', name: 'ZARA',
  match: host => /(^|\.)zara\.com$/.test(host),
  async extract({ url, fetchPage }) {
    const page = await fetchPage(url);
    const r = genericExtract(page.text, page.url);
    const media = [...page.text.matchAll(/"url"\s*:\s*"(https:\/\/static\.zara\.net\/[^"]+?\.jpg[^"]*)"/g)].map(m => m[1].replace(/\\u0026/g, '&'));
    const legacy = [...page.text.matchAll(/"path"\s*:\s*"([^"]+)"\s*,\s*"name"\s*:\s*"([^"]+)"[^}]*?"timestamp"\s*:\s*"?(\d+)/g)]
      .map(m => `https://static.zara.net/photos//${m[1]}/w/1024/${m[2]}.jpg?ts=${m[3]}`);
    r.images = normalizeImages([...r.images, ...media, ...legacy], page.url, sized);
    r.brand ||= 'ZARA';
    return r;
  },
};
