// Local dev server: serves the app and the /api functions on http://localhost:8787
//   NODE_USE_ENV_PROXY=1 CLOSIA_DEV_PROXY=1 node server/dev.mjs   (behind an egress proxy)
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import importProduct from '../api/import-product.js';
import productImage from '../api/product-image.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain' };
const routes = { '/api/import-product': importProduct, '/api/product-image': productImage };
const port = Number(process.env.PORT || 8787);

http.createServer(async (req, res) => {
  const path = new URL(req.url, 'http://x').pathname;
  if (routes[path]) return routes[path](req, res);
  const file = normalize(join(root, path === '/' ? 'index.html' : decodeURIComponent(path)));
  if (!file.startsWith(root) || /\/(lib|api|server|test|scripts|node_modules)\//.test(file.slice(root.length - 1))) { res.statusCode = 404; return res.end(); }
  try { if ((await stat(file)).isDirectory()) throw 0; res.setHeader('content-type', types[extname(file)] || 'application/octet-stream'); res.end(await readFile(file)); }
  catch { res.statusCode = 404; res.end('not found'); }
}).listen(port, () => console.log(`Closia dev server → http://localhost:${port}`));
