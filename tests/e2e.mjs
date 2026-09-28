// ทดสอบงานหลักบนเบราว์เซอร์จริง (Chromium) ขนาดจอมือถือ
// จำลอง GitHub Pages ด้วยการเสิร์ฟเว็บที่ /aichuaythai-boombignose/ เพื่อพิสูจน์ว่าทุกพาธเป็นแบบ relative
// วิธีรัน: cd tests && npm install && npx playwright install chromium && npm run e2e
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tests', 'output');
const BASE = '/aichuaythai-boombignose/';
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8'
};
const D = createRequire(import.meta.url)('../assets/js/data.js');
const ITEMS = D.sections.flatMap((s) => s.items);

fs.mkdirSync(OUT, { recursive: true });

// ---------- เซิร์ฟเวอร์ไฟล์นิ่งแบบ GitHub Pages ----------
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (!url.startsWith(BASE)) { res.writeHead(404); res.end('outside base path: ' + url); return; }
  let file = path.join(ROOT, url.slice(BASE.length));
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const SITE = `http://127.0.0.1:${server.address().port}${BASE}`;

// ---------- ตัวช่วยเล็ก ๆ ----------
const results = [];
async function check(name, fn) {
  try { await fn(); results.push({ name, ok: true }); console.log('  ✓ ' + name); }
  catch (e) { results.push({ name, ok: false }); console.log('  ✗ ' + name + '\n      ' + String(e && e.message || e).split('\n')[0]); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

const browser = await chromium.launch();

async function newPage(opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width: opts.width || 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true,
    locale: 'th-TH', timezoneId: 'Asia/Bangkok', colorScheme: opts.scheme || 'light',
    reducedMotion: opts.reducedMotion || 'no-preference',
    serviceWorkers: opts.serviceWorkers || 'block'
  });
  // เทสต์ไม่ต้องโทรออกจริง: กันลิงก์ tel: ไว้ แต่ยังให้แอนิเมชันของแอปทำงาน
  await ctx.addInitScript(() => {
    window.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('a[href^="tel:"]')) e.preventDefault(); }, true);
  });
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()} ${r.url()}`); });
  page.on('request', (r) => {
    const u = r.url();
    if (u.startsWith('http://127.0.0.1') && !u.includes(BASE)) problems.push('request outside base path: ' + u);
  });
  return { ctx, page, problems };
}
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const visibleRows = (page) => page.$$eval('#list .item', (els) => els.filter((e) => !e.hidden && !e.closest('.sec').hidden).length);

console.log('\nเพื่อนยามรถเสีย — e2e @ ' + SITE + '\n');

// ---------- 1) พาธ relative + ขนาดไฟล์ ----------
await check('ทุกไฟล์ใน index.html อ้างอิงแบบ relative (ใช้กับ GitHub Pages ได้)', async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  const bad = refs.filter((u) => u.startsWith('/') || /^https?:/.test(u));
  assert(refs.length > 8, 'หา src/href ไม่เจอ');
  assert(!bad.length, 'พาธไม่ relative: ' + bad.join(', '));
  const css = fs.readFileSync(path.join(ROOT, 'assets/css/style.css'), 'utf8');
  const cssUrls = [...css.matchAll(/url\((['"]?)([^'")]+)\1\)/g)].map((m) => m[2]).filter((u) => !u.startsWith('data:'));
  assert(cssUrls.every((u) => !u.startsWith('/') && !/^https?:/.test(u)), 'CSS url ไม่ relative: ' + cssUrls);
});

await check('เว็บเบา: HTML+CSS+JS+ฟอนต์ รวมกัน (gzip) ไม่เกิน 90 KB', async () => {
  const files = ['index.html', 'assets/css/style.css', 'assets/js/data.js', 'assets/js/core.js', 'assets/js/fx.js',
    'assets/js/app.js', 'assets/vendor/anime.slim.min.js', 'assets/fonts/prompt-400.woff2', 'assets/fonts/prompt-600.woff2'];
  const sizes = files.map((f) => zlib.gzipSync(fs.readFileSync(path.join(ROOT, f)), { level: 9 }).length);
  const total = sizes.reduce((a, b) => a + b, 0);
  console.log('      ' + files.map((f, i) => `${path.basename(f)} ${(sizes[i] / 1024).toFixed(1)}KB`).join(' · '));
  console.log(`      รวม ${(total / 1024).toFixed(1)} KB (gzip)`);
  assert(total < 90 * 1024, `หนักเกินไป: ${(total / 1024).toFixed(1)} KB`);
});

// ---------- 2) หน้าเว็บ + แอนิเมชัน ----------
{
  const { ctx, page, problems } = await newPage();
  await check('เปิดหน้าได้ ไม่มี error โหลด anime.js + ฟอนต์ครบ', async () => {
    await page.goto(SITE);
    await page.waitForLoadState('networkidle');
    assert((await page.title()).includes('เพื่อนยามรถเสีย'), 'title ผิด');
    assert(await page.evaluate(() => typeof window.anime?.animate === 'function'), 'ไม่มี window.anime');
    assert(await page.evaluate(() => document.fonts.check('600 16px Prompt')), 'ฟอนต์ Prompt ไม่โหลด');
    assert(!problems.length, problems.join('\n'));
  });
  await check(`แสดงเบอร์ครบทุกหมวด (${D.sections.length} หมวด ${ITEMS.length} เบอร์) และทุกแถวเป็นลิงก์ tel: ที่ถูกต้อง`, async () => {
    assert(await page.locator('.sec').count() === D.sections.length, 'จำนวนหมวดผิด');
    assert(await page.locator('.chip').count() === D.sections.length, 'จำนวนปุ่มหมวดผิด');
    const hrefs = await page.$$eval('#list a.num', (as) => as.map((a) => a.getAttribute('href')));
    assert(hrefs.length === ITEMS.length, `จำนวนเบอร์ผิด ${hrefs.length}`);
    assert(hrefs.every((h) => /^tel:\d{3,10}$/.test(h)), 'ลิงก์ผิด: ' + hrefs.find((h) => !/^tel:\d{3,10}$/.test(h)));
    assert((await page.getAttribute('#list .sec:first-child a.num', 'href')) === 'tel:1669', 'เบอร์แรกต้องเป็น 1669');
    assert((await page.textContent('#checked')).includes('25'), 'ไม่แสดงวันที่ตรวจสอบ');
  });
  await check('ฉากรถสไลด์เล่นจนจบ: รถที่เสียขึ้นไปอยู่บนกระบะ และมีเครื่องหมายถูก', async () => {
    await page.waitForTimeout(6800);
    const s = await page.evaluate(() => {
      const m = (sel) => new DOMMatrix(getComputedStyle(document.querySelector(sel)).transform);
      const car = m('.h-car'), truck = m('.h-truck');
      return {
        car: [car.e, car.f, Math.atan2(car.b, car.a)], truckX: truck.e,
        badge: getComputedStyle(document.querySelector('.h-badge')).opacity,
        steps: getComputedStyle(document.querySelector('.steps li')).opacity
      };
    });
    const [cx, cy, rot] = s.car;
    assert(Math.abs(cx - 118) < 0.5 && Math.abs(cy + 26) < 0.5 && Math.abs(rot) < 0.001, 'รถไม่อยู่บนกระบะ: ' + s.car);
    assert(Math.abs(s.truckX) < 0.5, 'รถสไลด์ไม่ถึงที่: ' + s.truckX);
    assert(s.badge === '1' && s.steps === '1', 'badge/ขั้นตอนไม่แสดง');
    await page.screenshot({ path: path.join(OUT, 'home.png') });
    await page.screenshot({ path: path.join(OUT, 'home-full.png'), fullPage: true });
  });
  await check('แตะภาพเพื่อเล่นฉากซ้ำได้', async () => {
    await page.click('.hero-art');
    await page.waitForTimeout(250);
    const x = await page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('.h-truck')).transform).e);
    assert(x > 100, 'ไม่เริ่มเล่นใหม่: ' + x);
  });
  await check('แตะแถวเบอร์: ไอคอนโทรศัพท์สั่นเหมือนกำลังโทร', async () => {
    const row = page.locator('#list a.num').first();
    await row.scrollIntoViewIfNeeded();
    await row.click();
    // เก็บมุมที่เอียงมากที่สุดระหว่างแอนิเมชัน (ครึ่งวินาที)
    const rot = await page.evaluate(() => new Promise((resolve) => {
      const ic = document.querySelector('#list a.num .call .ic');
      let max = 0;
      const t0 = performance.now();
      (function tick() {
        const m = new DOMMatrix(getComputedStyle(ic).transform);
        max = Math.max(max, Math.abs(Math.atan2(m.b, m.a)));
        if (performance.now() - t0 < 500) requestAnimationFrame(tick); else resolve(max);
      })();
    }));
    assert(rot > 0.15, 'ไอคอนไม่ขยับ: ' + rot);
  });
  await check('ค้นหา: พิมพ์เบอร์ / ชื่อ / ชื่อหมวด แล้วกรองถูก และล้างคำค้นได้', async () => {
    await page.fill('#q', '1669');
    assert(await visibleRows(page) === 1, 'ค้น 1669 ต้องเหลือ 1 แถว');
    const sample = D.sections[D.sections.length - 1].items[0];
    await page.fill('#q', sample.name);
    assert(await visibleRows(page) >= 1, 'ค้นชื่อไม่เจอ: ' + sample.name);
    await page.fill('#q', D.sections[0].title);
    assert(await visibleRows(page) >= D.sections[0].items.length, 'ค้นชื่อหมวดไม่เจอ');
    await page.fill('#q', 'ไม่มีคำนี้แน่นอน');
    assert(await page.isVisible('#empty'), 'ไม่แสดงข้อความไม่พบ');
    assert(await page.locator('.chip:visible').count() === 0, 'ปุ่มหมวดควรซ่อน');
    await page.click('#empty-clear');
    assert(await visibleRows(page) === ITEMS.length, 'ล้างคำค้นแล้วต้องเห็นทุกเบอร์');
    assert(await page.isHidden('#q-clear'), 'ปุ่มล้างควรซ่อน');
  });
  await check('ปุ่มหมวด: กดแล้วเลื่อนไปหมวดนั้นและไฮไลต์ปุ่ม', async () => {
    const last = D.sections[D.sections.length - 1];
    await page.click(`.chip[href="#sec-${last.id}"]`);
    await page.waitForTimeout(1200);
    const top = await page.evaluate((id) => document.getElementById('sec-' + id).getBoundingClientRect().top, last.id);
    assert(top < 400, 'ไม่เลื่อนไปหมวด: ' + top);
    assert(await page.locator(`.chip.on[href="#sec-${last.id}"]`).count() === 1, 'ปุ่มหมวดไม่ไฮไลต์');
  });
  await check('ไม่มีการเลื่อนแนวนอนที่จอ 390px และไม่มี error', async () => {
    assert(await noOverflow(page));
    assert(!problems.length, problems.join('\n'));
  });
  await ctx.close();
}

// ---------- 3) จอเล็ก + โหมดมืด + ลิงก์ตรงไปหมวด ----------
{
  const { ctx, page, problems } = await newPage({ width: 360, scheme: 'dark' });
  const target = D.sections[Math.min(3, D.sections.length - 1)];
  await check('เปิดลิงก์ #sec-... แล้วเลื่อนไปหมวดนั้นทันที', async () => {
    await page.goto(SITE + '#sec-' + target.id);
    await page.waitForTimeout(800);
    const top = await page.evaluate((id) => document.getElementById('sec-' + id).getBoundingClientRect().top, target.id);
    assert(top < 300 && top > 0, 'ตำแหน่งหมวดผิด: ' + top);
  });
  await check('จอกว้าง 360px โหมดมืด: ไม่ล้นแนวนอน ไม่มี error', async () => {
    await page.goto(SITE);
    await page.waitForTimeout(7000);
    assert(await noOverflow(page), 'ล้นแนวนอน');
    await page.screenshot({ path: path.join(OUT, 'dark-360.png'), fullPage: true });
    assert(!problems.length, problems.join('\n'));
  });
  await ctx.close();
}

// ---------- 4) ทนทาน: ไม่มี anime.js / ลดการเคลื่อนไหว / เปิดจากไฟล์ / ออฟไลน์ ----------
{
  const { ctx, page } = await newPage();
  await ctx.route('**/anime.slim.min.js', (r) => r.abort());
  await check('โหลด anime.js ไม่ได้ ก็ยังเห็นเบอร์ครบ (ภาพหน้าแรกเป็นภาพนิ่ง)', async () => {
    await page.goto(SITE);
    await page.waitForSelector('html.no-anim');
    const truck = await page.evaluate(() => getComputedStyle(document.querySelector('.h-truck')).transform);
    assert(truck === 'none', 'รถสไลด์ต้องอยู่ในภาพนิ่ง: ' + truck);
    assert(await visibleRows(page) === ITEMS.length);
    await page.fill('#q', '191');
    assert(await visibleRows(page) === 1, 'ค้นหาไม่ทำงาน');
  });
  await ctx.close();
}
{
  const { ctx, page, problems } = await newPage({ reducedMotion: 'reduce' });
  await check('ผู้ใช้ตั้ง "ลดการเคลื่อนไหว": เนื้อหาแสดงทันที ไม่มีฉากเคลื่อนไหว', async () => {
    await page.goto(SITE);
    await page.waitForTimeout(200);
    const s = await page.evaluate(() => ({
      steps: getComputedStyle(document.querySelector('.steps li')).opacity,
      row: getComputedStyle(document.querySelector('#list .item')).opacity,
      truck: getComputedStyle(document.querySelector('.h-truck')).transform
    }));
    assert(s.steps === '1' && s.row === '1' && s.truck === 'none', JSON.stringify(s));
    assert(!problems.length, problems.join('\n'));
  });
  await ctx.close();
}
{
  const { ctx, page, problems } = await newPage();
  await check('ดับเบิลคลิกเปิด index.html จากเครื่อง (file://) ก็ใช้งานได้', async () => {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForSelector('#list a.num');
    assert(await visibleRows(page) === ITEMS.length, 'เบอร์ไม่ครบ');
    // Chrome ไม่ให้โหลดฟอนต์จาก file:// (จะใช้ฟอนต์ไทยของเครื่องแทน) นอกนั้นต้องไม่มี error
    const real = problems.filter((p) => !/font|ERR_FAILED/.test(p));
    assert(!real.length, real.join('\n'));
  });
  await ctx.close();
}
{
  const { ctx, page } = await newPage({ serviceWorkers: 'allow' });
  await check('Service worker เก็บไฟล์ไว้ เปิดซ้ำตอนออฟไลน์ก็ยังเห็นเบอร์', async () => {
    await page.goto(SITE);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();
    await ctx.setOffline(true);
    await page.reload();
    await page.waitForSelector('#list a.num');
    assert(await visibleRows(page) === ITEMS.length, 'ออฟไลน์แล้วเบอร์ไม่ครบ');
    await ctx.setOffline(false);
  });
  await ctx.close();
}

await browser.close();
server.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} ผ่าน` + (failed.length ? ` — ไม่ผ่าน ${failed.length}` : ' ✅'));
console.log('ภาพหน้าจออยู่ที่ tests/output/\n');
process.exit(failed.length ? 1 : 0);
