// เทสต์ตรรกะหลักและข้อมูล — รันด้วย: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../assets/js/core.js');
const D = require('../assets/js/data.js');

const MON_10 = new Date(2026, 8, 28, 10, 0); // จันทร์ 28 ก.ย. 2026 10:00
const byId = (id) => D.providers.find((p) => p.id === id);

test('ข้อมูลร้าน: อยู่ในกรุงเทพฯ ทั้งหมด, id ไม่ซ้ำ, ประเภทถูกต้อง', () => {
  const ids = new Set();
  const districtNames = new Set(D.districts.map((d) => d[0]));
  for (const p of D.providers) {
    assert.ok(!ids.has(p.id), `id ซ้ำ: ${p.id}`);
    ids.add(p.id);
    assert.ok(['slide', 'tow', 'garage'].includes(p.type), `type ผิด: ${p.id}`);
    assert.ok(C.inBangkok(p), `อยู่นอกกรุงเทพฯ: ${p.id}`);
    assert.ok(districtNames.has(p.district), `ไม่รู้จักเขต: ${p.district}`);
    assert.ok(p.hours === '24h' || (p.hours.open && p.hours.close), `hours ผิด: ${p.id}`);
    if (p.type !== 'garage') assert.ok(p.price && p.price.base > 0, `ไม่มีราคา: ${p.id}`);
  }
  for (const type of ['slide', 'tow', 'garage']) {
    assert.ok(D.providers.filter((p) => p.type === type).length >= 5, `${type} น้อยเกินไป`);
  }
});

test('ข้อมูลเขต: ครบ 50 เขต ไม่ซ้ำ และอยู่ในกรุงเทพฯ', () => {
  assert.equal(D.districts.length, 50);
  assert.equal(new Set(D.districts.map((d) => d[0])).size, 50);
  for (const [name, lat, lng] of D.districts) assert.ok(C.inBangkok({ lat, lng }), name);
});

test('ระยะทางและเวลาเดินทาง', () => {
  const km = C.distanceKm({ lat: 13.765, lng: 100.5383 }, { lat: 13.7462, lng: 100.5347 }); // อนุสาวรีย์ฯ → สยาม
  assert.ok(km > 2.0 && km < 2.3, String(km));
  assert.equal(C.etaMinutes(0), 10);
  assert.equal(C.etaMinutes(2), 15);
  assert.equal(C.etaMinutes(10), 45);
  assert.equal(C.formatKm(0.34), '300 ม.');
  assert.equal(C.formatKm(0.02), '100 ม.');
  assert.equal(C.formatKm(2.44), '2.4 กม.');
  assert.equal(C.formatKm(12.6), '13 กม.');
  assert.equal(C.formatBaht(1200), '฿1,200');
  assert.equal(C.formatBaht(1234567), '฿1,234,567');
});

test('พื้นที่กรุงเทพฯ และเขตที่ใกล้ที่สุด', () => {
  assert.equal(C.inBangkok({ lat: 13.7462, lng: 100.5347 }), true); // สยาม
  assert.equal(C.inBangkok({ lat: 18.7883, lng: 98.9853 }), false); // เชียงใหม่
  assert.equal(C.nearestDistrict({ lat: 13.668, lng: 100.6045 }, D.districts), 'บางนา');
  assert.deepEqual(C.districtPoint('จตุจักร', D.districts), { lat: 13.828, lng: 100.56 });
  assert.equal(C.districtPoint('ไม่มีเขตนี้', D.districts), null);
});

test('เบอร์โทร', () => {
  for (const ok of ['081-234-5678', '0812345678', '+66 81 234 5678', '66812345678', '02-123-4567']) {
    assert.ok(C.isValidPhone(ok), ok);
  }
  for (const bad of ['', '12345', '081234567890', 'abc', '1669']) assert.ok(!C.isValidPhone(bad), bad);
  assert.equal(C.formatPhone('0812345678'), '081-234-5678');
  assert.equal(C.formatPhone('+66 81 234 5678'), '081-234-5678');
  assert.equal(C.formatPhone('021234567'), '02-123-4567');
});

test('เวลาเปิด-ปิดร้าน', () => {
  const g = byId('gr-sukhumvit'); // 08:00-18:00 ปิดวันอาทิตย์
  assert.deepEqual(C.openState(byId('sl-bangna'), MON_10), { open: true, label: 'เปิด 24 ชม.' });
  assert.deepEqual(C.openState(g, MON_10), { open: true, label: 'เปิดอยู่ · ถึง 18:00 น.' });
  assert.equal(C.openState(g, new Date(2026, 8, 28, 7, 0)).label, 'ปิดอยู่ · เปิดวันนี้ 08:00 น.');
  assert.equal(C.openState(g, new Date(2026, 8, 28, 19, 0)).label, 'ปิดอยู่ · เปิดพรุ่งนี้ 08:00 น.');
  assert.equal(C.openState(g, new Date(2026, 9, 3, 19, 0)).label, 'ปิดอยู่ · เปิดวันจันทร์ 08:00 น.'); // เสาร์ค่ำ
  assert.equal(C.openState(g, new Date(2026, 9, 4, 12, 0)).open, false); // อาทิตย์
});

test('ช่วงเวลาจอง: เลยเวลา / ร้านปิด / ผลคงที่', () => {
  const g = byId('gr-ladprao'); // 08:30-17:30 ปิดวันอาทิตย์
  assert.deepEqual(C.slotTimes(g), ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']);
  assert.equal(C.slotTimes(byId('sl-bangna')).length, 17); // 06:00-22:00
  const today = C.daySlots(g, '2026-09-28', MON_10, [], 'visit');
  assert.deepEqual(today.slice(0, 2).map((s) => s.state), ['past', 'past']); // 09:00, 10:00 ผ่านไปแล้ว
  assert.ok(today.every((s) => s.state !== 'closed'));
  const sunday = C.daySlots(g, '2026-10-04', MON_10, [], 'visit');
  assert.ok(sunday.every((s) => s.state === 'closed'));
  const mine = C.daySlots(g, '2026-09-29', MON_10, ['13:00'], 'visit');
  assert.equal(mine.find((s) => s.time === '13:00').state, 'mine');
  assert.deepEqual(C.daySlots(g, '2026-09-29', MON_10, [], 'visit'), C.daySlots(g, '2026-09-29', MON_10, [], 'visit'));
  const first = C.firstFreeSlot(g, MON_10, () => [], 'visit');
  assert.ok(first && first.date >= '2026-09-28');
  assert.ok(C.bookingDays(g, MON_10, 7).find((d) => d.key === '2026-10-04').closed);
});

test('หมายเลขคิว', () => {
  const a = C.queueNumber('S', 'sl-bangna', '2026-09-28', 0);
  const b = C.queueNumber('S', 'sl-bangna', '2026-09-28', 1);
  assert.match(a, /^S-\d{3}$/);
  assert.equal(parseInt(b.slice(2), 10), parseInt(a.slice(2), 10) + 1);
  assert.match(C.bookingCode(() => 0.5), /^BK-[2-9A-HJ-NP-Z]{6}$/);
});

test('เรียงผู้ให้บริการ', () => {
  const bangna = { lat: 13.668, lng: 100.6045 };
  const slides = C.rankProviders(D.providers, 'slide', bangna, MON_10);
  assert.equal(slides[0].p.id, 'sl-bangna');
  for (let i = 1; i < slides.length; i++) assert.ok(slides[i].km >= slides[i - 1].km);
  const byRating = C.rankProviders(D.providers, 'garage', null, MON_10);
  assert.equal(byRating[0].p.rating, Math.max(...byRating.map((x) => x.p.rating)));
  assert.equal(byRating[0].km, null);
  // ตี 2: รถลากที่ปิดอยู่ต้องไปอยู่ท้ายรายการ
  const night = C.rankProviders(D.providers, 'tow', bangna, new Date(2026, 8, 29, 2, 0));
  assert.equal(night[night.length - 1].p.id, 'tw-onnut');
});

test('ตรวจฟอร์มจองคิว', () => {
  const gps = { lat: 13.668, lng: 100.6045, src: 'gps', district: 'บางนา' };
  const district = { lat: 13.668, lng: 100.604, src: 'district', district: 'บางนา' };
  const base = { mode: 'come', when: 'now', name: 'สมชาย', phone: '0812345678' };
  assert.deepEqual(C.validateBooking({ ...base, pickup: gps }), {});
  assert.ok(C.validateBooking({ ...base, pickup: null }).landmark);
  assert.ok(C.validateBooking({ ...base, pickup: district }).landmark);
  assert.deepEqual(C.validateBooking({ ...base, pickup: district, landmark: 'หน้าเซเว่น ซ.1' }), {});
  assert.ok(C.validateBooking({ ...base, pickup: gps, when: 'later' }).slot);
  const e = C.validateBooking({ mode: 'visit', name: 'ก', phone: '123' });
  assert.deepEqual(Object.keys(e).sort(), ['name', 'phone', 'slot']);
  assert.deepEqual(C.validateBooking({ mode: 'visit', date: '2026-09-29', time: '10:00', name: 'สมศรี', phone: '02-123-4567' }), {});
});

test('สร้างการจอง: รถสไลด์ด่วน', () => {
  const p = byId('sl-bangna');
  const pickup = { lat: 13.7, lng: 100.6, src: 'gps', district: 'พระโขนง', acc: 20 };
  const f = { mode: 'come', when: 'now', pickup, landmark: ' หน้าปั๊ม ', name: ' สมชาย ', phone: '081-234-5678', problems: ['แบตหมด'] };
  const b = C.createBooking(f, p, D.services.slide, { now: MON_10, existing: [], rnd: () => 0.1 });
  assert.equal(b.type, 'slide');
  assert.equal(b.slot, null);
  assert.equal(b.pickup.landmark, 'หน้าปั๊ม');
  assert.equal(b.name, 'สมชาย');
  assert.equal(b.phone, '0812345678');
  assert.ok(b.km > 3 && b.km < 4, String(b.km));
  assert.equal(b.eta, C.etaMinutes(C.distanceKm(pickup, p)));
  assert.match(b.queueNo, /^S-\d{3}$/);
  const b2 = C.createBooking(f, p, D.services.slide, { now: MON_10, existing: [b], rnd: () => 0.2 });
  assert.equal(parseInt(b2.queueNo.slice(2), 10), parseInt(b.queueNo.slice(2), 10) + 1);
  assert.equal(C.bookingStatus(b, MON_10).key, 'active');
  assert.equal(C.bookingStatus(b, new Date(+MON_10 + 7 * 3600000)).key, 'past');
  assert.equal(C.bookingStatus({ ...b, status: 'cancelled' }, MON_10).key, 'cancelled');
});

test('สร้างการจอง: นัดเข้าอู่ และข้อความแชร์', () => {
  const p = byId('gr-sukhumvit');
  const f = { mode: 'visit', date: '2026-09-29', time: '10:00', name: 'สมศรี', phone: '0898765432', problems: ['แอร์'], car: 'City ขาว' };
  const b = C.createBooking(f, p, D.services.garage, { now: MON_10, existing: [], rnd: Math.random });
  assert.deepEqual(b.slot, { date: '2026-09-29', time: '10:00' });
  assert.equal(b.pickup, null);
  assert.equal(b.km, null);
  assert.match(b.queueNo, /^G-\d{3}$/);
  assert.equal(C.whenText(b, MON_10), 'พรุ่งนี้ 10:00 น.');
  assert.equal(C.bookingStatus(b, MON_10).key, 'upcoming');
  assert.equal(C.isOpenBooking(b, new Date(2026, 8, 29, 13, 0)), false);
  const text = C.shareText(b, p, D.services.garage);
  assert.match(text, /อ\. 29 ก\.ย\. 10:00 น\./);
  assert.match(text, /ซ\.สุขุมวิท 71/);
  assert.match(text, /089-876-5432/);
  assert.ok(text.includes(b.id));

  const truck = C.createBooking(
    { mode: 'come', when: 'now', pickup: { lat: 13.7, lng: 100.6, src: 'gps' }, name: 'เอ', phone: '0812345678' },
    byId('tw-bangkapi'), D.services.tow, { now: MON_10, existing: [] });
  assert.ok(C.shareText(truck, byId('tw-bangkapi'), D.services.tow)
    .includes('https://www.google.com/maps/search/?api=1&query=13.70000%2C100.60000'));
});
