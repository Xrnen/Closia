// Runs the importer against real product links and prints what happened per store.
//   NODE_USE_ENV_PROXY=1 CLOSIA_DEV_PROXY=1 node scripts/live-check.mjs [url …]
import { importProduct, errorPayload } from '../lib/import/index.js';
import { safeFetch } from '../lib/import/fetcher.js';

const urls = process.argv.slice(2).length ? process.argv.slice(2) : [
  'MUSERA Fitted Stripe Flare Long Sleeve Button Up Shirt, Casual\nI discovered amazing products on SHEIN.com, come check them out!\nhttps://onelink.shein.com/60/67omkdope692?shc=2_Rd8H4rIolu4',
  'https://us.shein.com/Vertical-Striped-Shirt-p-444985-cat-1733.html',
  'https://www.zara.com/us/en/basic-relaxed-fit-washed-t-shirt-p06462410.html',
  'https://www2.hm.com/en_us/productpage.1309319011.html',
  'https://www.asos.com/us/asos-design/asos-design-essentials-regular-fit-scoop-neck-t-shirt-in-black/prd/203441291',
  'http://169.254.169.254/latest/meta-data/',
  'https://evil.example.com/product',
];
for (const u of urls) {
  const t0 = Date.now();
  try {
    const r = await importProduct(u, { timeoutMs: 15000 });
    let img = '';
    try { const i = await safeFetch(r.images[0], { kind: 'image' }); img = `image ✓ ${i.type} ${Math.round(i.body.length / 1024)}KB`; }
    catch (e) { img = `image ✗ ${errorPayload(e, r.images[0]).code}`; }
    console.log(`✅ ${r.store.padEnd(6)} ${Date.now() - t0}ms  "${r.title.slice(0, 50)}" ${r.price} ${r.currency}  ${r.images.length} img (${r.sources.image})  ${img}`);
  } catch (e) {
    const p = errorPayload(e, u);
    console.log(`❌ ${(p.store || '-').padEnd(6)} ${Date.now() - t0}ms  ${p.code}  ${p.detail}`);
  }
}
