/*
 * ตรรกะหลักของแอป (ไม่แตะ DOM) — ใช้ในเบราว์เซอร์ผ่าน window.RSB_CORE
 * และ require() ใน Node เพื่อรันเทสต์ได้
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RSB_CORE = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  var DAYS_FULL = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์', 'เสาร์'];
  var MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  function pad(n, len) {
    var s = String(n);
    while (s.length < (len || 2)) s = '0' + s;
    return s;
  }

  function formatBaht(n) {
    return '฿' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatKm(km) {
    if (km < 1) return Math.max(100, Math.round(km * 10) * 100) + ' ม.';
    return (km < 10 ? km.toFixed(1) : String(Math.round(km))) + ' กม.';
  }

  // ---------- ระยะทาง / เวลาเดินทาง ----------
  function toRad(d) { return d * Math.PI / 180; }

  function distanceKm(a, b) {
    var dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    var h = Math.pow(Math.sin(dLat / 2), 2) +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.pow(Math.sin(dLng / 2), 2);
    return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  // เตรียมรถ ~8 นาที + ระยะทางถนนจริง (~1.35 เท่าของเส้นตรง) ที่ความเร็วเฉลี่ยในเมือง ~22 กม./ชม.
  function etaMinutes(km) {
    var min = 8 + km * 1.35 / 22 * 60;
    return Math.max(10, Math.round(min / 5) * 5);
  }

  // กรอบพื้นที่กรุงเทพฯ แบบคร่าว ๆ ใช้แค่เตือนว่าผู้ใช้อยู่นอกพื้นที่ให้บริการ
  var BKK = { s: 13.49, n: 13.96, w: 100.32, e: 100.95 };
  function inBangkok(p) {
    return !!p && p.lat >= BKK.s && p.lat <= BKK.n && p.lng >= BKK.w && p.lng <= BKK.e;
  }

  function nearestDistrict(p, districts) {
    var best = null, bestKm = Infinity;
    for (var i = 0; i < districts.length; i++) {
      var km = distanceKm(p, { lat: districts[i][1], lng: districts[i][2] });
      if (km < bestKm) { bestKm = km; best = districts[i][0]; }
    }
    return best;
  }

  function districtPoint(name, districts) {
    for (var i = 0; i < districts.length; i++) {
      if (districts[i][0] === name) return { lat: districts[i][1], lng: districts[i][2] };
    }
    return null;
  }

  // ---------- วันเวลา ----------
  function parseHM(s) {
    var p = String(s).split(':');
    return (+p[0]) * 60 + (+p[1] || 0);
  }
  function hm(mins) { return pad(Math.floor(mins / 60)) + ':' + pad(mins % 60); }
  function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function keyToDate(key) {
    var p = key.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function slotDate(slot) {
    var d = keyToDate(slot.date), m = parseHM(slot.time);
    d.setHours(Math.floor(m / 60), m % 60, 0, 0);
    return d;
  }

  // ส่ง now มาด้วยเพื่อให้แสดง "วันนี้" / "พรุ่งนี้" ได้
  function formatDay(key, now) {
    if (now) {
      if (key === dayKey(now)) return 'วันนี้';
      if (key === dayKey(addDays(now, 1))) return 'พรุ่งนี้';
    }
    var d = keyToDate(key);
    return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
  }

  function formatDateTime(ts) {
    var d = new Date(ts);
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + hm(d.getHours() * 60 + d.getMinutes()) + ' น.';
  }

  // ---------- เวลาเปิด-ปิด ----------
  function isClosedDay(p, weekday) {
    return p.hours !== '24h' && (p.hours.closed || []).indexOf(weekday) >= 0;
  }

  function openState(p, now) {
    if (p.hours === '24h') return { open: true, label: 'เปิด 24 ชม.' };
    var h = p.hours, o = parseHM(h.open), c = parseHM(h.close);
    var mins = now.getHours() * 60 + now.getMinutes(), day = now.getDay();
    if (!isClosedDay(p, day) && mins >= o && mins < c) {
      return { open: true, label: 'เปิดอยู่ · ถึง ' + h.close + ' น.' };
    }
    for (var i = 0; i < 8; i++) {
      var d = (day + i) % 7;
      if (isClosedDay(p, d) || (i === 0 && mins >= o)) continue;
      var when = i === 0 ? 'วันนี้' : i === 1 ? 'พรุ่งนี้' : 'วัน' + DAYS_FULL[d];
      return { open: false, label: 'ปิดอยู่ · เปิด' + when + ' ' + h.open + ' น.' };
    }
    return { open: false, label: 'ปิดอยู่' };
  }

  // ---------- สุ่มแบบคงที่ (ผลเดิมทุกครั้งสำหรับข้อความเดิม) ----------
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function seeded(str) {
    var t = (hash(str) + 0x6D2B79F5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // ---------- วัน/ช่วงเวลาที่จองได้ ----------
  // ทุก 1 ชม. ตามเวลาเปิดร้าน — ร้าน 24 ชม. ให้นัดล่วงหน้าได้ 06:00–22:00
  function slotTimes(p) {
    var o = 6 * 60, c = 23 * 60;
    if (p.hours !== '24h') { o = parseHM(p.hours.open); c = parseHM(p.hours.close); }
    var out = [];
    for (var m = Math.ceil(o / 60) * 60; m + 60 <= c; m += 60) out.push(hm(m));
    return out;
  }

  function bookingDays(p, now, count) {
    var out = [];
    for (var i = 0; i < (count || 7); i++) {
      var d = addDays(now, i);
      out.push({ key: dayKey(d), date: d, closed: isClosedDay(p, d.getDay()) });
    }
    return out;
  }

  // state: free | full (คิวเต็ม) | past (เลยเวลาแล้ว) | mine (คิวของคุณเอง) | closed (ร้านปิด)
  function daySlots(p, key, now, taken, mode) {
    var closed = isClosedDay(p, keyToDate(key).getDay());
    var isToday = key === dayKey(now), nowMin = now.getHours() * 60 + now.getMinutes();
    var fullRate = mode === 'visit' ? 0.3 : 0.15;
    return slotTimes(p).map(function (t) {
      var state = 'free';
      if (closed) state = 'closed';
      else if (isToday && parseHM(t) < nowMin + 30) state = 'past';
      else if (taken && taken.indexOf(t) >= 0) state = 'mine';
      else if (seeded(p.id + '|' + key + '|' + t) < fullRate) state = 'full';
      return { time: t, state: state };
    });
  }

  function firstFreeSlot(p, now, takenFor, mode) {
    var days = bookingDays(p, now, 7);
    for (var i = 0; i < days.length; i++) {
      var slots = daySlots(p, days[i].key, now, takenFor(days[i].key), mode);
      for (var j = 0; j < slots.length; j++) {
        if (slots[j].state === 'free') return { date: days[i].key, time: slots[j].time };
      }
    }
    return null;
  }

  function queueNumber(prefix, providerId, key, countBefore) {
    var base = 1 + Math.floor(seeded('q|' + providerId + '|' + key) * 12);
    return prefix + '-' + pad(base + countBefore + 1, 3);
  }

  // ---------- เบอร์โทร ----------
  function normalizePhone(s) {
    return String(s || '').replace(/[\s\-().]/g, '').replace(/^\+?66(?=\d{8,9}$)/, '0');
  }
  function isValidPhone(s) { return /^0\d{8,9}$/.test(normalizePhone(s)); }
  function formatPhone(s) {
    var d = normalizePhone(s);
    if (d.length === 10) return d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6);
    if (d.length === 9) return d.slice(0, 2) + '-' + d.slice(2, 5) + '-' + d.slice(5);
    return d;
  }

  var CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  function bookingCode(rnd) {
    rnd = rnd || Math.random;
    var s = '';
    for (var i = 0; i < 6; i++) s += CODE_CHARS.charAt(Math.floor(rnd() * CODE_CHARS.length));
    return 'BK-' + s;
  }

  // ---------- ผู้ให้บริการ ----------
  // เรียงตามระยะทาง (ถ้ารู้ตำแหน่ง) ไม่งั้นเรียงตามคะแนน — รถสไลด์/รถลากที่เปิดอยู่ขึ้นก่อน
  function rankProviders(list, type, origin, now) {
    return list.filter(function (p) { return p.type === type; }).map(function (p) {
      return { p: p, km: origin ? distanceKm(origin, p) : null, open: openState(p, now) };
    }).sort(function (a, b) {
      if (type !== 'garage' && a.open.open !== b.open.open) return a.open.open ? -1 : 1;
      if (origin) return a.km - b.km;
      return (b.p.rating - a.p.rating) || (b.p.reviews - a.p.reviews);
    });
  }

  function priceFrom(p) { return p.price ? 'เริ่ม ' + formatBaht(p.price.base) : ''; }
  function priceDetail(p) {
    if (!p.price) return '';
    return 'เริ่มต้น ' + formatBaht(p.price.base) + ' (' + p.price.incKm + ' กม.แรก) · กม.ถัดไป ' + formatBaht(p.price.perKm);
  }

  // ---------- การจองคิว ----------
  // f = ค่าจากฟอร์ม: mode ('come' ให้รถ/ช่างมาหา | 'visit' นำรถเข้าอู่), when ('now' | 'later'), date, time,
  //     pickup (ตำแหน่งที่รู้), landmark, destination, problems[], name, phone, car
  function isScheduled(f) { return f.mode === 'visit' || f.when === 'later'; }

  function validateBooking(f) {
    var e = {};
    if (f.mode === 'come') {
      var hasGps = !!(f.pickup && f.pickup.src === 'gps');
      var hasLandmark = String(f.landmark || '').trim().length >= 3;
      if (!hasGps && !hasLandmark) {
        e.landmark = f.pickup
          ? 'พิมพ์จุดสังเกตเพิ่มอีกนิด เช่น ชื่อซอย ร้านค้า หรือหลัก กม.'
          : 'บอกตำแหน่งรถหน่อย: กด "ใช้ตำแหน่งปัจจุบัน" หรือพิมพ์จุดสังเกต';
      }
    }
    if (isScheduled(f) && !(f.date && f.time)) e.slot = 'เลือกวันและเวลาที่ต้องการ';
    if (String(f.name || '').trim().length < 2) e.name = 'กรอกชื่อผู้ติดต่อ';
    if (!isValidPhone(f.phone)) e.phone = 'เบอร์โทรไม่ถูกต้อง เช่น 081-234-5678';
    return e;
  }

  function bookingDay(b) { return b.slot ? b.slot.date : dayKey(new Date(b.createdAt)); }

  // ctx = { now: Date, existing: [booking], rnd: () => 0..1 }
  function createBooking(f, p, svc, ctx) {
    var now = ctx.now;
    var slot = isScheduled(f) ? { date: f.date, time: f.time } : null;
    var key = slot ? slot.date : dayKey(now);
    var before = (ctx.existing || []).filter(function (b) {
      return b.providerId === p.id && bookingDay(b) === key;
    }).length;
    var pickup = null;
    if (f.mode === 'come') {
      pickup = f.pickup
        ? { lat: f.pickup.lat, lng: f.pickup.lng, src: f.pickup.src, district: f.pickup.district || '', acc: f.pickup.acc || null }
        : {};
      pickup.landmark = String(f.landmark || '').trim();
    }
    var km = pickup && pickup.lat != null ? distanceKm(pickup, p) : null;
    return {
      id: bookingCode(ctx.rnd),
      providerId: p.id,
      type: p.type,
      mode: f.mode,
      queueNo: queueNumber(svc.prefix, p.id, key, before),
      createdAt: now.getTime(),
      slot: slot,
      pickup: pickup,
      destination: String(f.destination || '').trim(),
      problems: (f.problems || []).slice(),
      name: String(f.name).trim(),
      phone: normalizePhone(f.phone),
      car: String(f.car || '').trim(),
      km: km == null ? null : Math.round(km * 10) / 10,
      eta: km != null && !slot ? etaMinutes(km) : null,
      status: 'active'
    };
  }

  function bookingStatus(b, now) {
    var t = +now;
    if (b.status === 'cancelled') return { key: 'cancelled', label: 'ยกเลิกแล้ว' };
    if (b.slot) {
      return t - slotDate(b.slot).getTime() > 2 * 3600000
        ? { key: 'past', label: 'ผ่านไปแล้ว' }
        : { key: 'upcoming', label: 'นัดไว้' };
    }
    return t - b.createdAt > 6 * 3600000
      ? { key: 'past', label: 'ผ่านไปแล้ว' }
      : { key: 'active', label: 'เรียกแล้ว' };
  }

  function isOpenBooking(b, now) {
    var k = bookingStatus(b, now).key;
    return k === 'active' || k === 'upcoming';
  }

  function whenText(b, now) {
    if (b.slot) return formatDay(b.slot.date, now) + ' ' + b.slot.time + ' น.';
    return 'ด่วน · ' + formatDateTime(b.createdAt);
  }

  function mapsUrl(pt) {
    return 'https://www.google.com/maps/search/?api=1&query=' + pt.lat.toFixed(5) + '%2C' + pt.lng.toFixed(5);
  }

  // ข้อความสำหรับแชร์ทาง LINE / SMS (ไม่ใช้คำว่า วันนี้/พรุ่งนี้ เพราะอาจถูกอ่านทีหลัง)
  function shareText(b, p, svc) {
    var L = [];
    L.push('จองคิว' + svc.label + ' · บัตรคิว ' + b.queueNo);
    L.push('ผู้ให้บริการ: ' + p.name + ' (เขต' + p.district + ')');
    L.push('เวลา: ' + (b.slot
      ? formatDay(b.slot.date) + ' ' + b.slot.time + ' น.'
      : 'ด่วน (เรียกเมื่อ ' + formatDateTime(b.createdAt) + ')'));
    if (b.mode === 'come' && b.pickup) {
      if (b.pickup.landmark) L.push('จุดที่รถอยู่: ' + b.pickup.landmark);
      if (b.pickup.src === 'gps') L.push('แผนที่: ' + mapsUrl(b.pickup));
      else if (b.pickup.district) L.push('เขต: ' + b.pickup.district);
    } else if (b.mode === 'visit') {
      L.push('ที่อยู่ร้าน: ' + p.area + ' เขต' + p.district);
    }
    if (b.destination) L.push('ปลายทาง: ' + b.destination);
    if (b.problems.length) L.push('อาการ: ' + b.problems.join(', '));
    L.push('ผู้ติดต่อ: ' + b.name + ' โทร ' + formatPhone(b.phone));
    if (b.car) L.push('รถ: ' + b.car);
    L.push('รหัสจอง: ' + b.id);
    return L.join('\n');
  }

  return {
    DAYS: DAYS, MONTHS: MONTHS,
    pad: pad, formatBaht: formatBaht, formatKm: formatKm,
    distanceKm: distanceKm, etaMinutes: etaMinutes, inBangkok: inBangkok,
    nearestDistrict: nearestDistrict, districtPoint: districtPoint,
    parseHM: parseHM, dayKey: dayKey, keyToDate: keyToDate, addDays: addDays, slotDate: slotDate,
    formatDay: formatDay, formatDateTime: formatDateTime,
    isClosedDay: isClosedDay, openState: openState, seeded: seeded,
    slotTimes: slotTimes, bookingDays: bookingDays, daySlots: daySlots, firstFreeSlot: firstFreeSlot,
    queueNumber: queueNumber,
    normalizePhone: normalizePhone, isValidPhone: isValidPhone, formatPhone: formatPhone, bookingCode: bookingCode,
    rankProviders: rankProviders, priceFrom: priceFrom, priceDetail: priceDetail,
    isScheduled: isScheduled, validateBooking: validateBooking, createBooking: createBooking,
    bookingStatus: bookingStatus, isOpenBooking: isOpenBooking, whenText: whenText,
    mapsUrl: mapsUrl, shareText: shareText
  };
});
