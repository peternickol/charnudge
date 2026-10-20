import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const chromeCandidates = [
  process.env.CHROME_PATH,
  '/root/.cache/ms-playwright/chromium-1148/chrome-linux/chrome',
  '/root/.hermes/tools/chromium-1208/chrome-linux64/chrome',
].filter(Boolean);

async function loadChromium() {
  const chrome = chromeCandidates.find((candidate) => fs.existsSync(candidate));
  if (!chrome) return null;
  const modules = [
    'playwright',
    'playwright-core',
    '/root/.bun/install/cache/playwright-core@1.63.0@@@1/index.mjs',
  ];
  for (const specifier of modules) {
    try {
      const imported = await import(specifier);
      const chromium = imported.chromium || imported.default?.chromium;
      if (chromium) return { chromium, chrome };
    } catch {
      // Try the next install of Playwright.
    }
  }
  return null;
}

async function serve(directory) {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (url.pathname === '/favicon.ico') {
      response.writeHead(204);
      response.end();
      return;
    }
    const decoded = decodeURIComponent(url.pathname);
    const file = path.resolve(directory, `.${decoded}`);
    if (file !== directory && !file.startsWith(directory + path.sep)) {
      response.writeHead(403);
      response.end();
      return;
    }
    const target = fs.existsSync(file) && fs.statSync(file).isDirectory()
      ? path.join(file, 'index.html')
      : file;
    fs.readFile(target, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end('not found');
        return;
      }
      const types = {
        '.js': 'text/javascript',
        '.html': 'text/html',
        '.css': 'text/css',
        '.png': 'image/png',
      };
      const type = types[path.extname(target)] || 'application/octet-stream';
      response.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
      response.end(data);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

function badge(page, field) {
  return page.locator(`#${field}`).locator('xpath=ancestor::div[contains(@class,"charnudge")]');
}

test('a field shows used/limit and nudges near the end', { timeout: 90000 }, async (t) => {
  const loaded = await loadChromium();
  if (!loaded) {
    t.skip('Chromium is not installed');
    return;
  }
  const { chromium, chrome } = loaded;
  const { server, url } = await serve(root);
  const browser = await chromium.launch({
    executablePath: chrome,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.goto(`${url}/demo/`, { waitUntil: 'networkidle' });
    assert.deepEqual(errors, []);

    const note = badge(page, 'note');
    const count = note.locator('.charnudge-count');
    assert.equal(await count.innerText(), '0/100');
    assert.equal(await note.evaluate((node) => node.className), 'charnudge');
    assert.equal(await page.locator('#build').locator('xpath=ancestor::div[contains(@class,"charnudge")]').locator('.charnudge-count').innerText(), '0/1024');

    await page.locator('#note').fill('a'.repeat(89));
    assert.equal(await count.innerText(), '89/100');
    assert.equal(await note.evaluate((node) => node.classList.contains('is-warn')), false);

    await page.locator('#note').fill('a'.repeat(90));
    assert.equal(await count.innerText(), '90/100');
    assert.equal(await note.evaluate((node) => node.classList.contains('is-warn')), true);
    assert.equal(await note.locator('[aria-live="polite"]').innerText(), 'Near the character limit');
    assert.match(await page.locator('#note').getAttribute('aria-describedby'), /charnudge-status-/);
    assert.equal(await note.locator('.charnudge-status').first().innerText(), '90 of 100 characters');
    assert.equal(await count.evaluate((node) => getComputedStyle(node).color), 'rgb(16, 17, 19)');
    assert.equal(await count.evaluate((node) => getComputedStyle(node).backgroundColor), 'rgb(255, 90, 69)');
    const noteBox = await page.locator('#note').boundingBox();
    const badgeBox = await count.boundingBox();
    assert.ok(badgeBox.x >= noteBox.x);
    assert.ok(badgeBox.y >= noteBox.y);
    assert.ok(badgeBox.x + badgeBox.width <= noteBox.x + noteBox.width + 1);
    assert.ok(badgeBox.y + badgeBox.height <= noteBox.y + noteBox.height + 1);
    await page.screenshot({ path: '/tmp/charnudge-warn.png' });
    await count.screenshot({ path: '/tmp/charnudge-warn-badge.png' });

    await page.locator('#note').fill('a'.repeat(100));
    assert.equal(await count.innerText(), '100/100');
    assert.equal(await note.evaluate((node) => node.classList.contains('is-warn')), true);

    await page.locator('#note').fill('👍');
    assert.equal(await count.innerText(), '2/100');

    await page.locator('#note').fill('a'.repeat(101));
    assert.equal(await count.innerText(), '101/100');
    assert.equal(await note.evaluate((node) => node.classList.contains('is-over')), true);
    assert.equal(await note.locator('[aria-live="polite"]').innerText(), 'Over the character limit');
    assert.equal(await count.evaluate((node) => getComputedStyle(node).color), 'rgb(255, 255, 255)');
    assert.equal(await count.evaluate((node) => getComputedStyle(node).backgroundColor), 'rgb(159, 29, 22)');

    const name = badge(page, 'name');
    await page.locator('#name').fill('a'.repeat(80));
    assert.equal(await page.locator('#name').inputValue(), 'a'.repeat(40));
    assert.equal(await name.locator('.charnudge-count').innerText(), '40/40');
    assert.equal(await name.evaluate((node) => node.classList.contains('is-warn')), true);
    assert.equal(await name.locator('.charnudge-count').evaluate((node) => getComputedStyle(node).color), 'rgb(16, 17, 19)');
    const clearance = await name.evaluate((node) => {
      const field = node.querySelector('input');
      const badge = node.querySelector('.charnudge-count');
      const pad = parseFloat(getComputedStyle(field).paddingRight);
      const fieldBox = field.getBoundingClientRect();
      const badgeBox = badge.getBoundingClientRect();
      return {
        pad,
        badgeWidth: badgeBox.width,
        variable: node.style.getPropertyValue('--charnudge-pad'),
        gap: badgeBox.left - (fieldBox.right - pad),
      };
    });
    assert.ok(clearance.pad >= clearance.badgeWidth + 16, JSON.stringify(clearance));
    assert.match(clearance.variable, /^\d+px$/);
    assert.ok(clearance.gap >= 8, JSON.stringify(clearance));
    await name.screenshot({ path: '/tmp/charnudge-name.png' });
    await page.setViewportSize({ width: 390, height: 800 });
    const narrow = await name.evaluate((node) => {
      const field = node.querySelector('input');
      const badge = node.querySelector('.charnudge-count');
      const pad = parseFloat(getComputedStyle(field).paddingRight);
      const fieldBox = field.getBoundingClientRect();
      const badgeBox = badge.getBoundingClientRect();
      const note = document.querySelector('#note').getBoundingClientRect();
      const noteBadge = document.querySelector('#note').parentElement.querySelector('.charnudge-count').getBoundingClientRect();
      return {
        gap: badgeBox.left - (fieldBox.right - pad),
        badgeInside: noteBadge.right <= note.right + 1 && noteBadge.bottom <= note.bottom + 1,
      };
    });
    assert.ok(narrow.gap >= 8, JSON.stringify(narrow));
    assert.equal(narrow.badgeInside, true);
    await page.screenshot({ path: '/tmp/charnudge-narrow.png' });
    await page.setViewportSize({ width: 900, height: 900 });
    await page.locator('#short-form button[type="reset"]').click();
    await page.waitForFunction(() => document.querySelector('#name').value === '');
    assert.equal(await name.locator('.charnudge-count').innerText(), '0/40');
    assert.equal(await name.evaluate((node) => node.className), 'charnudge');

    const wraps = await page.locator('.charnudge').count();
    await page.evaluate(() => import('../src/index.js').then((mod) => mod.start()));
    assert.equal(await page.locator('.charnudge').count(), wraps);

    const logs = [];
    page.on('console', (message) => {
      if (message.type() === 'error') logs.push(message.text());
    });
    await page.evaluate(async () => {
      const add = (id, attrs) => {
        const node = document.createElement('input');
        node.id = id;
        node.setAttribute('data-charnudge', '');
        for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
        document.body.append(node);
      };
      add('skip-box', { type: 'checkbox' });
      add('bad-max', { type: 'text', 'data-charnudge-max': 'soon' });
      add('bad-warn', { type: 'text', 'data-charnudge-warn': 'later' });
      add('later', { type: 'text', 'data-charnudge-max': '12' });
      const mod = await import('../src/index.js');
      mod.start();
    });
    const wrapped = (id) => page.locator(`#${id}`).locator('xpath=ancestor::div[contains(@class,"charnudge")]');
    assert.equal(await wrapped('skip-box').count(), 0);
    assert.equal(await wrapped('bad-max').count(), 0);
    assert.equal(await wrapped('bad-warn').count(), 0);
    assert.equal(await wrapped('later').locator('.charnudge-count').innerText(), '0/12');
    assert.ok(logs.some((line) => /positive whole-number/.test(line)));
    assert.ok(logs.some((line) => /fraction from 0 to 1/.test(line)));
    assert.ok(logs.every((line) => /positive whole-number|fraction from 0 to 1/.test(line)));

    const quiet = await count.evaluate((node) => getComputedStyle(node).backgroundColor);
    await page.locator('#note').fill('a'.repeat(42));
    await page.screenshot({ path: '/tmp/charnudge-demo.png' });
    await page.locator('#theme').click();
    const dark = await count.evaluate((node) => getComputedStyle(node).backgroundColor);
    assert.notEqual(dark, quiet);
    assert.equal(dark, 'rgb(44, 48, 54)');
    await page.screenshot({ path: '/tmp/charnudge-demo-dark.png' });
    await page.locator('#note').fill('a'.repeat(90));
    assert.equal(await count.evaluate((node) => getComputedStyle(node).color), 'rgb(16, 17, 19)');
    assert.equal(await count.evaluate((node) => getComputedStyle(node).backgroundColor), 'rgb(255, 90, 69)');
    await count.screenshot({ path: '/tmp/charnudge-warn-dark.png' });
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
