import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? 'playwright');
const output = 'tests/planner/.output/sharing';
await mkdir(output, { recursive: true });
const plan = { sanitizerVersion: 1, title: 'Tokyo shared itinerary', destinationCity: 'Tokyo', dayCount: 1, days: [{ label: 'Day 1', items: [{ type: 'place', placeId: 'GOOGLE:sensoji', name: 'Senso-ji', lat: 35.7148, lng: 139.7967, notes: 'Book tickets' }, { type: 'note', noteContent: 'Bring water' }] }] };
const gateway = createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.url?.endsWith('/unavailable')) { res.statusCode = 404; res.end('{}'); }
  else if (req.url?.endsWith('/offline')) { res.statusCode = 503; res.end('{}'); }
  else res.end(JSON.stringify({ plan, authorName: null, publishedAt: '2026-10-14T00:00:00Z', listedInExplore: true }));
});
await new Promise(resolve => gateway.listen(0, '127.0.0.1', resolve));
const gatewayPort = gateway.address().port;
const origin = 'http://localhost:3017';
const app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--port', '3017'], { env: { ...process.env, NAVIO_API_BASE_URL: `http://127.0.0.1:${gatewayPort}`, NAVIO_BUILD_DIR: '.next-sharing-check' }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let logs = '';
app.stdout.on('data', value => { logs += value; });
app.stderr.on('data', value => { logs += value; });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 90; i++) {
    if (logs.includes('Ready in')) { ready = true; break; }
    if (app.exitCode !== null) throw new Error(logs);
    await setTimeout(1000);
  }
  assert.ok(ready, logs);
  for (const width of [360, 768, 1024, 1440]) {
    await new Promise((resolve, reject) => {
      const test = spawn(process.execPath, ['tests/planner/sharing.browser.mjs'], { env: { ...process.env, NAVIO_TEST_ORIGIN: origin, NAVIO_TEST_WIDTH: String(width), NAVIO_TEST_THEME: width === 1440 ? 'light' : 'dark' }, stdio: 'inherit', windowsHide: true });
      test.on('exit', code => code === 0 ? resolve() : reject(new Error(`Sharing test exited ${code}`)));
    });
  }
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const width of [360, 768, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    await context.addInitScript(() => localStorage.setItem('theme', 'dark'));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await context.route(`${origin}/api/**`, route => route.fulfill({ status: 401, json: { message: 'Anonymous test' } }));
    await page.goto(`${origin}/share/plans/fixture`, { timeout: 180000, waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Tokyo shared itinerary', exact: true }).waitFor({ timeout: 90000 });
    await page.getByRole('heading', { name: 'Senso-ji', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: /Auto plan|Add place|Trip options for/ }).count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `${output}/shared-dark-${width}.png` });
    await page.reload();
    await page.getByRole('heading', { name: 'Tokyo shared itinerary', exact: true }).waitFor();
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS anonymous shared page ${width}`);
  }
  const page = await browser.newPage();
  await page.goto(`${origin}/share/plans/offline`);
  await page.getByRole('button', { name: 'Try again' }).waitFor();
  await page.goto(`${origin}/share/plans/unavailable`);
  await page.getByRole('heading', { name: 'This shared plan is no longer available' }).waitFor();
  console.log('PASS unavailable and retry states');
} catch (error) { console.error(logs.slice(-5000)); throw error; }
finally { await browser?.close(); app.kill(); gateway.close(); }
