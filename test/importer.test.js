import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkUrl, isPrivateIP } from '../lib/import/guard.js';
import { genericExtract, parseJsonLd, productFromJsonLd } from '../lib/import/extract.js';
import { looksLikeChallenge } from '../lib/import/fetcher.js';
import { urlFromText, errorPayload } from '../lib/import/index.js';
import { ImportError } from '../lib/import/errors.js';

const fx = n => readFileSync(new URL(`./fixtures/${n}`, import.meta.url), 'utf8');

test('private and special addresses are refused', () => {
  for (const ip of ['127.0.0.1', '10.1.2.3', '172.20.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:10.0.0.1', '224.0.0.1'])
    assert.equal(isPrivateIP(ip), true, ip);
  for (const ip of ['23.45.67.89', '2606:4700::1111']) assert.equal(isPrivateIP(ip), false, ip);
});

test('only https store URLs on the allow-list pass', () => {
  assert.equal(checkUrl('https://www.zara.com/us/en/x-p1.html').hostname, 'www.zara.com');
  assert.equal(checkUrl('https://onelink.shein.com/60/abc').hostname, 'onelink.shein.com');
  for (const bad of ['http://www.zara.com/x', 'https://169.254.169.254/', 'https://[::1]/', 'https://zara.com.evil.io/', 'https://user:pw@zara.com/', 'https://www.zara.com:8443/', 'ftp://zara.com', 'not a url'])
    assert.throws(() => checkUrl(bad), ImportError, bad);
  assert.equal(checkUrl('http://img.ltwebstatic.com/a.jpg', 'image').protocol, 'https:');
  assert.throws(() => checkUrl('https://example.org/a.jpg', 'image'), ImportError);
});

test('URL is pulled out of shared text', () => {
  assert.equal(urlFromText('Nice shirt\nI discovered amazing products on SHEIN.com!\nhttps://onelink.shein.com/60/x?shc=1'), 'https://onelink.shein.com/60/x?shc=1');
});

test('SHEIN share page (real capture): title + image via Open Graph', () => {
  const r = genericExtract(fx('shein-onelink.html'), 'https://onelink.shein.com/60/67omkdope692');
  assert.match(r.title, /^MUSERA Fitted Stripe Flare/);
  assert.equal(r.sources.image, 'open-graph');
  assert.match(r.images[0], /^https:\/\/img\.ltwebstatic\.com\/v4\/j\/pi\/.+\.jpg$/);
});

test('Zara Akamai interstitial (real capture) is detected as a challenge', () => {
  assert.equal(looksLikeChallenge(fx('zara-akamai-challenge.html')), true);
  assert.equal(looksLikeChallenge('<html><head><meta property="og:image" content="x"></head></html>'), false);
});

test('JSON-LD Product wins over Open Graph, with price, currency and brand', () => {
  const html = `<html><head><meta property="og:image" content="https://cdn.shop.test/og.jpg"><meta property="og:title" content="OG title">
  <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList"},{"@type":"Product","name":"Linen Shirt","brand":{"@type":"Brand","name":"COS"},
  "image":[{"@type":"ImageObject","url":"/img/front.jpg"},"https://cdn.shop.test/back.jpg"],"offers":{"@type":"Offer","price":"59.00","priceCurrency":"EUR"}}]}</script></head></html>`;
  const r = genericExtract(html, 'https://www.cos.com/p/1');
  assert.deepEqual([r.title, r.brand, r.price, r.currency, r.sources.image], ['Linen Shirt', 'COS', '59.00', 'EUR', 'json-ld']);
  assert.deepEqual(r.images.slice(0, 3), ['https://www.cos.com/img/front.jpg', 'https://cdn.shop.test/back.jpg', 'https://cdn.shop.test/og.jpg']);
});

test('Twitter card and embedded gallery are used when nothing better exists', () => {
  const tw = genericExtract('<meta name="twitter:image" content="https://cdn.x.test/t.jpg"><meta name="twitter:title" content="Tee">', 'https://www.nike.com/t');
  assert.equal(tw.sources.image, 'twitter');
  const emb = genericExtract('<script>window.d={"goods_imgs":{"detail_image":[{"origin_image":"\\/\\/img.ltwebstatic.com\\/images3_pi\\/2024\\/a.jpg"}]}}</script>', 'https://m.shein.com/x');
  assert.equal(emb.sources.image, 'embedded');
  assert.equal(emb.images[0], 'https://img.ltwebstatic.com/images3_pi/2024/a.jpg');
});

test('AggregateOffer / ProductGroup variants', () => {
  const p = productFromJsonLd(parseJsonLd(`<script type="application/ld+json">{"@type":"ProductGroup","name":"Jeans","hasVariant":[{"@type":"Product","image":"https://a.test/1.jpg","offers":{"@type":"Offer","price":"29.99","priceCurrency":"usd"}}]}</script>`));
  assert.equal(p.price, '29.99'); assert.deepEqual(p.images, ['https://a.test/1.jpg']);
});

test('errors carry a code, Arabic message and store name', () => {
  const p = errorPayload(new ImportError('BOT_PROTECTION', '403 challenge page', { status: 403 }), 'https://www2.hm.com/en_us/productpage.1.html');
  assert.deepEqual([p.ok, p.code, p.store, p.status], [false, 'BOT_PROTECTION', 'H&M', 403]);
  assert.ok(p.message.length > 10);
});
