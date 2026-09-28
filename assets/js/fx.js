/*
 * แอนิเมชันทั้งหมดของเว็บ ใช้ anime.js v4 (window.anime)
 * - ถ้าโหลด anime.js ไม่ได้ หรือผู้ใช้ตั้งค่า "ลดการเคลื่อนไหว" ทุกฟังก์ชันจะข้ามไปเฉย ๆ แอปยังใช้ได้ครบ
 * - แอนิเมชันเล่นครั้งเดียวแล้วหยุด ไม่วนตลอดเวลา เพื่อประหยัดแบตมือถือของคนที่รถเสียอยู่
 */
(function (root) {
  'use strict';

  var A = root.anime;
  var doc = root.document;
  var reduce = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var live = [];
  var hero = null, heroSvg = null;

  if (!A) doc.documentElement.classList.add('no-anim');

  function on() { return !!A && !reduce.matches; }
  function keep(a) { live.push(a); return a; }
  function nodes(x) {
    if (!x) return [];
    return x.length != null ? Array.prototype.slice.call(x) : [x];
  }
  function resolved() { return Promise.resolve(); }

  // ---------- ฉากหน้าแรก: รถสไลด์ถอยมาเทียบ เอียงกระบะ กว้านรถที่เสียขึ้น แล้วขึ้นเครื่องหมายถูก ----------
  function buildHero(svg) {
    var q = function (s) { return svg.querySelector(s); };
    var qa = function (s) { return svg.querySelectorAll(s); };
    var tilt = -9.1;                  // องศาที่กระบะเอียงลงแตะพื้น (หมุนรอบจุด 250,142)
    var onBed = { x: 118, y: -26 };   // รถที่เสียต้องเลื่อนเท่านี้ถึงจะอยู่บนกระบะตอนแบน
    var r = tilt * Math.PI / 180;
    // ตำแหน่งรถบนกระบะตอนที่กระบะยังเอียงอยู่ = หมุนเวกเตอร์ onBed ด้วยมุมเดียวกัน
    var up = { x: onBed.x * Math.cos(r) - onBed.y * Math.sin(r), y: onBed.x * Math.sin(r) + onBed.y * Math.cos(r) };
    var cable = A.svg.createDrawable(q('.h-cable'));

    return A.createTimeline({ defaults: { ease: 'inOutSine' } })
      .add(qa('.h-hz'), { opacity: [1, 0.15], duration: 420, loop: 7, alternate: true, ease: 'inOutExpo' }, 0)
      .add(qa('.h-smoke circle'), { opacity: [0.55, 0], scale: [0.6, 1.9], y: [0, -16], duration: 1600, delay: A.stagger(500), ease: 'outSine' }, 0)
      .add(q('.h-beacon'), { opacity: [1, 0.25], duration: 280, loop: 15, alternate: true }, 0)
      .add(q('.h-truck'), { x: [240, 0], duration: 1700, ease: 'outQuad' }, 200)
      .add(qa('.h-truck .wheel'), { rotate: [0, -1375], duration: 1700, ease: 'outQuad' }, 200)
      .add(q('.h-truck'), { y: [0, 1.6, 0], duration: 380 }, 1880)
      .add(q('.h-bed'), { rotate: [0, tilt], duration: 750 }, 2200)
      .add(q('.h-cable'), { opacity: [0, 1], duration: 150 }, 2950)
      .add(cable, { draw: ['0 0', '0 1'], duration: 450, ease: 'outQuad' }, 2950)
      .add(q('.h-car'), { x: [0, up.x], y: [0, up.y], rotate: [0, tilt], duration: 1400, ease: 'inOutQuad' }, 3450)
      .add(qa('.h-car .wheel'), { rotate: [0, 420], duration: 1400, ease: 'inOutQuad' }, 3450)
      .add(cable, { draw: ['0 1', '0 0.08'], duration: 1400, ease: 'inOutQuad' }, 3450)
      .add(q('.h-cable'), { opacity: [1, 0], duration: 250 }, 4700)
      .add(qa('.h-hz'), { opacity: [1, 0], duration: 300 }, 4700)
      .add(q('.h-bed'), { rotate: [tilt, 0], duration: 900 }, 4950)
      .add(q('.h-car'), { x: [up.x, onBed.x], y: [up.y, onBed.y], rotate: [tilt, 0], duration: 900 }, 4950)
      .add(q('.h-badge'), { opacity: [0, 1], scale: [0, 1], duration: 650, ease: 'outBack(2.2)' }, 5850);
  }

  var FX = {
    enabled: on,

    // หยุดแอนิเมชันของหน้าก่อนหน้า (กระโดดไปท่าสุดท้ายทันที)
    stop: function () {
      live.forEach(function (a) { try { a.complete(); } catch (e) { /* ข้าม */ } });
      live = [];
    },

    view: function (el) {
      if (!on()) return;
      keep(A.animate(el, {
        opacity: [0, 1], y: [10, 0], duration: 340, ease: 'outCubic',
        onComplete: function () { el.style.transform = ''; el.style.opacity = ''; }
      }));
    },

    // การ์ดค่อย ๆ ไหลขึ้นทีละใบ
    cascade: function (list, opts) {
      list = nodes(list);
      if (!on() || !list.length) return;
      opts = opts || {};
      A.utils.set(list, { opacity: 0, y: opts.y == null ? 16 : opts.y });
      keep(A.animate(list, {
        opacity: 1, y: 0, duration: opts.duration || 460, ease: 'outCubic',
        delay: A.stagger(opts.step || 55, { start: opts.start || 60 })
      }));
    },

    homeIn: function (home) {
      if (!on()) return;
      FX.cascade(home.querySelectorAll('.steps li'), { start: 250, step: 90, y: 10 });
      FX.cascade(home.querySelectorAll('.service, .helper, .sos-card'), { start: 420, step: 80 });
    },

    hero: function (svg) {
      if (!on() || !svg) return;
      heroSvg = svg;
      hero = buildHero(svg);
    },
    heroFinish: function () {
      if (hero && !hero.completed) hero.complete();
    },
    heroReplay: function () {
      if (!on() || !heroSvg) return;
      if (hero) hero.revert();
      hero = buildHero(heroSvg);
    },

    // วงเรดาร์รอบหมุดตอนกำลังหาตำแหน่ง GPS — คืนฟังก์ชันไว้หยุด
    radar: function (host) {
      if (!on() || !host) return function () {};
      var rings = host.querySelectorAll('.ring');
      var a = A.animate(rings, { scale: [0.7, 2.3], opacity: [0.8, 0], duration: 1300, delay: A.stagger(420), loop: true, ease: 'outSine' });
      return function () { a.cancel(); A.utils.set(rings, { opacity: 0 }); };
    },

    pinDrop: function (el) {
      if (!on() || !el) return;
      A.animate(el, { y: [-18, 0], duration: 750, ease: 'outBounce' });
    },

    shake: function (el) {
      if (!on() || !el) return;
      A.animate(el, { x: [0, -9, 8, -6, 4, -2, 0], duration: 460, ease: 'inOutSine' });
    },

    pop: function (el) {
      if (!on() || !el) return;
      A.animate(el, { scale: [1, 1.14, 1], duration: 320, ease: 'outQuad' });
    },

    reveal: function (el) {
      if (!on() || !el) return;
      A.animate(el, { opacity: [0, 1], y: [-6, 0], duration: 260, ease: 'outCubic' });
    },

    // ปุ่มยืนยัน: รถสไลด์คันเล็กวิ่งผ่านปุ่มก่อนไปหน้าบัตรคิว
    drive: function (btn) {
      if (!on()) return resolved();
      return new Promise(function (resolve) {
        var truck = btn.querySelector('.cta-truck');
        var finished = false;
        var finish = function () { if (!finished) { finished = true; resolve(); } };
        btn.classList.add('is-driving');
        A.animate(truck, { x: [-52, btn.clientWidth + 8], duration: 950, ease: 'inOutQuad', onComplete: finish });
        setTimeout(finish, 1600); // กันพลาด เช่น ผู้ใช้สลับแอประหว่างเล่น
      });
    },

    // บัตรคิวค่อย ๆ ออกมาจากช่องเครื่องกดบัตรคิว + เลขคิววิ่ง + เส้นทางรถวิ่งมาหาคุณ
    ticket: function (view, opts) {
      if (!on()) return;
      var tl = A.createTimeline({ defaults: { ease: 'outCubic' } });
      var t = 0;
      if (opts && opts.fresh) {
        var check = view.querySelector('.done-check');
        if (check) {
          var ring = check.querySelector('circle');
          var tick = A.svg.createDrawable(check.querySelector('path'));
          A.utils.set(ring, { scale: 0 });
          A.utils.set(tick, { draw: '0 0' });
          tl.add(ring, { scale: [0, 1], duration: 450, ease: 'outBack(2)' }, 0)
            .add(tick, { draw: ['0 0', '0 1'], duration: 420, ease: 'inOutQuad' }, 260);
        }
        var ticket = view.querySelector('.ticket');
        A.utils.set(ticket, { y: '-104%' });
        tl.add(ticket, { y: ['-104%', '0%'], duration: 1000, ease: 'outQuart' }, 350);
        var no = view.querySelector('.t-no');
        var m = /^([A-Z])-(\d+)$/.exec(no.textContent);
        if (m) {
          var counter = { v: 0 };
          tl.add(counter, {
            v: +m[2], duration: 800, ease: 'outCubic',
            onUpdate: function () { no.textContent = m[1] + '-' + ('00' + Math.round(counter.v)).slice(-3); }
          }, 700);
        }
        t = 1350;
      }
      var map = view.querySelector('.route-map');
      if (map) {
        var drawn = A.svg.createDrawable(map.querySelector('.route-path'));
        var you = map.querySelector('.route-you');
        var truck = map.querySelector('.route-truck');
        A.utils.set(drawn, { draw: '0 0' });
        A.utils.set(you, { scale: 0 });
        tl.add(drawn, { draw: ['0 0', '0 1'], duration: 1200, ease: 'inOutSine' }, t)
          .add(you, { scale: [0, 1], duration: 600, ease: 'outBack(2.5)' }, t + 900)
          .add(truck, { opacity: [0, 1], duration: 200 }, t + 1150)
          .add(truck, Object.assign({ duration: 2600, ease: 'inOutSine' }, A.svg.createMotionPath(map.querySelector('.route-base'))), t + 1150)
          .add(map.querySelector('.route-ring'), { scale: [1, 2.6], opacity: [0.7, 0], duration: 1000, loop: 2, ease: 'outSine' }, t + 3600);
      }
      keep(tl);
    },

    stamp: function (el) {
      if (!on() || !el) return;
      A.animate(el, { scale: [2.4, 1], opacity: [0, 1], rotate: [-28, -12], duration: 460, ease: 'outBack(1.4)' });
    },

    sheet: function (dlg) {
      if (!on()) return;
      A.animate(dlg, { y: ['100%', '0%'], duration: 380, ease: 'outCubic' });
      FX.cascade(dlg.querySelectorAll('.hotline'), { start: 140, step: 45, y: 10, duration: 360 });
    },
    sheetOut: function (dlg) {
      if (!on()) return resolved();
      return new Promise(function (resolve) {
        A.animate(dlg, {
          y: ['0%', '100%'], duration: 230, ease: 'inCubic',
          onComplete: function () { dlg.style.transform = ''; resolve(); }
        });
      });
    }
  };

  root.FX = FX;
})(this);
