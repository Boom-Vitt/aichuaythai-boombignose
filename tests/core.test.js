// เทสต์ตรรกะหลักและข้อมูลเบอร์โทร — รันด้วย: node --test core.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../assets/js/core.js');
const D = require('../assets/js/data.js');

const allItems = D.sections.flatMap((s) => s.items.map((it) => ({ it, s })));

test('รูปแบบเบอร์โทรที่รองรับ', () => {
  for (const ok of ['191', '1669', '1543', '1800-238-444', '1-800-29-2555', '1401-333-000', '02-123-4567', '081-234-5678']) {
    assert.ok(C.isValidNumber(ok), ok);
  }
  for (const bad of ['', '12', '12345', '1800-123', '1500-333-000', '81-234-5678', 'โทร']) assert.ok(!C.isValidNumber(bad), bad);
  assert.equal(C.telHref('1800-238-444'), 'tel:1800238444');
  assert.equal(C.telHref('02 123 4567'), 'tel:021234567');
  assert.equal(C.telHref('1669'), 'tel:1669');
});

test('ค้นหา: ไม่สนตัวพิมพ์ ช่องว่าง ขีด และค้นจากชื่อหมวดได้', () => {
  const item = { num: '1800-238-444', name: 'โตโยต้า', desc: 'ช่วยเหลือฉุกเฉิน 24 ชม.', tags: ['Toyota'] };
  const sec = { title: 'ศูนย์ช่วยเหลือของยี่ห้อรถ', short: 'ยี่ห้อรถ' };
  assert.ok(C.matches(item, ''));
  assert.ok(C.matches(item, 'โตโยต้า'));
  assert.ok(C.matches(item, 'TOYOTA'));
  assert.ok(C.matches(item, '1800238'));
  assert.ok(C.matches(item, '238-444'));
  assert.ok(C.matches(item, 'ยี่ห้อ', sec));
  assert.ok(C.matches(item, 'toyota 24'));
  assert.ok(!C.matches(item, 'toyota ทางด่วน'));
  assert.ok(!C.matches(item, 'ยี่ห้อ'));
});

test('วันที่ภาษาไทย', () => {
  assert.equal(C.formatThaiDate('2026-09-28'), '28 ก.ย. 2569');
  assert.equal(C.formatThaiDate('2027-01-05'), '5 ม.ค. 2570');
});

test('ข้อมูล: หมวดครบ มี id ไม่ซ้ำ และหมวดแรกคือฉุกเฉิน', () => {
  assert.match(D.checked, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(D.sections.length >= 4);
  assert.equal(D.sections[0].id, 'emergency');
  assert.equal(new Set(D.sections.map((s) => s.id)).size, D.sections.length);
  for (const s of D.sections) {
    assert.ok(s.title && s.icon && s.items.length, `หมวดไม่ครบ: ${s.id}`);
    assert.match(s.id, /^[a-z-]+$/);
  }
});

test('ข้อมูล: ทุกเบอร์ถูกรูปแบบ มีชื่อ คำอธิบาย และมีลิงก์แหล่งที่มา', () => {
  for (const { it, s } of allItems) {
    const where = `${s.id} / ${it.name} (${it.num})`;
    assert.ok(C.isValidNumber(it.num), 'เบอร์ผิดรูปแบบ: ' + where);
    assert.ok(it.name && it.name.length <= 40, 'ชื่อว่างหรือยาวเกิน: ' + where);
    assert.ok(it.desc && it.desc.length <= 60, 'คำอธิบายว่างหรือยาวเกิน: ' + where);
    assert.match(it.src, /^https?:\/\/[^\s]+$/, 'ไม่มีแหล่งที่มา: ' + where);
  }
});

test('ข้อมูล: ไม่มีเบอร์ซ้ำ และมีเบอร์ฉุกเฉินหลัก', () => {
  const nums = allItems.map(({ it }) => C.digits(it.num));
  const dup = nums.filter((n, i) => nums.indexOf(n) !== i);
  assert.deepEqual(dup, [], 'เบอร์ซ้ำ: ' + dup.join(', '));
  const emergency = D.sections[0].items.map((it) => it.num);
  for (const must of ['1669', '191']) assert.ok(emergency.includes(must), 'ขาด ' + must);
});

test('ตำแหน่ง: ระยะทาง เขตที่ใกล้สุด และขอบเขตกรุงเทพฯ', () => {
  const km = C.distanceKm({ lat: 13.765, lng: 100.5383 }, { lat: 13.7462, lng: 100.5347 }); // อนุสาวรีย์ฯ → สยาม
  assert.ok(km > 2.0 && km < 2.3, String(km));
  assert.equal(C.inBangkok({ lat: 13.7462, lng: 100.5347 }), true);
  assert.equal(C.inBangkok({ lat: 18.7883, lng: 98.9853 }), false); // เชียงใหม่
  assert.equal(C.nearestDistrict({ lat: 13.668, lng: 100.6045 }, D.districts), 'บางนา');
  assert.deepEqual(C.districtPoint('จตุจักร', D.districts), { lat: 13.828, lng: 100.56 });
  assert.equal(C.districtPoint('ไม่มีเขตนี้', D.districts), null);
});

test('แชร์ตำแหน่ง: ลิงก์ปักหมุด Google Maps และข้อความ', () => {
  const gps = { lat: 13.6702, lng: 100.6068, src: 'gps', district: 'บางนา' };
  const pin = 'https://www.google.com/maps/search/?api=1&query=13.67020%2C100.60680';
  assert.equal(C.mapsPinUrl(gps), pin);
  assert.equal(C.formatCoord(gps), '13.67020, 100.60680');
  assert.equal(C.shareLocationText(gps), 'รถเสียอยู่ตรงนี้ (แถวเขตบางนา)\n' + pin);
  assert.ok(!C.shareLocationText({ ...gps, district: '' }).includes('แถวเขต'));
});

test('ใกล้คุณ: เรียงร้านในเขตเดียวกันก่อน แล้วตามระยะทาง และตัดร้านที่ไกลเกิน', () => {
  const places = [
    { kind: 'shop', name: 'ก', district: 'ลาดพร้าว' },
    { kind: 'shop', name: 'ข', district: 'บางนา' },
    { kind: 'shop', name: 'ค', district: 'พระโขนง' },
    { kind: 'tow', name: 'ง', district: 'บางนา' },
    { kind: 'shop', name: 'จ', lat: 13.67, lng: 100.605 }
  ];
  const bangna = { lat: 13.6702, lng: 100.6068, src: 'gps', district: 'บางนา' };
  const shops = C.nearestPlaces(places, bangna, D.districts, 'shop', 5);
  assert.deepEqual(shops.map((x) => x.p.name), ['ข', 'จ', 'ค', 'ก']);
  assert.equal(shops[0].same, true);
  assert.equal(C.nearestPlaces(places, bangna, D.districts, 'shop', 2).length, 2);
  assert.deepEqual(C.nearestPlaces(places, bangna, D.districts, 'shop', 5, 10).map((x) => x.p.name), ['ข', 'จ', 'ค']);
  assert.deepEqual(C.nearestPlaces(places, bangna, D.districts, 'tow', 5).map((x) => x.p.name), ['ง']);
  const chiangMai = { lat: 18.7883, lng: 98.9853, src: 'gps', district: '' };
  assert.equal(C.nearestPlaces(places, chiangMai, D.districts, 'shop', 5).length, 0);
  assert.equal(C.formatApproxKm(0.3), 'ราว 1 กม.');
  assert.equal(C.formatApproxKm(12.6), 'ราว 13 กม.');
  // หมวดใกล้คุณ: ในรัศมี 15 กม. ก่อน ถ้าไม่มีเลยค่อยเอา 2 เจ้าที่ใกล้สุดในรัศมี 30 กม.
  assert.deepEqual(C.localPlaces(places, bangna, D.districts, 'shop').map((x) => x.p.name), ['ข', 'จ', 'ค', 'ก']);
  const nongChok = { lat: 13.8556, lng: 100.8624, src: 'district', district: 'หนองจอก' };
  const far = [
    { kind: 'tow', name: 'ไกล 1', district: 'คันนายาว' }, { kind: 'tow', name: 'ไกล 2', district: 'บึงกุ่ม' },
    { kind: 'tow', name: 'ไกล 3', district: 'ลาดพร้าว' }, { kind: 'tow', name: 'ไกลมาก', district: 'บางแค' }
  ];
  assert.deepEqual(C.localPlaces(far, nongChok, D.districts, 'tow').map((x) => x.p.name), ['ไกล 1', 'ไกล 2']);
  assert.equal(C.localPlaces(far, chiangMai, D.districts, 'tow').length, 0);
});

test('ข้อมูลเขต: ครบ 50 เขต ไม่ซ้ำ และอยู่ในกรุงเทพฯ', () => {
  assert.equal(D.districts.length, 50);
  assert.equal(new Set(D.districts.map((d) => d[0])).size, 50);
  for (const [name, lat, lng] of D.districts) assert.ok(C.inBangkok({ lat, lng }), name);
});

test('ข้อมูลร้านใกล้คุณ: ประเภท/เขตถูกต้อง เบอร์ถูกรูปแบบ ไม่ซ้ำ และมีแหล่งที่มา', () => {
  const names = new Set(D.districts.map((d) => d[0]));
  const seen = new Set(D.sections.flatMap((s) => s.items.map((it) => C.digits(it.num))));
  for (const p of D.places) {
    const where = `${p.name} (${p.num})`;
    assert.ok(['tow', 'shop'].includes(p.kind), 'ประเภทผิด: ' + where);
    assert.ok(names.has(p.district), 'ไม่รู้จักเขต: ' + where);
    assert.ok(C.isValidNumber(p.num), 'เบอร์ผิดรูปแบบ: ' + where);
    assert.ok(p.name && p.name.length <= 40, 'ชื่อว่างหรือยาวเกิน: ' + where);
    assert.match(p.src, /^https?:\/\/[^\s]+$/, 'ไม่มีแหล่งที่มา: ' + where);
    assert.ok(!seen.has(C.digits(p.num)), 'เบอร์ซ้ำ: ' + where);
    seen.add(C.digits(p.num));
  }
});

test('ข้อมูลหมวดที่ขึ้นกับพื้นที่: ตั้งค่าครบ และชนิดตรงกับ places', () => {
  const near = D.sections.filter((s) => s.near);
  assert.deepEqual(near.map((s) => s.id), ['tow', 'service']);
  for (const s of near) {
    assert.ok(D.places.some((p) => p.kind === s.near), 'ไม่มีข้อมูลร้านชนิด ' + s.near);
    assert.ok(s.nearTitle && s.wideTag && s.nearNote, 'ตั้งค่าหมวดไม่ครบ: ' + s.id);
  }
});

test('ใกล้คุณทุกเขต: มีรถสไลด์และร้านขึ้นให้โทร และแต่ละมุมเมืองได้เจ้าที่ต่างกัน', () => {
  const at = (district) => { const p = C.districtPoint(district, D.districts); return { lat: p.lat, lng: p.lng, district }; };
  for (const [district] of D.districts) {
    assert.ok(C.localPlaces(D.places, at(district), D.districts, 'tow').length >= 1, 'ไม่มีรถสไลด์ใกล้เขต' + district);
    assert.ok(C.localPlaces(D.places, at(district), D.districts, 'shop').length >= 1, 'ไม่มีร้านใกล้เขต' + district);
  }
  const corners = ['ดอนเมือง', 'หนองจอก', 'บางนา', 'บางแค'].map(at);
  for (const kind of ['tow', 'shop']) {
    const tops = new Set(corners.map((loc) => C.localPlaces(D.places, loc, D.districts, kind)[0].p.num));
    assert.ok(tops.size >= 3, `${kind}: 4 มุมเมืองได้เจ้าแรกซ้ำกันเกินไป (${[...tops]})`);
  }
  // ทั้ง 50 เขต: เจ้าแรกของแต่ละเขตต้องหลากหลาย ไม่ใช่เจ้าเดิมทั้งเมือง
  for (const [kind, min] of [['tow', 5], ['shop', 10]]) {
    const firsts = new Set(D.districts.map(([d]) => C.localPlaces(D.places, at(d), D.districts, kind)[0].p.num));
    assert.ok(firsts.size >= min, `${kind}: ทั้งเมืองมีเจ้าแรกแค่ ${firsts.size} เจ้า`);
  }
});
