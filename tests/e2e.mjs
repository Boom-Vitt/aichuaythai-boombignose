// ทดสอบงานหลักบนเบราว์เซอร์จริง (Chromium) ขนาดจอมือถือ
// จำลอง GitHub Pages ด้วยการเสิร์ฟเว็บที่ /aichuaythai-boombignose/ เพื่อพิสูจน์ว่าทุกพาธเป็นแบบ relative
// วิธีรัน: cd tests && npm install && npx playwright install chromium && npm run e2e
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tests', 'output');
const BASE = '/aichuaythai-boombignose/';
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8'
};
const BANGNA = { latitude: 13.6702, longitude: 100.6068, accuracy: 18 };

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
    geolocation: BANGNA, permissions: opts.denyGps ? [] : ['geolocation'],
    serviceWorkers: opts.serviceWorkers || 'block'
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
const hash = (page) => page.evaluate(() => location.hash);

console.log('\nเพื่อนยามรถเสีย — e2e @ ' + SITE + '\n');

// ---------- 1) พาธ relative + ขนาดไฟล์ ----------
await check('ทุกไฟล์ใน index.html อ้างอิงแบบ relative (ใช้กับ GitHub Pages ได้)', async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  const bad = refs.filter((u) => u.startsWith('/') || /^https?:/.test(u));
  assert(refs.length > 10, 'หา src/href ไม่เจอ');
  assert(!bad.length, 'พาธไม่ relative: ' + bad.join(', '));
  const css = fs.readFileSync(path.join(ROOT, 'assets/css/style.css'), 'utf8');
  const cssUrls = [...css.matchAll(/url\((['"]?)([^'")]+)\1\)/g)].map((m) => m[2]).filter((u) => !u.startsWith('data:'));
  assert(cssUrls.every((u) => !u.startsWith('/') && !/^https?:/.test(u)), 'CSS url ไม่ relative: ' + cssUrls);
});

await check('เว็บเบา: HTML+CSS+JS+ฟอนต์ รวมกัน (gzip) ไม่เกิน 110 KB', async () => {
  const files = ['index.html', 'assets/css/style.css', 'assets/js/data.js', 'assets/js/core.js', 'assets/js/fx.js',
    'assets/js/app.js', 'assets/vendor/anime.slim.min.js', 'assets/fonts/prompt-400.woff2', 'assets/fonts/prompt-600.woff2'];
  const sizes = files.map((f) => zlib.gzipSync(fs.readFileSync(path.join(ROOT, f)), { level: 9 }).length);
  const total = sizes.reduce((a, b) => a + b, 0);
  console.log('      ' + files.map((f, i) => `${path.basename(f)} ${(sizes[i] / 1024).toFixed(1)}KB`).join(' · '));
  console.log(`      รวม ${(total / 1024).toFixed(1)} KB (gzip)`);
  assert(total < 110 * 1024, `หนักเกินไป: ${(total / 1024).toFixed(1)} KB`);
});

// ---------- 2) หน้าแรก + แอนิเมชัน ----------
{
  const { ctx, page, problems } = await newPage();
  await check('หน้าแรกโหลดได้ ไม่มี error และโหลด anime.js + ฟอนต์ครบ', async () => {
    await page.goto(SITE);
    await page.waitForLoadState('networkidle');
    assert((await page.title()).includes('เพื่อนยามรถเสีย'), 'title ผิด');
    assert(await page.evaluate(() => typeof window.anime?.animate === 'function'), 'ไม่มี window.anime');
    assert(await page.evaluate(() => document.fonts.check('600 16px Prompt')), 'ฟอนต์ Prompt ไม่โหลด');
    assert(await page.locator('a.service').count() === 3, 'ต้องมีบริการ 3 แบบ');
    assert(!problems.length, problems.join('\n'));
  });
  await check('ฉากรถสไลด์เล่นจนจบ: รถที่เสียขึ้นไปอยู่บนกระบะ และมีเครื่องหมายถูก', async () => {
    await page.waitForTimeout(7000);
    const s = await page.evaluate(() => {
      const m = (sel) => new DOMMatrix(getComputedStyle(document.querySelector(sel)).transform);
      const car = m('.h-car'), truck = m('.h-truck');
      return {
        car: [car.e, car.f, Math.atan2(car.b, car.a)], truckX: truck.e,
        badge: getComputedStyle(document.querySelector('.h-badge')).opacity,
        services: getComputedStyle(document.querySelector('.service')).opacity
      };
    });
    const [cx, cy, rot] = s.car;
    assert(Math.abs(cx - 118) < 0.5 && Math.abs(cy + 26) < 0.5 && Math.abs(rot) < 0.001, 'รถไม่อยู่บนกระบะ: ' + s.car);
    assert(Math.abs(s.truckX) < 0.5, 'รถสไลด์ไม่ถึงที่: ' + s.truckX);
    assert(s.badge === '1' && s.services === '1', 'badge/บริการไม่แสดง');
    await page.screenshot({ path: path.join(OUT, 'home.png'), fullPage: true });
  });
  await check('แตะภาพเพื่อเล่นฉากซ้ำได้', async () => {
    await page.click('.hero-art');
    await page.waitForTimeout(250);
    const x = await page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('.h-truck')).transform).e);
    assert(x > 100, 'ไม่เริ่มเล่นใหม่: ' + x);
  });
  await check('ไม่มีการเลื่อนแนวนอนที่จอกว้าง 390px', async () => assert(await noOverflow(page)));
  await ctx.close();
}

// ---------- 3) เส้นทางหลัก: รถสไลด์ → GPS → จองด่วน → บัตรคิว ----------
{
  const { ctx, page, problems } = await newPage();
  await page.goto(SITE);
  await check('เลือก "รถสไลด์" แล้วเห็นรายชื่อ พร้อมป้ายข้อมูลตัวอย่าง', async () => {
    await page.click('a.service[href="#/slide"]');
    await page.waitForSelector('.pcard');
    assert(await page.locator('.pcard').count() === 8, 'จำนวนร้านผิด');
    assert(await page.locator('.note', { hasText: 'ข้อมูลตัวอย่าง' }).count() === 1, 'ไม่มีป้ายข้อมูลตัวอย่าง');
    assert((await page.textContent('#viewTitle')) === 'รถสไลด์ใกล้คุณ');
  });
  await check('กด "ใช้ตำแหน่งปัจจุบัน" แล้วเรียงร้านที่ใกล้ที่สุดขึ้นก่อน', async () => {
    await page.click('[data-action="gps"]');
    await page.waitForSelector('.loc-text:has-text("แถวเขตบางนา")');
    const first = await page.textContent('.pcard.first .p-name');
    assert(first.includes('บางนา'), 'ร้านแรกไม่ใช่ร้านใกล้สุด: ' + first);
    assert(await page.locator('.pcard.first .badge', { hasText: 'ใกล้คุณที่สุด' }).count() === 1);
    const kms = await page.$$eval('.pcard .p-facts li:first-child', (els) => els.map((e) => e.textContent));
    assert(kms.every((t) => t.includes('ห่าง')), 'ไม่แสดงระยะทาง');
    assert(await noOverflow(page), 'เลื่อนแนวนอนได้');
  });
  await check('ฟอร์มจองคิว: กดยืนยันตอนยังไม่กรอก แล้วขึ้นข้อความเตือน', async () => {
    await page.click('.pcard.first a.btn.primary');
    await page.waitForSelector('form.book');
    await page.fill('input[name="name"]', '');
    await page.fill('input[name="phone"]', '');
    await page.click('button.cta');
    assert(await page.isVisible('#err-name'), 'ไม่เตือนชื่อ');
    assert(await page.isVisible('#err-phone'), 'ไม่เตือนเบอร์');
    assert((await page.getAttribute('input[name="phone"]', 'aria-invalid')) === 'true');
    assert((await hash(page)).startsWith('#/book/'), 'ไม่ควรเปลี่ยนหน้า');
  });
  await check('จองสำเร็จ: ได้บัตรคิว S-xxx พร้อมรหัสจอง และเก็บลงเครื่อง', async () => {
    await page.fill('input[name="landmark"]', 'หน้าเซเว่น ซ.สุขุมวิท 101/1');
    await page.fill('input[name="name"]', 'สมชาย ใจดี');
    await page.fill('input[name="phone"]', '081-234-5678');
    await page.click('label.chip:has-text("แบตหมด")');
    await page.click('button.cta');
    await page.evaluate(() => document.querySelector('form.book')?.requestSubmit()); // กด Enter ซ้ำระหว่างรถวิ่ง ต้องไม่จองซ้ำ
    await page.waitForURL(/#\/ticket\/BK-/);
    await page.waitForTimeout(2500);
    assert(/^S-\d{3}$/.test(await page.textContent('.t-no')), 'เลขคิวผิด');
    assert(await page.isVisible('.done-check'), 'ไม่มีเครื่องหมายสำเร็จ');
    assert(await page.isVisible('.route-map'), 'ไม่มีแผนที่เส้นทาง');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('rsb.bookings')));
    assert(saved.length === 1 && saved[0].problems[0] === 'แบตหมด' && saved[0].pickup.src === 'gps', 'ข้อมูลที่บันทึกผิด');
    assert((await page.textContent('.tb-count')) === '1', 'ตัวเลขคิวที่ไอคอนผิด');
    await page.waitForTimeout(3500);
    await page.screenshot({ path: path.join(OUT, 'ticket.png'), fullPage: true });
  });
  await check('ปุ่มย้อนกลับของเบราว์เซอร์จากบัตรคิวกลับไปหน้ารายชื่อ (ไม่กลับไปฟอร์มเดิม)', async () => {
    await page.goBack();
    await page.waitForSelector('.pcard');
    assert((await hash(page)) === '#/slide', 'กลับไปผิดหน้า: ' + (await hash(page)));
  });
  await check('รีโหลดแล้วคิวยังอยู่ (localStorage)', async () => {
    await page.goto(SITE + '#/queue');
    await page.waitForSelector('.qitem');
    assert(await page.locator('.qitem').count() === 1);
  });
  await check('ไม่มี error ตลอดเส้นทางหลัก', async () => assert(!problems.length, problems.join('\n')));
  await ctx.close();
}

// ---------- 4) อู่ซ่อมรถ: นัดวันเวลา + ช่างมาหา + ยกเลิก ----------
{
  const { ctx, page, problems } = await newPage({ denyGps: true });
  await page.goto(SITE + '#/garage');
  await check('GPS ถูกปฏิเสธ: แจ้งเตือน แล้วเลือกเขตแทนได้', async () => {
    await page.click('[data-action="gps"]');
    await page.waitForSelector('.toast.show');
    assert((await page.textContent('.toast')).includes('เลือกเขต'), 'ข้อความเตือนผิด');
    await page.selectOption('select[data-role="district"]', 'วัฒนา');
    await page.waitForSelector('.loc-text:has-text("เขตวัฒนา")');
    const first = await page.textContent('.pcard.first .p-name');
    assert(first.includes('อู่ช่างหนึ่ง'), 'อู่ใกล้สุดของเขตวัฒนาผิด: ' + first);
  });
  await check('นัดเข้าอู่: เลือกวันพรุ่งนี้และช่วงเวลาว่าง แล้วได้บัตรคิว G-xxx', async () => {
    await page.click('.pcard.first a.btn.primary');
    await page.waitForSelector('form.book');
    assert(await page.isHidden('fieldset.pickup'), 'โหมดเข้าอู่ไม่ควรถามตำแหน่ง');
    assert((await page.textContent('fieldset.when .n')) === '1', 'เลขขั้นตอนไม่เรียงใหม่');
    await page.click('label.day:nth-child(2)'); // พรุ่งนี้
    const slot = page.locator('label.slot.free').first();
    const time = await slot.locator('input').getAttribute('value');
    await slot.click();
    assert((await page.textContent('.cta-sum')).includes(time), 'สรุปเวลาไม่ตรง');
    await page.click('label.chip:has-text("แอร์")');
    await page.fill('input[name="name"]', 'สมศรี');
    await page.fill('input[name="phone"]', '0898765432');
    await page.click('button.cta');
    await page.waitForURL(/#\/ticket\//);
    assert(/^G-\d{3}$/.test(await page.getAttribute('.ticket', 'aria-label').then((s) => s.replace('บัตรคิว ', ''))));
    assert((await page.textContent('.t-rows')).includes(time + ' น.'), 'ไม่แสดงเวลานัด');
    assert(await page.isHidden('.route-map').catch(() => true), 'นัดเข้าอู่ไม่ควรมีแผนที่');
  });
  await check('อู่ที่มีช่างมาหา: สลับเป็น "ให้ช่างมาหา" แล้วฟอร์มถามตำแหน่ง', async () => {
    await page.goto(SITE + '#/book/gr-bangna');
    await page.waitForSelector('form.book');
    assert(await page.isHidden('fieldset.pickup'));
    await page.click('.mode-seg label:has-text("ให้ช่างมาหา")');
    assert(await page.isVisible('fieldset.pickup'), 'ไม่แสดงส่วนตำแหน่ง');
    assert((await page.textContent('.problems .lg')) === 'รถเป็นอะไร?', 'หัวข้ออาการไม่เปลี่ยน');
    await page.click('button.cta');
    assert(await page.isVisible('#err-landmark'), 'ต้องเตือนให้บอกตำแหน่ง');
  });
  await check('คิวของฉัน: ยกเลิกคิวผ่านหน้าต่างยืนยัน แล้วสถานะเปลี่ยน', async () => {
    await page.goto(SITE + '#/queue');
    await page.click('.qitem a');
    await page.click('[data-action="cancel"]');
    await page.waitForSelector('#ask[open]');
    await page.click('#ask [data-role="yes"]');
    await page.waitForSelector('.stamp');
    assert((await page.textContent('.ticket .status')) === 'ยกเลิกแล้ว');
    assert(await page.isHidden('.tb-count'), 'ตัวเลขคิวไม่ลดลง');
  });
  await check('ไม่มี error ในเส้นทางอู่ซ่อมรถ', async () => assert(!problems.length, problems.join('\n')));
  await ctx.close();
}

// ---------- 5) โทรฉุกเฉิน + จอเล็ก + โหมดมืด ----------
{
  const { ctx, page, problems } = await newPage({ width: 360, scheme: 'dark' });
  await page.goto(SITE);
  await check('ปุ่มโทรฉุกเฉินเปิดแผ่นเบอร์จริง 6 เบอร์ และปิดได้', async () => {
    await page.click('button.tb-sos');
    await page.waitForSelector('#sos[open]');
    const tels = await page.$$eval('#sos a.hotline', (as) => as.map((a) => a.getAttribute('href')));
    assert(tels.length === 6 && tels.includes('tel:1669') && tels.includes('tel:191') && tels.includes('tel:1543'), tels.join(','));
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, 'sos-dark.png') });
    await page.click('#sos [data-action="close"]');
    await page.waitForFunction(() => !document.querySelector('#sos').open);
  });
  await check('จอกว้าง 360px โหมดมืด: ทุกหน้าไม่ล้นแนวนอน', async () => {
    for (const h of ['#/', '#/slide', '#/tow', '#/garage', '#/book/tw-ratchada', '#/queue']) {
      await page.goto(SITE + h);
      await page.waitForTimeout(400);
      assert(await noOverflow(page), 'ล้นที่ ' + h);
    }
    await page.goto(SITE + '#/book/tw-ratchada');
    await page.screenshot({ path: path.join(OUT, 'book-dark.png'), fullPage: true });
  });
  await check('ลิงก์ผิด (#/book/ไม่มีจริง) กลับหน้าแรกเอง', async () => {
    await page.goto(SITE + '#/book/nope');
    await page.waitForFunction(() => location.hash === '#/');
    assert(await page.isVisible('#home'));
  });
  await check('ไม่มี error ในโหมดมืด', async () => assert(!problems.length, problems.join('\n')));
  await ctx.close();
}

// ---------- 6) ทนทาน: ไม่มี anime.js / ลดการเคลื่อนไหว / เปิดจากไฟล์ / ออฟไลน์ ----------
{
  const { ctx, page } = await newPage();
  await ctx.route('**/anime.slim.min.js', (r) => r.abort());
  await check('โหลด anime.js ไม่ได้ ก็ยังจองคิวได้ครบ (ภาพหน้าแรกเป็นภาพนิ่ง)', async () => {
    await page.goto(SITE);
    await page.waitForSelector('html.no-anim');
    const truck = await page.evaluate(() => getComputedStyle(document.querySelector('.h-truck')).transform);
    assert(truck === 'none', 'รถสไลด์ต้องอยู่ในภาพนิ่ง: ' + truck);
    assert(await page.evaluate(() => getComputedStyle(document.querySelector('.service')).opacity) === '1');
    await page.click('a.service[href="#/tow"]');
    await page.click('.pcard.first a.btn.primary');
    await page.fill('input[name="landmark"]', 'ปากซอยรัชดา 3');
    await page.fill('input[name="name"]', 'ทดสอบ');
    await page.fill('input[name="phone"]', '0811111111');
    await page.click('button.cta');
    await page.waitForURL(/#\/ticket\//);
    assert(/^T-\d{3}$/.test(await page.textContent('.t-no')));
  });
  await ctx.close();
}
{
  const { ctx, page, problems } = await newPage({ reducedMotion: 'reduce' });
  await check('ผู้ใช้ตั้ง "ลดการเคลื่อนไหว": เนื้อหาแสดงทันที ไม่มีฉากเคลื่อนไหว', async () => {
    await page.goto(SITE);
    await page.waitForTimeout(200);
    const s = await page.evaluate(() => ({
      service: getComputedStyle(document.querySelector('.service')).opacity,
      truck: getComputedStyle(document.querySelector('.h-truck')).transform
    }));
    assert(s.service === '1' && s.truck === 'none', JSON.stringify(s));
    assert(!problems.length, problems.join('\n'));
  });
  await ctx.close();
}
{
  const { ctx, page, problems } = await newPage();
  await check('ดับเบิลคลิกเปิด index.html จากเครื่อง (file://) ก็ใช้งานได้', async () => {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href + '#/garage');
    await page.waitForSelector('.pcard');
    assert(await page.locator('.pcard').count() === 9, 'จำนวนอู่ผิด');
    // Chrome ไม่ให้โหลดฟอนต์จาก file:// (จะใช้ฟอนต์ไทยของเครื่องแทน) นอกนั้นต้องไม่มี error
    const real = problems.filter((p) => !/font|ERR_FAILED/.test(p));
    assert(!real.length, real.join('\n'));
  });
  await ctx.close();
}
{
  const { ctx, page } = await newPage({ serviceWorkers: 'allow' });
  await check('Service worker เก็บไฟล์ไว้ เปิดซ้ำตอนออฟไลน์ได้ และบัตรคิวยังอยู่', async () => {
    await page.goto(SITE);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();
    await page.evaluate(() => localStorage.setItem('rsb.bookings', JSON.stringify([{
      id: 'BK-TEST22', providerId: 'sl-bangna', type: 'slide', mode: 'come', queueNo: 'S-007', createdAt: Date.now(),
      slot: null, pickup: { lat: 13.67, lng: 100.6, src: 'gps', district: 'บางนา', landmark: '' }, destination: '',
      problems: [], name: 'ออฟไลน์', phone: '0812345678', car: '', km: 1.2, eta: 15, status: 'active'
    }])));
    await ctx.setOffline(true);
    await page.goto(SITE + '#/queue');
    await page.reload(); // โหลดหน้าใหม่ทั้งหน้าขณะออฟไลน์ (ต้องมาจากแคชของ service worker)
    await page.waitForSelector('.qitem');
    assert((await page.textContent('.q-no')) === 'S-007');
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
