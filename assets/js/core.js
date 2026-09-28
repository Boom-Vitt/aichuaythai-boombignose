/*
 * ตรรกะหลัก (ไม่แตะ DOM) — ใช้ในเบราว์เซอร์ผ่าน window.RSB_CORE
 * และ require() ใน Node เพื่อรันเทสต์ได้
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RSB_CORE = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  function digits(num) { return String(num || '').replace(/\D/g, ''); }

  // เบอร์ที่โทรได้: เบอร์สั้น 3-4 หลัก (191, 1669), 1800/1401-xxx-xxx, เบอร์บ้าน 0x-xxx-xxxx, มือถือ 0xx-xxx-xxxx
  function isValidNumber(num) {
    var d = digits(num);
    return /^1\d{2,3}$/.test(d) || /^1(800|401)\d{6}$/.test(d) || /^0\d{8,9}$/.test(d);
  }

  function telHref(num) { return 'tel:' + digits(num); }

  // ค้นหาแบบไม่สนตัวพิมพ์เล็ก-ใหญ่ ช่องว่าง ขีด จุด
  function normalize(s) { return String(s || '').toLowerCase().replace(/[\s\-.\/()]+/g, ''); }

  // ทุกคำที่พิมพ์ต้องเจอในชื่อ รายละเอียด เบอร์ คำค้นเพิ่มเติม หรือชื่อหมวด
  function matches(item, query, section) {
    var tokens = String(query || '').trim().split(/\s+/).map(normalize).filter(Boolean);
    if (!tokens.length) return true;
    var hay = normalize([
      item.num, item.name, item.desc, (item.tags || []).join(' '),
      section ? section.title + ' ' + (section.short || '') : ''
    ].join(' '));
    return tokens.every(function (t) { return hay.indexOf(t) >= 0; });
  }

  // '2026-09-28' → '28 ก.ย. 2569'
  function formatThaiDate(iso) {
    var p = String(iso).split('-');
    return (+p[2]) + ' ' + MONTHS[+p[1] - 1] + ' ' + (+p[0] + 543);
  }

  // ---------- ตำแหน่ง ----------
  function toRad(d) { return d * Math.PI / 180; }

  function distanceKm(a, b) {
    var dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    var h = Math.pow(Math.sin(dLat / 2), 2) +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.pow(Math.sin(dLng / 2), 2);
    return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  // กรอบพื้นที่กรุงเทพฯ แบบคร่าว ๆ ใช้บอกว่าผู้ใช้อยู่นอกพื้นที่
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

  function formatCoord(p) { return p.lat.toFixed(5) + ', ' + p.lng.toFixed(5); }

  // ลิงก์ Google Maps ปักหมุดตรงจุดที่รถอยู่ (ใช้ส่งให้คนที่มาช่วย)
  function mapsPinUrl(p) {
    return 'https://www.google.com/maps/search/?api=1&query=' + p.lat.toFixed(5) + '%2C' + p.lng.toFixed(5);
  }

  // จุดของร้าน: ใช้ lat/lng ถ้ามี ไม่งั้นใช้จุดกึ่งกลางของเขตที่ร้านตั้งอยู่
  function placePoint(p, districts) {
    return typeof p.lat === 'number' ? { lat: p.lat, lng: p.lng } : districtPoint(p.district, districts);
  }

  // ร้านประเภทเดียวกันที่ใกล้ที่สุด (ร้านในเขตเดียวกับผู้ใช้มาก่อน) ไม่เกิน maxKm กม.
  function nearestPlaces(places, loc, districts, kind, limit, maxKm) {
    return places.filter(function (p) { return p.kind === kind; }).map(function (p) {
      var pt = placePoint(p, districts);
      return { p: p, km: pt ? distanceKm(loc, pt) : Infinity, same: !!loc.district && p.district === loc.district };
    }).filter(function (x) { return x.km <= (maxKm || 25); })
      .sort(function (a, b) { return (b.same - a.same) || (a.km - b.km); })
      .slice(0, limit || 5);
  }

  // เจ้าที่ขึ้นในหมวด "ใกล้คุณ": ไม่เกิน 5 เจ้าในรัศมี 15 กม. ถ้าไม่มีเลย เอา 2 เจ้าที่ใกล้สุดในรัศมี 30 กม.
  function localPlaces(places, loc, districts, kind) {
    var near = nearestPlaces(places, loc, districts, kind, 5, 15);
    return near.length ? near : nearestPlaces(places, loc, districts, kind, 2, 30);
  }

  // ระยะทางคร่าว ๆ (ตำแหน่งร้านเป็นระดับเขต จึงบอกเป็นกิโลเมตรเต็ม)
  function formatApproxKm(km) { return 'ราว ' + Math.max(1, Math.round(km)) + ' กม.'; }

  function shareLocationText(loc) {
    return 'รถเสียอยู่ตรงนี้' + (loc.district ? ' (แถวเขต' + loc.district + ')' : '') + '\n' + mapsPinUrl(loc);
  }

  return {
    digits: digits,
    isValidNumber: isValidNumber,
    telHref: telHref,
    normalize: normalize,
    matches: matches,
    formatThaiDate: formatThaiDate,
    distanceKm: distanceKm,
    inBangkok: inBangkok,
    nearestDistrict: nearestDistrict,
    districtPoint: districtPoint,
    formatCoord: formatCoord,
    mapsPinUrl: mapsPinUrl,
    placePoint: placePoint,
    nearestPlaces: nearestPlaces,
    localPlaces: localPlaces,
    formatApproxKm: formatApproxKm,
    shareLocationText: shareLocationText
  };
});
