/*
 * สมุดเบอร์โทรเมื่อรถเสีย: สร้างรายการเบอร์จาก data.js, ค้นหา, ปุ่มหมวด และแอนิเมชันตอนแตะโทร
 * ไม่มี backend และไม่เก็บข้อมูลผู้ใช้
 */
(function () {
  'use strict';

  var D = window.RSB_DATA, C = window.RSB_CORE, FX = window.FX;
  var doc = document;

  function $(sel, el) { return (el || doc).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function icon(id) { return '<svg class="ic" aria-hidden="true"><use href="#' + id + '"/></svg>'; }

  var listEl = $('#list'), chipsEl = $('#chips'), q = $('#q'), clearBtn = $('#q-clear'), emptyEl = $('#empty');

  // ---------- สร้างรายการเบอร์ ----------
  // เบอร์สั้น (1669) ตัวใหญ่ชิดซ้าย · เบอร์ยาว (02-xxx-xxxx) อยู่ใต้ชื่อ เพื่อไม่ให้ชื่อถูกบีบ
  function row(it, sec) {
    var long = C.digits(it.num).length > 4;
    var num = '<b class="n">' + esc(it.num) + '</b>';
    return '<li class="item"><a class="num' + (sec.tone ? ' ' + sec.tone : '') + (long ? ' long' : '') + '" href="' + C.telHref(it.num) + '">' +
      (long ? '' : num) +
      '<span class="t"><strong>' + esc(it.name) + '</strong>' + (long ? num : '') + '<small>' + esc(it.desc) + '</small></span>' +
      '<i class="call" aria-hidden="true"><i class="wave"></i><i class="wave"></i>' + icon('i-phone') + '</i>' +
      '</a></li>';
  }

  function section(sec) {
    return '<section class="sec' + (sec.tone ? ' ' + sec.tone : '') + '" id="sec-' + sec.id + '" aria-labelledby="h-' + sec.id + '">' +
      '<div class="sec-head"><span class="sec-ic">' + icon(sec.icon) + '</span><div>' +
        '<h2 id="h-' + sec.id + '">' + esc(sec.title) + '</h2>' + (sec.sub ? '<p>' + esc(sec.sub) + '</p>' : '') +
      '</div></div>' +
      '<ul class="nums">' + sec.items.map(function (it) { return row(it, sec); }).join('') + '</ul>' +
      (sec.note ? '<p class="sec-note">' + icon('i-info') + '<span>' + esc(sec.note) + '</span></p>' : '') +
      '</section>';
  }

  listEl.innerHTML = D.sections.map(section).join('');
  chipsEl.innerHTML = D.sections.map(function (s) {
    return '<a class="chip' + (s.tone ? ' ' + s.tone : '') + '" href="#sec-' + s.id + '">' + esc(s.short || s.title) + '</a>';
  }).join('');
  $('#checked').textContent = C.formatThaiDate(D.checked);

  var rows = [];   // [{ li, it, sec }] เรียงตามลำดับที่แสดง
  var secEls = $$('.sec', listEl), chipEls = $$('.chip', chipsEl);
  D.sections.forEach(function (sec, si) {
    $$('.item', secEls[si]).forEach(function (li, ii) { rows.push({ li: li, it: sec.items[ii], sec: sec }); });
  });

  // ---------- ค้นหา ----------
  function applySearch() {
    var query = q.value, appeared = [];
    rows.forEach(function (r) {
      var show = C.matches(r.it, query, r.sec);
      if (show && r.li.hidden) appeared.push(r.li);
      r.li.hidden = !show;
    });
    var any = false;
    secEls.forEach(function (el, i) {
      var visible = $$('.item', el).some(function (li) { return !li.hidden; });
      el.hidden = !visible;
      chipEls[i].hidden = !visible;
      any = any || visible;
    });
    emptyEl.hidden = any;
    clearBtn.hidden = !query;
    FX.cascade(appeared.slice(0, 12), { step: 25, start: 0, y: 8, duration: 280 });
  }

  q.addEventListener('input', applySearch);
  q.addEventListener('keydown', function (e) { if (e.key === 'Enter') q.blur(); });
  clearBtn.addEventListener('click', function () { q.value = ''; applySearch(); q.focus(); });
  $('#empty-clear').addEventListener('click', function () { q.value = ''; applySearch(); q.focus(); });

  // ---------- ปุ่มหมวด: ไฮไลต์หมวดที่กำลังดู ----------
  function setActive(id) {
    chipEls.forEach(function (c) {
      var on = c.getAttribute('href') === '#' + id;
      c.classList.toggle('on', on);
      if (on) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current');
      if (on) chipsEl.scrollTo({ left: c.offsetLeft - (chipsEl.clientWidth - c.offsetWidth) / 2, behavior: FX.enabled() ? 'smooth' : 'auto' });
    });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-140px 0px -55% 0px' });
    secEls.forEach(function (el) { io.observe(el); });
  }
  chipsEl.addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    var target = $(chip.getAttribute('href'));
    if (target) setTimeout(function () { FX.flash($('.sec-ic', target)); }, 350);
  });

  // ---------- แตะเพื่อโทร: ไอคอนโทรศัพท์สั่นเหมือนกำลังเรียกสาย ----------
  listEl.addEventListener('click', function (e) {
    var a = e.target.closest('a.num');
    if (a) FX.ring($('.call', a));
  });

  doc.addEventListener('click', function (e) {
    if (e.target.closest('[data-action="hero"]')) FX.heroReplay();
  });

  // ---------- เริ่มต้น ----------
  FX.hero($('.hero-art'));
  FX.intro(doc);
  // เปิดลิงก์ที่มี #sec-... มา ให้เลื่อนไปหมวดนั้น (รายการถูกสร้างหลังโหลดหน้า)
  if (location.hash) {
    var target = doc.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView();
  }

  // เปิดซ้ำได้แม้สัญญาณเน็ตหลุด (เฉพาะตอนเปิดผ่าน http/https เช่น GitHub Pages)
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* ไม่มีก็ใช้งานได้ปกติ */ });
    });
  }
})();
