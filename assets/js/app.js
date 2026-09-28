/*
 * UI ของเว็บ: เปลี่ยนหน้าด้วย #hash, รายชื่อร้าน, ฟอร์มจองคิว, บัตรคิว และคิวของฉัน
 * ไม่มี backend — การจองเก็บไว้ใน localStorage ของเครื่องผู้ใช้
 */
(function () {
  'use strict';

  var D = window.RSB_DATA, C = window.RSB_CORE, FX = window.FX;
  var SVC = D.services;
  var doc = document, html = doc.documentElement;

  function $(sel, el) { return (el || doc).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(sel)); }

  var homeEl = $('#home'), appEl = $('#app'), toastEl = $('#toast');
  var sosDlg = $('#sos'), askDlg = $('#ask');
  var tb = {
    back: $('.tb-back'), brand: $('.brand'), title: $('.tb-title'), h1: $('#viewTitle'),
    queue: $('.tb-btn[href="#/queue"]'), count: $('.tb-count')
  };
  var HOME_TITLE = doc.title;

  // ---------- เก็บข้อมูลในเครื่อง ----------
  var memory = {};
  function load(key, fallback) {
    if (key in memory) return memory[key];
    try {
      var raw = localStorage.getItem('rsb.' + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function save(key, value) {
    memory[key] = value;
    try { localStorage.setItem('rsb.' + key, JSON.stringify(value)); } catch (e) { /* โหมดส่วนตัว: ใช้หน่วยความจำแทน */ }
  }

  var GPS_TTL = 60 * 60 * 1000; // ตำแหน่ง GPS เก่าเกิน 1 ชม. ถือว่าหมดอายุ
  var state = {
    loc: freshLoc(load('loc', null)),
    bookings: load('bookings', []),
    profile: load('profile', {}) || {}
  };
  if (!Array.isArray(state.bookings)) state.bookings = [];

  function freshLoc(l) {
    return l && typeof l.lat === 'number' && (l.src !== 'gps' || Date.now() - l.ts < GPS_TTL) ? l : null;
  }
  function setLoc(l) { state.loc = l; save('loc', l); }

  // ---------- ตัวช่วย ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function icon(id) { return '<svg class="ic" aria-hidden="true"><use href="#' + id + '"/></svg>'; }
  function svcIcon(type) { return '<svg class="svc" aria-hidden="true"><use href="#svc-' + type + '"/></svg>'; }
  function providerById(id) {
    for (var i = 0; i < D.providers.length; i++) if (D.providers[i].id === id) return D.providers[i];
    return null;
  }
  function bookingById(id) {
    for (var i = 0; i < state.bookings.length; i++) if (state.bookings[i].id === id) return state.bookings[i];
    return null;
  }
  function rnd() {
    if (window.crypto && crypto.getRandomValues) {
      var a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return a[0] / 4294967296;
    }
    return Math.random();
  }
  function slotMode(p) { return p.type === 'garage' ? 'visit' : 'come'; }

  var toastTimer;
  function toast(msg, ms) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, ms || 2800);
  }

  // ---------- แถบบน ----------
  function setTopbar(opts) {
    var home = !opts;
    tb.back.hidden = home;
    tb.title.hidden = home;
    tb.brand.hidden = !home;
    if (!home) {
      tb.back.setAttribute('href', opts.back);
      tb.h1.textContent = opts.title;
      $('p', tb.title).textContent = opts.sub || '';
    }
    doc.title = home ? HOME_TITLE : opts.title + ' · เพื่อนยามรถเสีย';
  }

  function updateCount(bump) {
    var now = new Date();
    var n = state.bookings.filter(function (b) { return C.isOpenBooking(b, now); }).length;
    tb.count.textContent = n;
    tb.count.hidden = !n;
    tb.queue.setAttribute('aria-label', n ? 'คิวของฉัน (' + n + ' คิว)' : 'คิวของฉัน');
    if (bump) FX.pop(tb.count);
  }

  // ---------- เปลี่ยนหน้า (#/..., #/slide, #/book/id, #/ticket/id, #/queue) ----------
  var VIEWS = { list: renderList, book: renderBook, ticket: renderTicket, queue: renderQueue };
  var stack = [], replacing = false, justBooked = null, homeShown = false, started = false;

  function currentHash() { return location.hash && location.hash !== '#' ? location.hash : '#/'; }
  function go(hash, replace) {
    if (replace) { replacing = true; location.replace(hash); } else location.hash = hash;
  }
  // จำเส้นทางไว้ ให้ปุ่มย้อนกลับในแอปทำงานเหมือนปุ่ม back ของมือถือ
  function track() {
    var h = currentHash();
    if (replacing && stack.length) stack[stack.length - 1] = h;
    else if (stack.length > 1 && stack[stack.length - 2] === h) stack.pop();
    else if (stack[stack.length - 1] !== h) stack.push(h);
    replacing = false;
  }
  function parseRoute() {
    var parts = currentHash().replace(/^#\/?/, '').split('/');
    var head = parts[0], id = parts[1] ? decodeURIComponent(parts[1]) : '';
    if (!head) return { name: 'home' };
    if (Object.prototype.hasOwnProperty.call(SVC, head)) return { name: 'list', type: head };
    if ((head === 'book' || head === 'ticket') && id) return { name: head, id: id };
    if (head === 'queue') return { name: 'queue' };
    return { name: 'home' };
  }

  function render() {
    track();
    FX.stop();
    var r = parseRoute();
    html.classList.remove('deep');
    if (r.name === 'home') {
      showHome();
    } else {
      FX.heroFinish();
      if (VIEWS[r.name](r) === false) { go('#/', true); return; }
      homeEl.hidden = true;
      appEl.hidden = false;
      FX.view(appEl);
    }
    updateCount();
    window.scrollTo(0, 0);
    if (started) (r.name === 'home' ? $('#homeTitle') : tb.h1).focus({ preventScroll: true });
    started = true;
  }

  function showHome() {
    setTopbar(null);
    appEl.hidden = true;
    appEl.innerHTML = '';
    homeEl.hidden = false;
    if (!homeShown) {
      homeShown = true;
      FX.hero($('.hero-art', homeEl));
      FX.homeIn(homeEl);
    } else {
      FX.view(homeEl);
    }
  }

  // ---------- ตำแหน่งของผู้ใช้ ----------
  function locText(loc, forForm) {
    if (!loc) {
      return forForm
        ? { b: 'ยังไม่รู้ตำแหน่งรถ', s: 'ใช้ GPS หรือเลือกเขต แล้วพิมพ์จุดสังเกตด้านล่าง' }
        : { b: 'ยังไม่รู้ตำแหน่งของคุณ', s: 'ตอนนี้เรียงตามคะแนนรีวิว' };
    }
    if (loc.src === 'gps') return { b: 'แถวเขต' + loc.district, s: 'จาก GPS · แม่นยำ ±' + loc.acc + ' ม.' };
    return { b: 'เขต' + loc.district, s: 'เลือกเอง · ระยะทางเป็นค่าประมาณ' };
  }

  function districtSelect(loc) {
    var names = D.districts.map(function (d) { return d[0]; }).sort(function (a, b) { return a.localeCompare(b, 'th'); });
    return '<select class="input" data-role="district"><option value="">— เลือกเขต —</option>' +
      names.map(function (n) {
        return '<option' + (loc && loc.src === 'district' && loc.district === n ? ' selected' : '') + '>' + n + '</option>';
      }).join('') + '</select>';
  }

  function gpsButton(label, primary) {
    return '<button class="btn ' + (primary ? 'primary' : 'ghost') + ' block" type="button" data-action="gps">' +
      icon('i-gps') + '<span>' + label + '</span></button>';
  }

  function locRow(loc, forForm, extra) {
    var t = locText(loc, forForm);
    return '<div class="loc-row"><span class="loc-ic">' + icon('i-pin') + '<i class="ring"></i><i class="ring"></i></span>' +
      '<p class="loc-text"><b>' + esc(t.b) + '</b><span>' + esc(t.s) + '</span></p>' + (extra || '') + '</div>';
  }

  function locCard(loc) {
    return '<section class="loc" aria-label="ตำแหน่งของคุณ">' +
      locRow(loc, false, loc ? '<button class="btn sm ghost" type="button" data-action="loc-edit" aria-expanded="false">เปลี่ยน</button>' : '') +
      '<div class="loc-pick"' + (loc ? ' hidden' : '') + '>' +
        gpsButton('ใช้ตำแหน่งปัจจุบัน', true) +
        '<label class="select-lbl"><span>หรือเลือกเขตที่อยู่ตอนนี้</span>' + districtSelect(loc) + '</label>' +
      '</div></section>';
  }

  function pickupStatus() {
    var loc = state.loc;
    if (loc && loc.src === 'gps') {
      return locRow(loc, true, '<button class="btn sm ghost" type="button" data-action="gps"><span>อัปเดต</span></button>');
    }
    return locRow(loc, true) +
      '<div class="loc-pick">' + gpsButton(loc ? 'ใช้ GPS (แม่นยำกว่า)' : 'ใช้ตำแหน่งปัจจุบัน', !loc) +
      '<label class="select-lbl"><span>หรือเลือกเขต</span>' + districtSelect(loc) + '</label></div>';
  }

  function locate() {
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) { reject({ code: 0 }); return; }
      navigator.geolocation.getCurrentPosition(function (pos) {
        var pt = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        resolve({
          lat: pt.lat, lng: pt.lng, acc: Math.round(pos.coords.accuracy), src: 'gps',
          district: C.nearestDistrict(pt, D.districts), ts: Date.now()
        });
      }, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
    });
  }

  var locating = false;
  function onGps(btn) {
    if (locating) return;
    locating = true;
    var box = btn.closest('.loc, .pick-where');
    var stopRadar = FX.radar($('.loc-ic', box));
    var label = $('span', btn), old = label.textContent;
    btn.disabled = true;
    label.textContent = 'กำลังหาตำแหน่ง…';
    locate().then(function (loc) {
      setLoc(loc);
      toast(C.inBangkok(loc)
        ? 'เจอตำแหน่งแล้ว: แถวเขต' + loc.district
        : 'ดูเหมือนคุณอยู่นอกกรุงเทพฯ ตอนนี้มีข้อมูลเฉพาะในกรุงเทพฯ', 4000);
      afterLocChange(box);
    }, function (err) {
      btn.disabled = false;
      label.textContent = old;
      toast(err && err.code === 1 ? 'ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง เลือกเขตแทนได้เลย'
        : err && err.code === 0 ? 'อุปกรณ์นี้ไม่รองรับ GPS เลือกเขตแทนได้เลย'
        : 'หาตำแหน่งไม่สำเร็จ ลองอีกครั้ง หรือเลือกเขตแทน', 4000);
      var sel = $('select', box);
      if (sel) sel.focus();
    }).then(function () {
      locating = false;
      stopRadar();
    });
  }

  function onDistrict(sel) {
    if (!sel.value) return;
    var pt = C.districtPoint(sel.value, D.districts);
    setLoc({ lat: pt.lat, lng: pt.lng, src: 'district', district: sel.value, ts: Date.now() });
    afterLocChange(sel.closest('.loc, .pick-where'));
  }

  function afterLocChange(box) {
    var form = box && box.closest('form.book');
    if (form) {
      var where = $('.pick-where', form);
      where.innerHTML = pickupStatus();
      FX.pinDrop($('.loc-ic', where));
      if (state.loc && state.loc.src === 'gps') clearError(form, 'landmark');
      syncForm(form, providerById(form.getAttribute('data-id')));
      return;
    }
    var r = parseRoute();
    if (r.name === 'list') {
      renderList(r);
      FX.pinDrop($('.loc-ic', appEl));
    }
  }

  // ---------- หน้ารายชื่อผู้ให้บริการ ----------
  function sampleNote() {
    if (!D.sample) return '';
    return '<p class="note">' + icon('i-info') + '<span>รายชื่อร้านเป็นข้อมูลตัวอย่างเพื่อสาธิต · มีคนเจ็บหรืออยู่ในจุดอันตราย ' +
      '<button class="linklike" type="button" data-action="sos">โทรฉุกเฉิน</button></span></p>';
  }

  function renderList(r) {
    var svc = SVC[r.type], loc = state.loc;
    var ranked = C.rankProviders(D.providers, r.type, loc, new Date());
    setTopbar({ back: '#/', title: svc.title, sub: svc.sub });
    appEl.innerHTML = locCard(loc) + sampleNote() +
      '<ul class="plist">' + ranked.map(function (x, i) { return providerCard(x, i, !!loc); }).join('') + '</ul>';
    FX.cascade($$('.pcard', appEl), { start: 120 });
  }

  function providerCard(x, i, hasLoc) {
    var p = x.p, truck = p.type !== 'garage', facts = [];
    if (x.km != null) facts.push('<li>' + icon('i-pin') + 'ห่าง ' + C.formatKm(x.km) + '</li>');
    if (truck && x.km != null && x.open.open) facts.push('<li>' + icon('i-clock') + 'มาถึง ~' + C.etaMinutes(x.km) + ' นาที</li>');
    if (truck) facts.push('<li>' + icon('i-tag') + C.priceFrom(p) + '</li>');
    facts.push('<li class="' + (x.open.open ? 'open' : 'closed') + '">' + icon(x.open.open ? 'i-check' : 'i-clock') + esc(x.open.label) + '</li>');
    if (p.mobile) facts.push('<li class="mobile">' + icon('i-wrench') + 'มีช่างมาหา</li>');
    return '<li class="pcard' + (i === 0 ? ' first' : '') + '">' +
      (i === 0 ? '<span class="badge">' + (hasLoc ? 'ใกล้คุณที่สุด' : 'คะแนนสูงสุด') + '</span>' : '') +
      '<div class="p-top"><span class="p-av">' + svcIcon(p.type) + '</span><div class="p-main">' +
        '<h2 class="p-name">' + esc(p.name) + '</h2>' +
        '<p class="p-sub"><span class="rating">' + icon('i-star') + p.rating.toFixed(1) + '</span>' +
          '<span>(' + p.reviews + ' รีวิว)</span><span>เขต' + esc(p.district) + '</span></p>' +
        '<p class="p-area">' + esc(p.area) + '</p>' +
      '</div></div>' +
      '<ul class="p-facts">' + facts.join('') + '</ul>' +
      (p.tags && p.tags.length ? '<p class="p-tags">' + p.tags.map(esc).join(' · ') + '</p>' : '') +
      '<div class="p-act"><a class="btn primary" href="#/book/' + encodeURIComponent(p.id) + '">' + icon('i-ticket') + 'จองคิว</a>' +
        (p.phone ? '<a class="btn ghost icon" href="tel:' + esc(p.phone) + '" aria-label="โทรหา ' + esc(p.name) + '">' + icon('i-phone') + '</a>' : '') +
      '</div></li>';
  }

  // ---------- หน้าจองคิว ----------
  var CTA_TRUCK = '<svg class="cta-truck" viewBox="0 0 46 25" aria-hidden="true">' +
    '<path d="M1 16.5v-3l2.5-2.5H26v5.5z"/>' +
    '<path class="glass" d="M11 11V8.2c0-.7.5-1.2 1.1-1.3l2.4-.4 2.4-2.8c.4-.4.9-.7 1.5-.7h4.3c.6 0 1.1.3 1.5.7l2.2 2.8V11z"/>' +
    '<path d="M27 17.5V6.6c0-.9.7-1.6 1.6-1.6h5.2c.6 0 1.1.3 1.4.7l4.9 6.3c.3.4.5.8.5 1.3v4.2z"/>' +
    '<path class="glass" d="M29 6.8h4.4l3.4 4.4H29z"/>' +
    '<rect x="2" y="16.5" width="41" height="3" rx="1"/>' +
    '<circle cx="10" cy="20.5" r="3.6"/><circle cx="35" cy="20.5" r="3.6"/></svg>';

  function opt(type, name, value, label, checked, cls, extra) {
    return '<label class="opt' + (cls ? ' ' + cls : '') + '"><input type="' + type + '" name="' + name + '" value="' + esc(value) + '"' +
      (checked ? ' checked' : '') + (extra || '') + '><span>' + label + '</span></label>';
  }

  function takenTimes(pid, key) {
    return state.bookings.filter(function (b) {
      return b.providerId === pid && b.status !== 'cancelled' && b.slot && b.slot.date === key;
    }).map(function (b) { return b.slot.time; });
  }

  function daysHtml(p, now, selected) {
    var today = C.dayKey(now), tomorrow = C.dayKey(C.addDays(now, 1));
    return C.bookingDays(p, now, 7).map(function (d) {
      var top = d.key === today ? 'วันนี้' : d.key === tomorrow ? 'พรุ่งนี้' : C.DAYS[d.date.getDay()];
      var bottom = d.closed ? 'ร้านปิด' : d.date.getDate() + ' ' + C.MONTHS[d.date.getMonth()];
      return opt('radio', 'date', d.key, '<b>' + top + '</b><small>' + bottom + '</small>', d.key === selected, 'day', d.closed ? ' disabled' : '');
    }).join('');
  }

  function firstFreeTime(p, key, now) {
    var free = C.daySlots(p, key, now, takenTimes(p.id, key), slotMode(p)).filter(function (s) { return s.state === 'free'; });
    return free.length ? free[0].time : null;
  }

  function slotsHtml(p, key, now, selected) {
    var list = C.daySlots(p, key, now, takenTimes(p.id, key), slotMode(p));
    if (!list.some(function (s) { return s.state === 'free'; })) {
      return '<p class="slots-empty">วันที่เลือกไม่มีช่วงเวลาว่างแล้ว ลองเลือกวันอื่น</p>';
    }
    return list.map(function (s) {
      var note = s.state === 'full' ? '<small>เต็ม</small>' : s.state === 'mine' ? '<small>คิวคุณ</small>' : '';
      return opt('radio', 'time', s.time, s.time + note, s.state === 'free' && s.time === selected,
        'slot ' + s.state, s.state !== 'free' ? ' disabled' : '');
    }).join('');
  }

  function problemsTitle(mode) { return mode === 'visit' ? 'ต้องการซ่อมอะไร?' : 'รถเป็นอะไร?'; }
  function problemChips(mode, checked) {
    return D.problems[mode].map(function (t) {
      return opt('checkbox', 'problem', t, esc(t), checked && checked.indexOf(t) >= 0, 'chip');
    }).join('');
  }

  function field(name, label, value, type, ac, ph, max, required) {
    return '<div><label class="field"><span>' + label + '</span><input class="input" name="' + name + '" type="' + type + '"' +
      (type === 'tel' ? ' inputmode="tel"' : '') + ' autocomplete="' + ac + '" maxlength="' + max + '" placeholder="' + esc(ph) + '"' +
      ' value="' + esc(value || '') + '"' + (required ? ' aria-required="true" aria-describedby="err-' + name + '"' : '') + '></label>' +
      (required ? '<p class="err" id="err-' + name + '" data-err="' + name + '" hidden></p>' : '') + '</div>';
  }

  function renderBook(r) {
    var p = providerById(r.id);
    if (!p) return false;
    var svc = SVC[p.type], prof = state.profile, now = new Date();
    var mode = slotMode(p);
    var first = C.firstFreeSlot(p, now, function (key) { return takenTimes(p.id, key); }, mode);
    var dateKey = first ? first.date : C.dayKey(now);
    setTopbar({ back: '#/' + p.type, title: 'จองคิว' + svc.label, sub: p.name });
    appEl.innerHTML =
      '<section class="psum"><span class="p-av">' + svcIcon(p.type) + '</span><div class="p-main">' +
        '<p class="p-name">' + esc(p.name) + '</p>' +
        '<p class="p-sub"><span class="rating">' + icon('i-star') + p.rating.toFixed(1) + '</span><span>เขต' + esc(p.district) + '</span>' +
          '<span>' + esc(C.openState(p, now).label) + '</span></p>' +
        (p.price ? '<p class="p-price">' + esc(C.priceDetail(p)) + '</p>' : '') +
      '</div></section>' +
      '<form class="book" novalidate data-id="' + esc(p.id) + '">' +
        (p.mobile
          ? '<div class="seg mode-seg" role="radiogroup" aria-label="รูปแบบบริการ">' +
              opt('radio', 'mode', 'visit', icon('i-wrench') + 'นำรถเข้าอู่', true) +
              opt('radio', 'mode', 'come', icon('i-pin') + 'ให้ช่างมาหา', false) + '</div>'
          : '<input type="hidden" name="mode" value="' + mode + '">') +
        '<fieldset class="fs pickup" data-show="come"><legend><span class="n">1</span><span class="lg">' +
          (p.type === 'garage' ? 'ให้ช่างไปหาที่ไหน?' : 'รถอยู่ที่ไหน?') + '</span></legend>' +
          '<div class="pick-where">' + pickupStatus() + '</div>' +
          '<div class="stack pick-more">' +
            field('landmark', 'จุดสังเกต <small>(ช่วยให้หาเจอเร็วขึ้น)</small>', '', 'text', 'off', 'เช่น หน้าเซเว่น ซ.สุขุมวิท 101/1 ฝั่งขาออก', 120, true) +
            (p.type !== 'garage' ? field('destination', 'ลากไปที่ไหน? <small>(ไม่บังคับ)</small>', '', 'text', 'off', 'เช่น อู่ประจำ ศูนย์บริการ หรือบ้าน', 100, false) : '') +
          '</div></fieldset>' +
        '<fieldset class="fs when"><legend><span class="n">2</span><span class="lg">ต้องการเมื่อไหร่?</span></legend>' +
          '<div class="seg" data-show="come" role="radiogroup" aria-label="ต้องการเมื่อไหร่">' +
            opt('radio', 'when', 'now', icon('i-alert') + 'ด่วน ตอนนี้', true) +
            opt('radio', 'when', 'later', icon('i-clock') + 'นัดเวลา', false) + '</div>' +
          '<div class="sched" data-show="sched">' +
            '<div class="days" role="radiogroup" aria-label="เลือกวัน">' + daysHtml(p, now, dateKey) + '</div>' +
            '<div class="slots" role="radiogroup" aria-label="เลือกเวลา">' + slotsHtml(p, dateKey, now, first ? first.time : null) + '</div>' +
          '</div>' +
          '<p class="err" data-err="slot" hidden></p>' +
        '</fieldset>' +
        '<fieldset class="fs problems"><legend><span class="n">3</span><span class="lg">' + problemsTitle(mode) + '</span>' +
          '<small>(เลือกได้หลายข้อ)</small></legend><div class="chips">' + problemChips(mode) + '</div></fieldset>' +
        '<fieldset class="fs"><legend><span class="n">4</span><span class="lg">ติดต่อคุณ</span></legend><div class="stack">' +
          field('name', 'ชื่อ', prof.name, 'text', 'name', 'เช่น สมชาย', 60, true) +
          field('phone', 'เบอร์โทร', prof.phone ? C.formatPhone(prof.phone) : '', 'tel', 'tel', '08x-xxx-xxxx', 16, true) +
          field('car', 'รถของคุณ <small>(ไม่บังคับ)</small>', prof.car, 'text', 'off', 'เช่น Honda City สีขาว กข 1234', 60, false) +
        '</div></fieldset>' +
        '<div class="cta-bar"><p class="cta-sum" aria-live="polite"></p>' +
          '<button class="btn primary block cta" type="submit"><span class="cta-label">ยืนยันจองคิว</span>' +
          '<span class="cta-road" aria-hidden="true">' + CTA_TRUCK + '</span></button></div>' +
      '</form>';
    syncForm($('form.book', appEl), p);
  }

  function checkedVal(form, name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }
  function modeOf(form) {
    var hidden = form.querySelector('input[name="mode"][type="hidden"]');
    return hidden ? hidden.value : checkedVal(form, 'mode');
  }
  function textVal(form, name) {
    var el = form.elements[name];
    return el && el.value ? el.value : '';
  }

  function summaryText(form, p, sched) {
    if (sched) {
      var d = checkedVal(form, 'date'), t = checkedVal(form, 'time');
      return d && t ? 'นัด ' + C.formatDay(d, new Date()) + ' เวลา ' + t + ' น.' : 'เลือกวันและเวลาที่ต้องการ';
    }
    var parts = [p.type === 'garage' ? 'ให้ช่างมาหาด่วน' : 'ด่วน'];
    if (state.loc) {
      var km = C.distanceKm(state.loc, p);
      parts.push('ห่าง ~' + C.formatKm(km), 'มาถึง ~' + C.etaMinutes(km) + ' นาที');
    }
    if (p.price) parts.push(C.priceFrom(p));
    return parts.join(' · ');
  }

  // แสดง/ซ่อนส่วนต่าง ๆ ของฟอร์มตามตัวเลือก แล้วเรียงเลขขั้นตอนใหม่
  function syncForm(form, p) {
    var mode = modeOf(form);
    var sched = mode === 'visit' || checkedVal(form, 'when') === 'later';
    $$('[data-show]', form).forEach(function (el) {
      var s = el.getAttribute('data-show');
      el.hidden = s === 'come' ? mode !== 'come' : s === 'sched' ? !sched : false;
    });
    $('.when .lg', form).textContent = mode === 'come' ? 'ต้องการเมื่อไหร่?' : 'เลือกวันและเวลา';
    var n = 0;
    $$('fieldset.fs', form).forEach(function (fs) { if (!fs.hidden) $('.n', fs).textContent = ++n; });
    $('.cta-sum', form).textContent = summaryText(form, p, sched);
  }

  function readForm(form) {
    return {
      mode: modeOf(form),
      when: checkedVal(form, 'when') || 'now',
      date: checkedVal(form, 'date'),
      time: checkedVal(form, 'time'),
      pickup: state.loc,
      landmark: textVal(form, 'landmark'),
      destination: textVal(form, 'destination'),
      problems: $$('input[name="problem"]:checked', form).map(function (i) { return i.value; }),
      name: textVal(form, 'name'),
      phone: textVal(form, 'phone'),
      car: textVal(form, 'car')
    };
  }

  function clearError(form, key) {
    var msg = $('[data-err="' + key + '"]', form);
    if (msg) { msg.hidden = true; msg.textContent = ''; }
    var input = form.elements[key];
    if (input && input.closest) {
      input.removeAttribute('aria-invalid');
      var f = input.closest('.field');
      if (f) f.classList.remove('invalid');
    }
  }

  function showErrors(form, errors) {
    $$('[data-err]', form).forEach(function (el) { clearError(form, el.getAttribute('data-err')); });
    Object.keys(errors).forEach(function (key) {
      var msg = $('[data-err="' + key + '"]', form);
      if (msg) { msg.textContent = errors[key]; msg.hidden = false; }
      var input = form.elements[key];
      if (input && input.closest) {
        input.setAttribute('aria-invalid', 'true');
        var f = input.closest('.field');
        if (f) f.classList.add('invalid');
      }
    });
  }

  function onFormChange(form, t) {
    var p = providerById(form.getAttribute('data-id'));
    if (t.name === 'mode') {
      var checked = $$('input[name="problem"]:checked', form).map(function (i) { return i.value; });
      $('.problems .lg', form).textContent = problemsTitle(t.value);
      $('.problems .chips', form).innerHTML = problemChips(t.value, checked);
    } else if (t.name === 'date') {
      var box = $('.slots', form), now = new Date();
      box.innerHTML = slotsHtml(p, t.value, now, firstFreeTime(p, t.value, now));
      FX.cascade($$('.slot', box), { start: 0, step: 18, y: 6, duration: 260 });
    } else if (t.type === 'checkbox' || t.type === 'radio') {
      FX.pop(t.nextElementSibling);
    }
    clearError(form, t.name === 'date' || t.name === 'time' || t.name === 'when' ? 'slot' : t.name);
    syncForm(form, p);
    if (t.name === 'when' && t.value === 'later') FX.reveal($('.sched', form));
  }

  function onSubmit(form) {
    if (form.getAttribute('aria-busy') === 'true') return; // กันจองซ้ำระหว่างรถวิ่งผ่านปุ่ม
    var p = providerById(form.getAttribute('data-id'));
    var f = readForm(form);
    var errors = C.validateBooking(f);
    showErrors(form, errors);
    var firstErr = $$('[data-err]', form).filter(function (el) { return !el.hidden; })[0];
    if (firstErr) {
      var fs = firstErr.closest('fieldset');
      fs.scrollIntoView({ behavior: FX.enabled() ? 'smooth' : 'auto', block: 'center' });
      FX.shake(fs);
      var input = $('[aria-invalid="true"]', fs) || $('input:not([type="hidden"]):not(:disabled)', fs);
      if (input) input.focus({ preventScroll: true });
      return;
    }
    var b = C.createBooking(f, p, SVC[p.type], { now: new Date(), existing: state.bookings, rnd: rnd });
    state.bookings.unshift(b);
    save('bookings', state.bookings);
    state.profile = { name: b.name, phone: b.phone, car: b.car };
    save('profile', state.profile);
    justBooked = b.id;
    var btn = $('.cta', form);
    form.setAttribute('aria-busy', 'true');
    btn.disabled = true;
    $('.cta-label', btn).textContent = 'กำลังจองคิว…';
    FX.drive(btn).then(function () {
      go('#/ticket/' + encodeURIComponent(b.id), true);
      updateCount(true);
    });
  }

  // ---------- บัตรคิว ----------
  var ROUTE = 'M40 34C110 34 92 100 160 94S222 104 258 104';
  var MINI_TRUCK = '<rect class="mt-body" x="-14" y="-1" width="17" height="4" rx="1"/>' +
    '<path class="mt-cab" d="M3 4V-5.5Q3-7 4.5-7h4.2q.9 0 1.4.7l3.3 4.4q.6.7.6 1.6V4z"/>' +
    '<path class="mt-glass" d="M5-5.2h3.3l2.4 3.2H5z"/>' +
    '<rect class="mt-body" x="-14" y="3" width="28" height="2.4" rx="1"/>' +
    '<circle class="mt-body" cx="-8" cy="6.5" r="3"/><circle class="mt-body" cx="8.5" cy="6.5" r="3"/>';

  function routeFigure(b) {
    return '<figure class="route">' +
      '<svg class="route-map" viewBox="0 0 320 140" role="img" aria-label="ภาพประกอบเส้นทางจากผู้ให้บริการมาหาคุณ">' +
        '<path class="r-grid" d="M0 28H320M0 76H320M0 120H320M64 0V140M150 0V140M236 0V140"/>' +
        '<path class="r-river" d="M0 104C58 92 96 132 166 126S262 92 320 108"/>' +
        '<path class="route-base" d="' + ROUTE + '"/><path class="route-path" d="' + ROUTE + '"/>' +
        '<g class="r-shop"><circle cx="40" cy="34" r="16"/><use href="#svc-' + b.type + '" x="28" y="22" width="24" height="24"/></g>' +
        '<g class="route-truck">' + MINI_TRUCK + '</g>' +
        '<circle class="route-ring" cx="278" cy="96" r="11"/>' +
        '<g class="route-you"><path d="M278 112c-7-7-11-12-11-17a11 11 0 0 1 22 0c0 5-4 10-11 17z"/><circle cx="278" cy="95" r="4"/></g>' +
      '</svg>' +
      '<figcaption><span>' + icon('i-route') + 'ห่างจากคุณ ~' + C.formatKm(b.km) + '</span>' +
        '<span>' + (b.eta ? 'เดินทางประมาณ ' + b.eta + ' นาที' : 'มาตามเวลานัด') + '</span></figcaption></figure>';
  }

  function ticketRows(b, p) {
    var rows = [['ผู้ให้บริการ', p.name], ['เวลา', C.whenText(b, new Date())]];
    if (b.mode === 'come' && b.pickup) {
      rows.push(['จุดที่รถอยู่', b.pickup.landmark || (b.pickup.district ? 'แถวเขต' + b.pickup.district : '—')]);
      if (b.destination) rows.push(['ลากไปที่', b.destination]);
    } else {
      rows.push(['ที่อยู่ร้าน', p.area + ' เขต' + p.district]);
    }
    if (b.problems.length) rows.push([b.mode === 'visit' ? 'งานที่ต้องการ' : 'อาการ', b.problems.join(', ')]);
    if (p.price) rows.push(['ราคาเริ่มต้น', C.formatBaht(p.price.base)]);
    rows.push(['ผู้ติดต่อ', b.name + ' · ' + C.formatPhone(b.phone)]);
    if (b.car) rows.push(['รถ', b.car]);
    rows.push(['รหัสจอง', b.id]);
    return rows.map(function (row) { return '<div><dt>' + row[0] + '</dt><dd>' + esc(row[1]) + '</dd></div>'; }).join('');
  }

  function ticketTip(b) {
    var t = b.mode === 'visit'
      ? 'ไปถึงก่อนเวลานัดสัก 10 นาที ถ้าจะเคลมประกัน เตรียมกรมธรรม์และใบขับขี่ไปด้วย'
      : b.slot ? 'ถึงเวลานัดให้รออยู่ใกล้รถ และเปิดเสียงโทรศัพท์ไว้'
      : 'ระหว่างรอ เปิดไฟฉุกเฉิน รอในจุดที่ปลอดภัย และเปิดเสียงโทรศัพท์ไว้';
    return '<p class="t-tip">' + icon('i-info') + '<span>' + t + '</span></p>';
  }

  function renderTicket(r) {
    var b = bookingById(r.id);
    var p = b && providerById(b.providerId);
    if (!p) return false;
    var svc = SVC[b.type], st = C.bookingStatus(b, new Date());
    var fresh = justBooked === b.id, open = st.key === 'active' || st.key === 'upcoming';
    justBooked = null;
    setTopbar({ back: '#/queue', title: 'บัตรคิว ' + b.queueNo, sub: p.name });
    var actions = '<div class="t-actions">' +
      '<button class="btn primary block" type="button" data-action="share" data-id="' + esc(b.id) + '">' + icon('i-share') +
        (b.pickup && b.pickup.src === 'gps' ? 'แชร์รายละเอียด + ตำแหน่ง' : 'แชร์รายละเอียด') + '</button>' +
      (p.phone && open
        ? '<div class="t-row2"><a class="btn ghost" href="tel:' + esc(p.phone) + '">' + icon('i-phone') + 'โทรหาร้าน</a>' +
          '<a class="btn ghost" href="sms:' + esc(p.phone) + '?&body=' + encodeURIComponent(C.shareText(b, p, svc)) + '">' + icon('i-sms') + 'ส่ง SMS</a></div>'
        : '') +
      (open ? '<button class="btn text" type="button" data-action="cancel" data-id="' + esc(b.id) + '">ยกเลิกคิวนี้</button>' : '') +
      '</div>';
    appEl.innerHTML =
      (fresh
        ? '<div class="done-head"><svg class="done-check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="25"/>' +
          '<path d="M15 27l7 7 15-16"/></svg><div><p class="done-title">จองคิวสำเร็จ!</p>' +
          '<p class="done-sub">บันทึกบัตรคิวไว้ในเครื่องนี้แล้ว</p></div></div>'
        : '') +
      '<div class="ticket-wrap"><div class="ticket-slot" aria-hidden="true"></div><div class="ticket-clip">' +
        '<article class="ticket' + (st.key === 'cancelled' ? ' is-cancelled' : '') + '" aria-label="บัตรคิว ' + b.queueNo + '">' +
          '<p class="t-label">บัตรคิว · ' + svc.label + '</p>' +
          '<p class="t-no">' + b.queueNo + '</p>' +
          '<p class="status ' + st.key + '">' + st.label + '</p>' +
          '<div class="t-perf" aria-hidden="true"></div>' +
          '<dl class="t-rows">' + ticketRows(b, p) + '</dl>' +
          (st.key === 'cancelled' ? '<span class="stamp">ยกเลิกแล้ว</span>' : '') +
        '</article></div></div>' +
      (open && b.mode === 'come' && b.km != null ? routeFigure(b) : '') +
      (open ? ticketTip(b) : '') +
      actions +
      (D.sample ? '<p class="note">' + icon('i-info') + '<span>เวอร์ชันสาธิต: บัตรคิวนี้บันทึกในเครื่องของคุณเท่านั้น ยังไม่ได้ส่งถึงร้านจริง</span></p>' : '');
    FX.ticket(appEl, { fresh: fresh });
  }

  // ---------- คิวของฉัน ----------
  var EMPTY_ART = '<svg class="empty-art" viewBox="0 0 150 90" aria-hidden="true">' +
    '<path class="t" d="M12 18h126v16a9 9 0 0 0 0 18v16H12V52a9 9 0 0 0 0-18z"/>' +
    '<path class="d" d="M104 22v44"/>' +
    '<rect class="q" x="28" y="34" width="54" height="8" rx="4"/><rect class="q" x="28" y="48" width="36" height="6" rx="3" opacity=".45"/></svg>';

  function renderQueue() {
    var now = new Date(), list = state.bookings;
    setTopbar({ back: '#/', title: 'คิวของฉัน', sub: list.length ? list.length + ' รายการ · บันทึกในเครื่องนี้' : 'ยังไม่มีคิว' });
    if (!list.length) {
      appEl.innerHTML = '<div class="empty">' + EMPTY_ART + '<p class="empty-title">ยังไม่มีคิว</p>' +
        '<p>จองคิวแล้วบัตรคิวจะอยู่ที่นี่ เปิดดูได้แม้สัญญาณเน็ตไม่ดี</p>' +
        '<a class="btn primary" href="#/">' + icon('i-alert') + 'เรียกความช่วยเหลือ</a></div>';
      FX.cascade($$('.empty > *', appEl), { step: 70 });
      return;
    }
    appEl.innerHTML = '<ul class="qlist">' + list.map(function (b) {
      var p = providerById(b.providerId);
      if (!p) return '';
      var st = C.bookingStatus(b, now);
      return '<li class="qitem ' + st.key + '"><a href="#/ticket/' + encodeURIComponent(b.id) + '">' +
        '<span class="q-no">' + b.queueNo + '</span>' +
        '<span class="q-main"><b>' + esc(p.name) + '</b><span>' + SVC[b.type].label + ' · ' + esc(C.whenText(b, now)) + '</span>' +
        '<span class="status ' + st.key + '">' + st.label + '</span></span></a></li>';
    }).join('') + '</ul>';
    FX.cascade($$('.qitem', appEl));
  }

  // ---------- แชร์ / ยกเลิก / แผ่นล่าง ----------
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

  function onShare(id) {
    var b = bookingById(id), p = b && providerById(b.providerId);
    if (!p) return;
    var text = C.shareText(b, p, SVC[b.type]);
    if (navigator.share) {
      navigator.share({ title: 'บัตรคิว ' + b.queueNo, text: text }).catch(function () { /* ผู้ใช้กดยกเลิก */ });
      return;
    }
    copyText(text).then(function () { toast('คัดลอกรายละเอียดแล้ว วางในแชตได้เลย'); },
      function () { toast('คัดลอกไม่สำเร็จ ลองกดค้างที่ข้อความแทน'); });
  }

  function openSheet(dlg) {
    if (typeof dlg.showModal !== 'function') { dlg.setAttribute('open', ''); return; }
    if (!dlg.open) { dlg.showModal(); FX.sheet(dlg); }
  }
  function closeSheet(dlg) {
    if (!dlg.open) return;
    FX.sheetOut(dlg).then(function () { dlg.close(); });
  }

  function ask(o) {
    $('#askTitle').textContent = o.title;
    $('#askText').textContent = o.text;
    $('[data-role="yes"]', askDlg).textContent = o.yes;
    $('[data-role="no"]', askDlg).textContent = o.no;
    if (typeof askDlg.showModal !== 'function') return Promise.resolve(window.confirm(o.title));
    return new Promise(function (resolve) {
      askDlg.returnValue = '';
      askDlg.addEventListener('close', function onClose() {
        askDlg.removeEventListener('close', onClose);
        resolve(askDlg.returnValue === 'yes');
      });
      openSheet(askDlg);
    });
  }

  function onCancel(id) {
    var b = bookingById(id);
    if (!b) return;
    ask({
      title: 'ยกเลิกคิว ' + b.queueNo + '?',
      text: 'ถ้าเคยส่งรายละเอียดให้ร้านไปแล้ว อย่าลืมแจ้งร้านด้วยนะ',
      yes: 'ยกเลิกคิว', no: 'ไม่ยกเลิก'
    }).then(function (yes) {
      if (!yes) return;
      b.status = 'cancelled';
      b.cancelledAt = Date.now();
      save('bookings', state.bookings);
      renderTicket({ id: b.id });
      updateCount();
      FX.stamp($('.stamp', appEl));
      toast('ยกเลิกคิว ' + b.queueNo + ' แล้ว');
    });
  }

  // ---------- เหตุการณ์ ----------
  doc.addEventListener('click', function (e) {
    var back = e.target.closest('[data-back]');
    if (back && stack.length > 1 && stack[stack.length - 2] === back.getAttribute('href')) {
      e.preventDefault();
      history.back();
      return;
    }
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var action = el.getAttribute('data-action');
    if (action === 'sos') openSheet(sosDlg);
    else if (action === 'close') closeSheet(el.closest('dialog'));
    else if (action === 'gps') onGps(el);
    else if (action === 'share') onShare(el.getAttribute('data-id'));
    else if (action === 'cancel') onCancel(el.getAttribute('data-id'));
    else if (action === 'hero') FX.heroReplay();
    else if (action === 'loc-edit') {
      var pick = $('.loc-pick', el.closest('.loc'));
      pick.hidden = !pick.hidden;
      el.setAttribute('aria-expanded', String(!pick.hidden));
      if (!pick.hidden) FX.reveal(pick);
    }
  });

  doc.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('select[data-role="district"]')) { onDistrict(t); return; }
    var form = t.closest('form.book');
    if (form && t.name) onFormChange(form, t);
  });

  doc.addEventListener('input', function (e) {
    var t = e.target, form = t.closest && t.closest('form.book');
    if (form && t.getAttribute('aria-invalid') === 'true') clearError(form, t.name);
  });

  doc.addEventListener('submit', function (e) {
    var form = e.target.closest('form.book');
    if (!form) return;
    e.preventDefault();
    onSubmit(form);
  });

  [sosDlg, askDlg].forEach(function (dlg) {
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeSheet(dlg); });
  });

  window.addEventListener('hashchange', render);
  render();

  // ทำงานออฟไลน์ได้หลังเปิดครั้งแรก (เฉพาะตอนเปิดผ่าน http/https เช่น GitHub Pages)
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* ไม่มีก็ใช้งานได้ปกติ */ });
    });
  }
})();
