// URL validation and SSRF protection for server-side fetches.
// Only HTTPS URLs on known store / image hosts are allowed, and every hostname
// (including each redirect hop) must resolve to a public IP address.
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { ImportError } from './errors.js';

// Store pages we are willing to fetch (suffix match on the hostname).
export const STORE_DOMAINS = [
  'asos.com', 'zara.com', 'hm.com', 'shein.com', 'sheingroup.com',
  'namshi.com', 'noon.com', 'ounass.com', '6thstreet.com', 'levelshoes.com',
  'mango.com', 'bershka.com', 'pullandbear.com', 'stradivarius.com', 'massimodutti.com',
  'cos.com', 'arket.com', 'uniqlo.com', 'farfetch.com', 'net-a-porter.com',
  'nike.com', 'adidas.com', 'adidas.com.sa', 'aldoshoes.com', 'charleskeith.com',
  'maxfashion.com', 'centrepointstores.com', 'splashfashions.com', 'riverisland.com',
  'boohoo.com', 'prettylittlething.com', 'nastygal.com', 'next.co.uk', 'marksandspencer.com',
  'gap.com', 'aeropostale.com', 'americaneagle.com', 'urbanoutfitters.com', 'abercrombie.com',
  'hollisterco.com', 'lacoste.com', 'tommy.com', 'calvinklein.com', 'guess.com',
];
// Image CDNs we are willing to download product pictures from.
export const IMAGE_DOMAINS = [
  'ltwebstatic.com', 'shein.com', 'zara.net', 'zara.com', 'hm.com', 'asos-media.com',
  'asos.com', 'namshi.com', 'nooncdn.com', 'ounass.com', 'mango.com', 'inditex.com',
  'uniqlo.com', 'farfetch-contents.com', 'nike.com', 'adidas.com', 'cdn.shopify.com',
  'scene7.com', 'cloudinary.com', 'imgix.net',
  ...STORE_DOMAINS,
];

const suffixMatch = (host, list) => list.some(d => host === d || host.endsWith('.' + d));

// IPv4/IPv6 ranges that must never be reached from the server.
function isPrivateIPv4(ip) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||        // carrier-grade NAT
    (a === 169 && b === 254) ||                    // link-local / cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && p[2] === 0) ||
    (a === 198 && (b === 18 || b === 19));         // benchmarking
}
function isPrivateIPv6(ip) {
  const v = ip.toLowerCase();
  if (v === '::' || v === '::1') return true;
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return /^(fc|fd)/.test(v) || /^fe[89ab]/.test(v) || v.startsWith('ff') || v.startsWith('64:ff9b:') || v.startsWith('2001:db8');
}
export function isPrivateIP(ip) {
  const kind = isIP(ip);
  if (kind === 4) return isPrivateIPv4(ip);
  if (kind === 6) return isPrivateIPv6(ip);
  return true;
}

/** Parse and check a URL. kind: 'page' | 'image'. Throws ImportError. */
export function checkUrl(raw, kind = 'page') {
  let u;
  try { u = new URL(String(raw).trim()); } catch { throw new ImportError('INVALID_URL'); }
  if (u.protocol === 'http:' && kind === 'image') u.protocol = 'https:'; // CDNs often hand out http:// links
  if (u.protocol !== 'https:') throw new ImportError('INVALID_URL', 'only https is allowed');
  if (u.username || u.password) throw new ImportError('INVALID_URL', 'credentials in URL');
  if (u.port && u.port !== '443') throw new ImportError('INVALID_URL', 'non-standard port');
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  if (isIP(host.replace(/^\[|\]$/g, ''))) throw new ImportError('DOMAIN_NOT_ALLOWED', 'IP literals are not allowed');
  const list = kind === 'image' ? IMAGE_DOMAINS : STORE_DOMAINS;
  if (!suffixMatch(host, list)) throw new ImportError('DOMAIN_NOT_ALLOWED', host);
  u.hash = '';
  return u;
}

/** Resolve the hostname and refuse private / internal addresses. */
export async function assertPublicHost(host) {
  let addrs;
  try { addrs = await lookup(host, { all: true, verbatim: true }); }
  catch (e) {
    // Local development behind an egress proxy cannot resolve names itself; the
    // proxy does. Never set this in production.
    if (process.env.CLOSIA_DEV_PROXY === '1' && e.code === 'ENOTFOUND') return;
    throw new ImportError('FETCH_FAILED', `dns: ${e.code || e.message}`);
  }
  if (!addrs.length || addrs.some(a => isPrivateIP(a.address))) throw new ImportError('DOMAIN_NOT_ALLOWED', `${host} resolves to a private address`);
}
