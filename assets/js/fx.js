/*
 * แอนิเมชันทั้งหมดของเว็บ ใช้ anime.js v4 (window.anime)
 * - ถ้าโหลด anime.js ไม่ได้ หรือผู้ใช้ตั้งค่า "ลดการเคลื่อนไหว" ทุกฟังก์ชันจะข้ามไปเฉย ๆ เว็บยังใช้ได้ครบ
 * - แอนิเมชันเล่นครั้งเดียวแล้วหยุด ไม่วนตลอดเวลา เพื่อประหยัดแบตมือถือของคนที่รถเสียอยู่
 */
(function (root) {
  'use strict';

  var A = root.anime;
  var doc = root.document;
  var reduce = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var hero = null, heroSvg = null;

  if (!A) doc.documentElement.classList.add('no-anim');

  function on() { return !!A && !reduce.matches; }
  function nodes(x) {
    if (!x) return [];
    return x.length != null ? Array.prototype.slice.call(x) : [x];
  }

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

    // รายการค่อย ๆ ไหลขึ้นทีละแถว
    cascade: function (list, opts) {
      list = nodes(list);
      if (!on() || !list.length) return;
      opts = opts || {};
      A.utils.set(list, { opacity: 0, y: opts.y == null ? 16 : opts.y });
      A.animate(list, {
        opacity: 1, y: 0, duration: opts.duration || 460, ease: 'outCubic',
        delay: A.stagger(opts.step || 55, { start: opts.start || 0 })
      });
    },

    // ตอนเปิดหน้า: ขั้นตอนความปลอดภัย แล้วตามด้วยเบอร์ชุดแรก (เฉพาะที่เห็นบนจอ ไม่ต้องขยับทั้งหน้า)
    intro: function (root) {
      if (!on()) return;
      FX.cascade(root.querySelectorAll('.steps li'), { start: 250, step: 90, y: 10 });
      FX.cascade(Array.prototype.slice.call(root.querySelectorAll('.sec-head, .item'), 0, 10), { start: 450, step: 45, y: 14 });
    },

    hero: function (svg) {
      if (!on() || !svg) return;
      heroSvg = svg;
      hero = buildHero(svg);
    },
    heroReplay: function () {
      if (!on() || !heroSvg) return;
      if (hero) hero.revert();
      hero = buildHero(heroSvg);
    },

    // แตะโทร: หูโทรศัพท์สั่นเหมือนกำลังเรียกสาย พร้อมคลื่นวงกลมกระจายออก
    ring: function (call) {
      if (!on() || !call) return;
      A.animate(call.querySelector('.ic'), { rotate: [0, -18, 16, -14, 12, -8, 0], duration: 650, ease: 'inOutSine' });
      A.animate(call.querySelectorAll('.wave'), { scale: [1, 2.3], opacity: [0.55, 0], duration: 700, delay: A.stagger(160), ease: 'outQuad' });
    },

    // กดปุ่มหมวดแล้วไอคอนหมวดเด้งบอกว่ามาถึงแล้ว
    flash: function (el) {
      if (!on() || !el) return;
      A.animate(el, { scale: [1, 1.28, 1], rotate: [0, -10, 0], duration: 520, ease: 'outQuad' });
    }
  };

  root.FX = FX;
})(this);
