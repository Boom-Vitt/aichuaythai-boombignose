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

  return {
    digits: digits,
    isValidNumber: isValidNumber,
    telHref: telHref,
    normalize: normalize,
    matches: matches,
    formatThaiDate: formatThaiDate
  };
});
