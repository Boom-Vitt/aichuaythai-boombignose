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

test('ลิงก์ Google Maps: ปักหมุด และค้นหาใกล้ตัวด้วย GPS หรือชื่อเขต', () => {
  const gps = { lat: 13.6702, lng: 100.6068, src: 'gps', district: 'บางนา' };
  const pin = 'https://www.google.com/maps/search/?api=1&query=13.67020%2C100.60680';
  assert.equal(C.mapsPinUrl(gps), pin);
  assert.equal(C.formatCoord(gps), '13.67020, 100.60680');
  assert.equal(C.mapsNearbyUrl('รถสไลด์', gps),
    'https://www.google.com/maps/search/' + encodeURIComponent('รถสไลด์') + '/@13.67020,100.60680,15z');
  const picked = { lat: 13.742, lng: 100.586, src: 'district', district: 'วัฒนา' };
  assert.equal(C.mapsNearbyUrl('อู่ซ่อมรถ', picked),
    'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('อู่ซ่อมรถ เขตวัฒนา กรุงเทพมหานคร'));
  assert.equal(C.shareLocationText(gps), 'รถเสียอยู่ตรงนี้ (แถวเขตบางนา)\n' + pin);
  assert.ok(!C.shareLocationText({ ...gps, district: '' }).includes('แถวเขต'));
});

test('ข้อมูลเขต: ครบ 50 เขต ไม่ซ้ำ อยู่ในกรุงเทพฯ และมีปุ่มค้นหาใกล้ตัว', () => {
  assert.equal(D.districts.length, 50);
  assert.equal(new Set(D.districts.map((d) => d[0])).size, 50);
  for (const [name, lat, lng] of D.districts) assert.ok(C.inBangkok({ lat, lng }), name);
  assert.ok(D.nearby.length >= 2 && D.nearby.every((n) => n.q && n.label));
});
