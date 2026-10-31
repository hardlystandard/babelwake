import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Content } from '../../src/content/types';
test('installed game reloads and loads every zone offline', async ({ page, context }) => {
  test.skip(!process.env.BABELWAKE_PRODUCTION, 'Service workers are emitted only in production builds.');
  await page.goto('/?debug=1');
  await page.waitForFunction(() => Boolean((window as unknown as { __BABELWAKE__?: unknown }).__BABELWAKE__), undefined, { timeout: 20_000 });
  await page.getByTestId('start').click();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  await context.setOffline(true);
  await page.reload();
  await page.waitForFunction(() => Boolean((window as unknown as { __BABELWAKE__?: unknown }).__BABELWAKE__), undefined, { timeout: 20_000 });
  await page.getByTestId('start').click();
  const zones = await page.evaluate(async () => {
    const game = (window as unknown as { __BABELWAKE__: { content(): Promise<Content> } }).__BABELWAKE__;
    return (await game.content()).zones.map(zone => ({ id: zone.id, evidence: zone.evidence.length }));
  });
  expect(zones).toHaveLength(6);
  expect(zones.every(zone => zone.evidence > 0)).toBe(true);
  await expect(page.locator('canvas')).toBeVisible();
});

test('offline navigation survives a host redirect from index.html to the root', async ({ browser }) => {
  test.skip(!process.env.BABELWAKE_PRODUCTION, 'Service workers are emitted only in production builds.');
  const dist = fileURLToPath(new URL('../../dist/', import.meta.url));
  const mime: Record<string, string> = {
    '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf',
    '.webmanifest': 'application/manifest+json',
  };
  // A real redirect matters: browser routing would bypass the service worker or
  // fail to preserve Response.redirected on the response stored by cache.addAll.
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    if (url.pathname === '/index.html') {
      response.writeHead(308, { Location: `/${url.search}` });
      response.end();
      return;
    }
    const file = resolve(dist, url.pathname === '/' ? 'index.html' : `.${url.pathname}`);
    if (!file.startsWith(dist.endsWith(sep) ? dist : dist + sep)) {
      response.writeHead(403); response.end(); return;
    }
    try {
      const body = await readFile(file);
      response.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404); response.end();
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}/?debug=1`);
    await page.getByTestId('start').click();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
    const cached = await page.evaluate(async () => {
      const index = await caches.match('/index.html'), root = await caches.match('/');
      return {
        index: { redirected: index?.redirected, url: index?.url, status: index?.status },
        root: { redirected: root?.redirected, url: root?.url, status: root?.status },
      };
    });
    expect(cached.index).toEqual({ redirected: true, url: `${origin}/`, status: 200 });
    expect(cached.root).toEqual({ redirected: false, url: `${origin}/`, status: 200 });
    await context.setOffline(true);
    await page.reload();
    await page.waitForFunction(() => Boolean((window as unknown as { __BABELWAKE__?: unknown }).__BABELWAKE__), undefined, { timeout: 20_000 });
    await page.getByTestId('start').click();
    const zones = await page.evaluate(async () => {
      const game = (window as unknown as { __BABELWAKE__: { content(): Promise<Content> } }).__BABELWAKE__;
      return (await game.content()).zones.map(zone => ({ id: zone.id, evidence: zone.evidence.length }));
    });
    expect(zones.map(zone => zone.id).sort()).toEqual(['atelier', 'cafe', 'gare', 'lettres', 'maison', 'marche']);
    expect(zones.every(zone => zone.evidence > 0)).toBe(true);
    await expect(page.locator('canvas')).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
