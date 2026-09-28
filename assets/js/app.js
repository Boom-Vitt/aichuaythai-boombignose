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
      '<span class="t"><strong>' + esc(it.name) + '</strong>' + (long ? num : '') +
        '<small>' + (it.tag ? '<span class="tag">' + esc(it.tag) + '</span>' : '') + esc(it.desc) + '</small></span>' +
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
  doc.addEventListener('click', function (e) {
    var a = e.target.closest('a.num');
    if (a) FX.ring($('.call', a));
    else if (e.target.closest('[data-action="hero"]')) FX.heroReplay();
  });

  // ---------- แจ้งเตือนสั้น / คัดลอก ----------
  var toastEl = $('#toast'), toastTimer;
  function toast(msg, ms) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, ms || 2800);
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = doc.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      doc.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = doc.execCommand('copy'); } catch (e) { ok = false; }
      doc.body.removeChild(ta);
      if (ok) resolve(); else reject();
    });
  }

  // ---------- ขั้นแรก: รถเสียอยู่ตรงไหน (GPS หรือเลือกเขต) ----------
  var whereEl = $('#where'), pickEl = $('#where-pick'), foundEl = $('#where-found');
  var titleEl = $('#where-title'), subEl = $('#where-sub'), changeBtn = $('#where-change');
  var districtSel = $('#district'), shareBtn = $('#share-loc'), gpsAgain = $('#gps-again');
  var noteEl = $('#where-note');
  var nearbyEl = $('#nearby'), nearTow = $('#near-tow'), nearShop = $('#near-shop'), nearbySub = $('#nearby-sub');
  var wideTow = D.sections.filter(function (s) { return s.id === 'tow'; }).map(function (s) { return s.items; })[0] || [];
  var loc = null, locating = false;

  districtSel.innerHTML += D.districts.map(function (d) { return d[0]; })
    .sort(function (a, b) { return a.localeCompare(b, 'th'); })
    .map(function (n) { return '<option>' + n + '</option>'; }).join('');

  // จำตำแหน่งไว้เฉพาะแท็บนี้ (ปิดแท็บแล้วลืม)
  function saveLoc() { try { sessionStorage.setItem('rsb.loc', JSON.stringify(loc)); } catch (e) { /* ไม่เป็นไร */ } }
  function loadLoc() {
    try {
      var v = JSON.parse(sessionStorage.getItem('rsb.loc'));
      return v && typeof v.lat === 'number' ? v : null;
    } catch (e) { return null; }
  }

  function showWhere(animate) {
    pickEl.hidden = !!loc;
    foundEl.hidden = !loc;
    changeBtn.hidden = !loc;
    if (!loc) {
      titleEl.textContent = 'รถเสียอยู่ตรงไหน?';
      subEl.textContent = 'ใช้ GPS บอกพื้นที่ แล้วส่งตำแหน่งให้คนที่มาช่วยได้ทันที';
      return;
    }
    var gps = loc.src === 'gps';
    titleEl.textContent = !gps ? 'เขต' + loc.district : loc.district ? 'แถวเขต' + loc.district : 'อยู่นอกกรุงเทพฯ';
    subEl.textContent = gps
      ? 'GPS · แม่นยำ ±' + loc.acc + ' ม. · ' + C.formatCoord(loc)
      : 'เลือกเอง · ใช้ GPS ถ้าต้องการส่งพิกัดที่แม่นยำ';
    shareBtn.hidden = !gps;
    gpsAgain.hidden = gps;
    noteEl.hidden = !gps || !!loc.district;
    noteEl.textContent = 'รายชื่อร้านและรถสไลด์ในหน้านี้เน้นกรุงเทพฯ ส่วนเบอร์ฉุกเฉิน ประกันรถ และยี่ห้อรถใช้ได้ทั่วประเทศ';
    if (animate) {
      FX.pinDrop($('.loc-ic', whereEl));
      FX.cascade($$('.where-body:not([hidden]) > :not([hidden])', whereEl), { step: 60, y: 8, duration: 320 });
    }
  }

  // ---------- ใกล้คุณ: รถสไลด์และร้านที่ใกล้ที่สุด แตะโทรได้ในหน้านี้เลย ----------
  function nearItem(x) {
    var p = x.p;
    return row({
      num: p.num, name: p.name, tag: x.same ? 'เขตเดียวกับคุณ' : '',
      desc: [x.same ? 'เขต' + p.district : 'เขต' + p.district + ' ' + C.formatApproxKm(x.km), p.area, p.hours].filter(Boolean).join(' · ')
    }, {});
  }

  function renderNearby(animate) {
    nearbyEl.hidden = !loc;
    if (!loc) return;
    nearTow.innerHTML = wideTow.map(function (it) {
      return row({ num: it.num, name: it.name, desc: it.desc, tag: 'มาหาคุณได้' }, {});
    }).concat(C.nearestPlaces(D.places, loc, D.districts, 'tow', 4).map(nearItem)).join('');
    var shops = C.nearestPlaces(D.places, loc, D.districts, 'shop', 6);
    nearShop.innerHTML = shops.length ? shops.map(nearItem).join('')
      : '<li class="near-empty">ยังไม่มีสาขาในรายการที่อยู่ใกล้คุณ ลองโทรเบอร์กลางของร้านเครือข่ายด้านล่าง</li>';
    nearbySub.textContent = (loc.district ? 'แถวเขต' + loc.district : 'รอบตัวคุณ') + ' · แตะเพื่อโทรได้ทันที';
    if (animate) FX.cascade($$('.item, .near-empty', nearbyEl), { start: 250, step: 60, y: 12 });
  }

  function locate(btn, silent) {
    if (locating) return;
    if (!navigator.geolocation) {
      if (!silent) toast('อุปกรณ์นี้ไม่รองรับ GPS เลือกเขตแทนได้เลย', 4000);
      return;
    }
    locating = true;
    var stopRadar = FX.radar($('.loc-ic', whereEl));
    var label = btn && $('span', btn), old = label && label.textContent;
    if (btn) { btn.disabled = true; label.textContent = 'กำลังหาตำแหน่ง…'; }
    function done() {
      locating = false;
      stopRadar();
      if (btn) { btn.disabled = false; label.textContent = old; }
    }
    navigator.geolocation.getCurrentPosition(function (pos) {
      var p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      loc = {
        lat: p.lat, lng: p.lng, acc: Math.round(pos.coords.accuracy), src: 'gps',
        district: C.inBangkok(p) ? C.nearestDistrict(p, D.districts) : '', ts: Date.now()
      };
      done();
      saveLoc();
      showWhere(true);
      renderNearby(true);
      if (btn) whereEl.scrollIntoView({ behavior: FX.enabled() ? 'smooth' : 'auto', block: 'start' });
    }, function (err) {
      done();
      if (silent) return;
      toast(err && err.code === 1 ? 'ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง เลือกเขตแทนได้เลย' : 'หาตำแหน่งไม่สำเร็จ ลองอีกครั้ง หรือเลือกเขตแทน', 4000);
      if (!pickEl.hidden) districtSel.focus();
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  }

  whereEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-gps]');
    if (btn) locate(btn);
  });
  districtSel.addEventListener('change', function () {
    var p = C.districtPoint(districtSel.value, D.districts);
    if (!p) return;
    loc = { lat: p.lat, lng: p.lng, src: 'district', district: districtSel.value, ts: Date.now() };
    saveLoc();
    showWhere(true);
    renderNearby(true);
  });
  changeBtn.addEventListener('click', function () {
    loc = null;
    saveLoc();
    districtSel.value = '';
    showWhere();
    renderNearby();
    FX.cascade(pickEl.children, { step: 60, y: 8, duration: 280 });
  });
  shareBtn.addEventListener('click', function () {
    var text = C.shareLocationText(loc);
    FX.pop(shareBtn);
    if (navigator.share) {
      navigator.share({ title: 'ตำแหน่งรถเสีย', text: text }).catch(function () { /* ผู้ใช้กดยกเลิก */ });
      return;
    }
    copyText(text).then(function () { toast('คัดลอกตำแหน่งแล้ว วางในแชตได้เลย'); },
      function () { toast('คัดลอกไม่สำเร็จ ลองกดค้างที่พิกัดด้านบนแทน'); });
  });

  // ---------- เริ่มต้น ----------
  loc = loadLoc();
  showWhere(false);
  renderNearby(false);
  // เคยอนุญาต GPS ไว้แล้ว: หาตำแหน่งให้เลยโดยไม่ต้องกด
  if (!loc && navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'geolocation' }).then(function (s) {
      if (s.state === 'granted') locate(null, true);
    }).catch(function () { /* เบราว์เซอร์ไม่รองรับ */ });
  }
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
