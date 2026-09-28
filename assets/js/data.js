/*
 * รายการเบอร์โทร — แก้ไขที่ไฟล์นี้ไฟล์เดียว (ไม่ต้อง build)
 *
 * checked  : วันที่ตรวจสอบเบอร์ล่าสุด (แสดงท้ายหน้า)
 * sections : หมวดเรียงตามลำดับที่แสดง (หมวดแรกควรเป็นฉุกเฉิน)
 *   id, title, short (ชื่อบนปุ่มหมวด), sub (คำอธิบาย), icon (ไอคอนใน index.html), tone: 'red' = สีฉุกเฉิน
 *   note  : ข้อความเตือนใต้หมวด (ถ้ามี)
 *   near  : หมวดที่ขึ้นกับพื้นที่ ('tow' | 'shop' = ชนิดใน places) เมื่อรู้ตำแหน่ง หมวดนี้จะขึ้นก่อน
 *           แสดงเจ้าที่ใกล้สุดจาก places ตามด้วย items (ติดป้าย wideTag) ใช้ชื่อ nearTitle และข้อความ nearNote
 *   items : { num: เบอร์ตามที่ให้กด, name, desc (ไม่เกิน 60 ตัวอักษร), tags: คำค้นเพิ่มเติม, src: หน้าเว็บทางการที่ยืนยันเบอร์ }
 *
 * ทุกเบอร์ต้องมีแหล่งที่มา (src) จากเว็บไซต์ทางการของหน่วยงาน/บริษัทนั้น ๆ
 * ห้ามใส่เบอร์ที่ไม่ได้ตรวจสอบ เพราะคนที่รถเสียจะกดโทรทันที
 *
 * places    : ร้านสาขาและรถสไลด์ประจำพื้นที่ ใช้ทำรายการ "ใกล้คุณ" (แตะโทรได้ในหน้าเว็บเลย) หลังรู้ตำแหน่ง
 *             { kind: 'tow' รถสไลด์/รถยก | 'shop' อู่/ร้านยาง/แบต, name, district (1 ใน 50 เขต),
 *               area (ถนน/จุดสังเกต), num, hours, src }  ใส่ lat/lng ได้ถ้ารู้พิกัดจริง ไม่งั้นใช้จุดกึ่งกลางเขต
 *             ใช้ในหมวดที่มี near ตรงกับ kind (รถสไลด์ทั่วกรุงเทพฯ และเบอร์กลางของร้าน ยังอยู่ท้ายหมวดเสมอ)
 * districts : 50 เขตของกรุงเทพฯ [ชื่อเขต, lat, lng] (จุดกึ่งกลางโดยประมาณ) ใช้บอกว่า GPS อยู่แถวเขตไหน
 *             และให้เลือกเขตเองเมื่อไม่เปิด GPS
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RSB_DATA = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    checked: '2026-09-28',

    places: [
      // ---------- รถสไลด์ / รถยก ที่ตั้งอยู่ในกรุงเทพฯ ----------
      { kind: 'tow', name: 'PCW รถยก รถสไลด์', district: 'บางบอน', area: 'บ.พีซีดับเบิ้ลยู โลจิสติกส์ · 24 ชม.',
        num: '062-962-6393', src: 'https://pcwlogistic.com/' },
      { kind: 'tow', name: 'ลุยปทุมวัน รถยก รถสไลด์', district: 'ปทุมวัน', area: 'ซ.จุฬา 5 ถ.พระราม 4 · 24 ชม.',
        num: '085-569-9992', src: 'https://www.xn--12c5beii1bdg6b9f6c.com/' },
      { kind: 'tow', name: 'AKA SLIDE ON รถยก รถสไลด์', district: 'คันนายาว', area: 'ถ.รามอินทรา · 24 ชม.',
        num: '092-539-9655', src: 'https://www.akaslideon.com/contact/' },
      { kind: 'tow', name: 'เจ&โจ้ สไลด์ออน รถยก รถสไลด์', district: 'บางแค', area: 'ถ.เพชรเกษม · 24 ชม.',
        num: '080-049-7782', src: 'https://www.xn--12c6afdibii6c6aekd3ah5eunxhyf.com/' },
      { kind: 'tow', name: 'อู่ช่างเหน่งสไลด์ออน รถยก รถสไลด์', district: 'บางนา', area: 'ซ.ลาซาล 59 ถ.สุขุมวิท 105 · 24 ชม.',
        num: '061-712-5864', src: 'https://www.xn--12cay3cs4cfu3iwhsc.com/' },
      { kind: 'tow', name: 'เจดีเอ็ม ทรานสปอร์ต (JDM) รถสไลด์', district: 'คลองเตย', area: 'ถ.สุขุมวิท แขวงพระโขนง · 24 ชม.',
        num: '097-830-8888', src: 'https://www.jdmbangkok.com/' },
      { kind: 'tow', name: 'ทองสไลด์ออน รถยก รถสไลด์', district: 'ลาดกระบัง', area: 'ซอย 40/1 แขวงลาดกระบัง · 24 ชม.',
        num: '094-325-6037', src: 'https://xn--12cas4cajb9a4didewb6e4esam25arf.com/' },
      { kind: 'tow', name: 'USL SLIDEON รถยก รถสไลด์', district: 'สายไหม', area: 'หมู่บ้านมัณฑนา แขวงออเงิน · 24 ชม.',
        num: '065-650-5115', src: 'http://usl-slideon.com/%E0%B8%95%E0%B8%B4%E0%B8%94%E0%B8%95%E0%B9%88%E0%B8%AD%E0%B9%80%E0%B8%A3%E0%B8%B2.html' },
      { kind: 'tow', name: 'HybridCar อู่ไฮบริด รถยก รถสไลด์', district: 'สายไหม', area: 'ซ.วัชรพล 4 แขวงคลองถนน · 24 ชม.',
        num: '093-995-2465', src: 'https://www.hybridcar.co.th/%E0%B8%9A%E0%B8%A3%E0%B8%B4%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%A3%E0%B8%96%E0%B8%A2%E0%B8%81%E0%B8%A3%E0%B8%96%E0%B8%AA%E0%B9%84%E0%B8%A5%E0%B8%94%E0%B9%8C%E0%B8%AD%E0%B8%AD%E0%B8%9924%E0%B8%8A%E0%B8%A1/' },

      // ---------- อู่ / ร้านยาง / แบตเตอรี่ (สาขาร้านเครือข่าย) ----------
      { kind: 'shop', name: 'บี-ควิก ลาซาล อเวนิว', district: 'บางนา', area: 'ถ.ลาซาล-แบริ่ง',
        num: '02-117-0785', src: 'https://www.b-quik.com/en/branch/detail/158' },
      { kind: 'shop', name: 'บี-ควิก พัฒนาการ', district: 'สวนหลวง', area: 'ถ.พัฒนาการ',
        num: '02-320-1353', src: 'https://www.b-quik.com/th/branch/detail/19' },
      { kind: 'shop', name: 'บี-ควิก คาลเท็กซ์ สนามเป้า', district: 'พญาไท', area: 'ถ.พหลโยธิน', hours: '08:00–21:00 น.',
        num: '02-279-8552', src: 'https://www.b-quik.com/th/branch/detail/93' },
      { kind: 'shop', name: 'บี-ควิก ถนนรัชดาภิเษก', district: 'ห้วยขวาง', area: 'ถ.รัชดาภิเษก', hours: '08:00–21:00 น.',
        num: '02-005-2773', src: 'https://www.b-quik.com/th/news/grand-opening-day-b-quik-ratchadapisek-road' },
      { kind: 'shop', name: 'ออโต้แบคส์ จรัญสนิทวงศ์', district: 'บางกอกใหญ่', area: 'ถ.จรัญสนิทวงศ์ แขวงวัดท่าพระ',
        num: '084-330-1144', src: 'https://www.autobacs.co.th/branch' },
      { kind: 'shop', name: 'ออโต้แบคส์ แสมดำ', district: 'บางขุนเทียน', area: 'แขวงแสมดำ',
        num: '02-079-1184', src: 'https://www.autobacs.co.th/branch' },
      { kind: 'shop', name: 'ออโต้แบคส์ กาญจนาภิเษก 18', district: 'บางแค', area: 'ถ.กาญจนาภิเษก',
        num: '061-415-8667', src: 'https://www.autobacs.co.th/branch' },
      { kind: 'shop', name: 'ฟิต ออโต้ กรุงเทพกรีฑา (ตัดใหม่)', district: 'สะพานสูง', area: 'ถ.กรุงเทพกรีฑา (ตัดใหม่)',
        num: '061-420-0015', src: 'https://www.pttfitauto.com/th/other/news/166262853114155' },
      { kind: 'shop', name: 'ฟิต ออโต้ ราชพฤกษ์-สวนผัก', district: 'ตลิ่งชัน', area: 'ถ.ราชพฤกษ์ / ถ.สวนผัก',
        num: '02-408-2821', src: 'https://www.pttfitauto.com/th/other/news/168361370714451' },
      { kind: 'shop', name: 'ฟิต ออโต้ บางบอน', district: 'บางบอน', area: 'ถ.กาญจนาภิเษก',
        num: '02-012-4150', src: 'https://www.pttfitauto.com/th/other/news/165173957513943' },
      { kind: 'shop', name: 'ค็อกพิท แม็คโคร สาทร', district: 'สาทร', area: 'ในแม็คโคร สาทร ถ.นราธิวาสราชนครินทร์', hours: '08:00–20:00 น.',
        num: '02-676-2126', src: 'https://cockpit.co.th/post/244/%E0%B9%80%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B8%A2%E0%B8%A7%E0%B8%AA%E0%B8%B2%E0%B8%97%E0%B8%A3-%E0%B8%95%E0%B8%B0%E0%B8%A5%E0%B8%AD%E0%B8%99%E0%B9%80%E0%B8%8A%E0%B9%87%E0%B8%84%E0%B8%AD%E0%B8%B4%E0%B8%99-%E0%B8%A2%E0%B9%88%E0%B8%B2%E0%B8%99%E0%B8%8A%E0%B8%B4%E0%B8%84-%E0%B9%86-%E0%B9%83%E0%B8%88%E0%B8%81%E0%B8%A5%E0%B8%B2%E0%B8%87%E0%B8%81%E0%B8%A3%E0%B8%B8%E0%B8%87%E0%B9%80%E0%B8%97%E0%B8%9E%E0%B8%AF' },
      { kind: 'shop', name: 'ค็อกพิท นวมินทร์', district: 'บึงกุ่ม', area: 'ถ.นวมินทร์ แขวงคลองกุ่ม', hours: '08:00–20:00 น.',
        num: '090-980-7892', src: 'https://www.cockpit.co.th/post/190/%E0%B8%9E%E0%B8%B2%E0%B8%AA%E0%B9%88%E0%B8%AD%E0%B8%87%E0%B8%A2%E0%B9%88%E0%B8%B2%E0%B8%99%E0%B9%80%E0%B8%94%E0%B9%87%E0%B8%94-%E0%B9%80%E0%B8%81%E0%B8%A9%E0%B8%95%E0%B8%A3%E0%B8%99%E0%B8%A7%E0%B8%A1%E0%B8%B4%E0%B8%99%E0%B8%97%E0%B8%A3%E0%B9%8C-%E0%B8%8A%E0%B8%B4%E0%B8%A5%E0%B9%84%E0%B8%94%E0%B9%89%E0%B8%95%E0%B8%A5%E0%B8%AD%E0%B8%94%E0%B8%97%E0%B8%B1%E0%B9%89%E0%B8%87%E0%B8%A7%E0%B8%B1%E0%B8%99%E0%B8%95%E0%B8%B1%E0%B9%89%E0%B8%87%E0%B9%81%E0%B8%95%E0%B9%88%E0%B9%80%E0%B8%8A%E0%B9%89%E0%B8%B2%E0%B8%A2%E0%B8%B1%E0%B8%99%E0%B8%84%E0%B9%88%E0%B8%B3' },
      { kind: 'shop', name: 'ค็อกพิท แม็คโคร บางบอน', district: 'บางบอน', area: 'ในแม็คโคร บางบอน ถ.กาญจนาภิเษก', hours: '08:00–20:00 น.',
        num: '02-894-3864', src: 'https://cockpit.co.th/post/702/%E0%B9%80%E0%B8%9B%E0%B8%B4%E0%B8%94%E0%B8%A7%E0%B8%B2%E0%B8%A3%E0%B9%8C%E0%B8%9B%E0%B8%84%E0%B8%B2%E0%B9%80%E0%B8%9F%E0%B9%88-%E0%B8%A2%E0%B9%88%E0%B8%B2%E0%B8%99%E0%B8%9A%E0%B8%B2%E0%B8%87%E0%B8%9A%E0%B8%AD%E0%B8%99-%E0%B8%9E%E0%B8%B4%E0%B8%81%E0%B8%B1%E0%B8%94%E0%B9%80%E0%B8%94%E0%B9%87%E0%B8%94%E0%B8%95%E0%B9%89%E0%B8%AD%E0%B8%87%E0%B8%95%E0%B8%B2%E0%B8%A1%E0%B9%84%E0%B8%9B%E0%B9%80%E0%B8%8A%E0%B9%87%E0%B8%84%E0%B8%AD%E0%B8%B4%E0%B8%99' },
      { kind: 'shop', name: 'ค็อกพิท บางแค', district: 'บางแค', area: 'ปั๊มเชลล์ ถ.เพชรเกษม ตรงข้ามเดอะมอลล์ บางแค', hours: '08:00–20:00 น.',
        num: '094-216-6726', src: 'https://cockpit.co.th/post/2182/COCKPIT-Bang-Khae-is-Ready-to-Serve-Customers-with-Incredible-Offers-Celebrating-Its-New-Branch-Opening' },
      { kind: 'shop', name: 'ค็อกพิท จรัญสนิทวงศ์ 37', district: 'บางกอกน้อย', area: 'ในแม็คโคร จรัญสนิทวงศ์ แขวงบางขุนศรี', hours: '08:00–20:00 น.',
        num: '090-980-7910', src: 'https://www.cockpit.co.th/post/374/%E0%B8%88%E0%B8%A3%E0%B8%B1%E0%B8%8D%E0%B8%AA%E0%B8%99%E0%B8%B4%E0%B8%97%E0%B8%A7%E0%B8%87%E0%B8%A8%E0%B9%8C-%E0%B8%95%E0%B8%B0%E0%B8%A5%E0%B8%B8%E0%B8%A2%E0%B8%A2%E0%B9%88%E0%B8%B2%E0%B8%99%E0%B8%AD%E0%B8%A3%E0%B9%88%E0%B8%AD%E0%B8%A2-%E0%B8%AA%E0%B8%A7%E0%B8%A3%E0%B8%A3%E0%B8%84%E0%B9%8C%E0%B8%82%E0%B8%AD%E0%B8%87%E0%B8%84%E0%B8%99%E0%B8%8A%E0%B8%AD%E0%B8%9A%E0%B8%81%E0%B8%B4%E0%B8%99-%E0%B8%9F%E0%B8%B4%E0%B8%99%E0%B8%82%E0%B8%AD%E0%B8%87%E0%B8%AD%E0%B8%A3%E0%B9%88%E0%B8%AD%E0%B8%A2%E0%B8%9D%E0%B8%B1%E0%B9%88%E0%B8%87%E0%B8%98%E0%B8%99%E0%B8%9A%E0%B8%B8%E0%B8%A3%E0%B8%B5' },

      // ---------- ร้านแบตเตอรี่ / ยาง ที่ไปเปลี่ยนให้ถึงที่ และร้านยางเครือข่าย ----------
      { kind: 'shop', name: 'ไทร์พลัส ศรีนครินทร์ ออโต้พลัส', district: 'ประเวศ', area: 'ถ.ศรีนครินทร์ แขวงหนองบอน',
        num: '02-748-0727', src: 'https://www.michelin.co.th/auto/dealer-locator/%E0%B8%81%E0%B8%A3%E0%B8%B8%E0%B8%87%E0%B9%80%E0%B8%97%E0%B8%9E%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%99%E0%B8%84%E0%B8%A3/%E0%B9%84%E0%B8%97%E0%B8%A3-%E0%B8%9E%E0%B8%A5-%E0%B8%AA-%E0%B8%A8%E0%B8%A3%E0%B8%B5%E0%B8%99%E0%B8%84%E0%B8%A3%E0%B8%B4%E0%B8%99%E0%B8%97%E0%B8%A3-%E0%B8%AD%E0%B8%AD%E0%B9%82%E0%B8%95-%E0%B8%9E%E0%B8%A5-%E0%B8%AA-1225279066' },
      { kind: 'shop', name: 'แบตเตอรี่โปร ส่ง-เปลี่ยนแบตถึงที่', district: 'บางแค', area: 'ถ.กาญจนาภิเษก แขวงหลักสอง', hours: '08:00–18:00 น.',
        num: '080-246-8012', src: 'https://www.batteryprothailand.com/' },
      { kind: 'shop', name: 'OkBatteryShop เปลี่ยนแบตนอกสถานที่', district: 'ห้วยขวาง', area: 'ถ.รัชดาภิเษก · 24 ชม.',
        num: '088-447-6577', src: 'https://www.okbatteryshop.com/index.php/contact' },
      { kind: 'shop', name: 'บีบีแบตเตอรี่ ส่งเปลี่ยนแบตถึงที่', district: 'ลาดพร้าว', area: 'โชคชัย 4 ซอย 72', hours: 'เปิดทุกวัน',
        num: '087-908-4528', src: 'https://www.batterybbdelivery.com/contact.php' },

      // ---------- ฟิต ออโต้ ฝั่งเหนือ/ตะวันออก ----------
      { kind: 'shop', name: 'ฟิต ออโต้ สายไหม 56', district: 'สายไหม', area: 'โครงการ ICON 56 ย่านสายไหม 56',
        num: '02-149-1677', src: 'https://www.pttfitauto.com/th/other/news/170747239914612' },
      { kind: 'shop', name: 'ฟิต ออโต้ รามอินทรา กม.3', district: 'บางเขน', area: 'ถ.รามอินทรา กม.3',
        num: '02-551-4059', src: 'https://www.pttfitauto.com/th/other/news/170668258114609' },
      { kind: 'shop', name: 'ฟิต ออโต้ วิภาวดี 62', district: 'หลักสี่', area: 'ย่าน ซ.วิภาวดีรังสิต 62',
        num: '080-047-3863', src: 'https://www.pttfitauto.com/th/other/news/170202920914580' },
      { kind: 'shop', name: 'ฟิต ออโต้ ลาดพร้าว-วังหิน', district: 'ลาดพร้าว', area: 'ถ.ลาดพร้าว-วังหิน',
        num: '02-118-6231', src: 'https://www.pttfitauto.com/th/other/news/167929596814419' },
      { kind: 'shop', name: 'ฟิต ออโต้ เคหะร่มเกล้า', district: 'ลาดกระบัง', area: 'ย่านเคหะร่มเกล้า',
        num: '02-136-0967', src: 'https://www.pttfitauto.com/th/other/news/168671602914471' }
    ],

    districts: [
      ['พระนคร', 13.7563, 100.5018], ['ดุสิต', 13.7770, 100.5130], ['หนองจอก', 13.8556, 100.8624],
      ['บางรัก', 13.7300, 100.5240], ['บางเขน', 13.8730, 100.5960], ['บางกะปิ', 13.7657, 100.6479],
      ['ปทุมวัน', 13.7440, 100.5230], ['ป้อมปราบศัตรูพ่าย', 13.7580, 100.5130], ['พระโขนง', 13.7026, 100.6016],
      ['มีนบุรี', 13.8138, 100.7483], ['ลาดกระบัง', 13.7228, 100.7597], ['ยานนาวา', 13.6960, 100.5410],
      ['สัมพันธวงศ์', 13.7310, 100.5130], ['พญาไท', 13.7800, 100.5430], ['ธนบุรี', 13.7250, 100.4860],
      ['บางกอกใหญ่', 13.7230, 100.4760], ['ห้วยขวาง', 13.7766, 100.5790], ['คลองสาน', 13.7300, 100.5100],
      ['ตลิ่งชัน', 13.7770, 100.4570], ['บางกอกน้อย', 13.7700, 100.4680], ['บางขุนเทียน', 13.6608, 100.4358],
      ['ภาษีเจริญ', 13.7147, 100.4370], ['หนองแขม', 13.7050, 100.3490], ['ราษฎร์บูรณะ', 13.6820, 100.5050],
      ['บางพลัด', 13.7940, 100.5050], ['ดินแดง', 13.7700, 100.5530], ['บึงกุ่ม', 13.7850, 100.6690],
      ['สาทร', 13.7080, 100.5260], ['บางซื่อ', 13.8090, 100.5370], ['จตุจักร', 13.8280, 100.5600],
      ['บางคอแหลม', 13.6930, 100.5030], ['ประเวศ', 13.7170, 100.6940], ['คลองเตย', 13.7080, 100.5840],
      ['สวนหลวง', 13.7300, 100.6510], ['จอมทอง', 13.6780, 100.4840], ['ดอนเมือง', 13.9130, 100.5890],
      ['ราชเทวี', 13.7590, 100.5340], ['ลาดพร้าว', 13.8030, 100.6070], ['วัฒนา', 13.7420, 100.5860],
      ['บางแค', 13.6960, 100.4090], ['หลักสี่', 13.8870, 100.5790], ['สายไหม', 13.9210, 100.6450],
      ['คันนายาว', 13.8270, 100.6780], ['สะพานสูง', 13.7690, 100.6860], ['วังทองหลาง', 13.7880, 100.6090],
      ['คลองสามวา', 13.8600, 100.7040], ['บางนา', 13.6680, 100.6040], ['ทวีวัฒนา', 13.7730, 100.3510],
      ['ทุ่งครุ', 13.6400, 100.4960], ['บางบอน', 13.6600, 100.3850]
    ],


    sections: [
      {
        id: 'emergency', title: 'ฉุกเฉิน', short: 'ฉุกเฉิน', icon: 'i-alert', tone: 'red',
        sub: 'มีคนเจ็บ รถมีควันหรือไฟไหม้ หรือเกิดเหตุร้าย',
        items: [
          { num: '1669', name: 'เจ็บป่วยฉุกเฉิน / มีผู้บาดเจ็บ', desc: 'สถาบันการแพทย์ฉุกเฉินแห่งชาติ · 24 ชม.',
            tags: ['รถพยาบาล', 'อุบัติเหตุ', 'สพฉ', 'ambulance'],
            src: 'https://www.niems.go.th/1/News/Detail/7452?group=3' },
          { num: '191', name: 'เหตุด่วน เหตุร้าย', desc: 'ตำรวจ · 24 ชม.',
            tags: ['ตำรวจ', 'police', 'อุบัติเหตุ'],
            src: 'https://lamlukka.pathumthani.police.go.th/%E0%B9%80%E0%B8%AB%E0%B8%95%E0%B8%B8%E0%B8%94%E0%B9%88%E0%B8%A7%E0%B8%99-%E0%B9%80%E0%B8%AB%E0%B8%95%E0%B8%B8%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%A2-%E0%B9%82%E0%B8%97%E0%B8%A3-191-%E0%B9%84%E0%B8%94/' },
          { num: '199', name: 'รถมีควัน / ไฟไหม้', desc: 'แจ้งเหตุเพลิงไหม้ (ดับเพลิง)',
            tags: ['ดับเพลิง', 'ไฟไหม้', 'fire'],
            src: 'https://webportal.bangkok.go.th/healthcenter29/page/main/5540/%E0%B8%84%E0%B8%A7%E0%B8%B2%E0%B8%A1%E0%B8%A3%E0%B8%B9%E0%B9%89%E0%B9%80%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87%E0%B9%82%E0%B8%A3%E0%B8%84%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%A0%E0%B8%B1%E0%B8%A2%E0%B8%AD%E0%B8%B1%E0%B8%99%E0%B8%95%E0%B8%A3%E0%B8%B2%E0%B8%A2/0/info/500586/%E0%B8%A3%E0%B8%B9%E0%B9%89%E0%B8%97%E0%B8%B1%E0%B8%99%E0%B8%9B%E0%B9%89%E0%B8%AD%E0%B8%87%E0%B8%81%E0%B8%B1%E0%B8%99%E0%B9%80%E0%B8%9E%E0%B8%A5%E0%B8%B4%E0%B8%87%E0%B9%84%E0%B8%AB%E0%B8%A1%E0%B9%89-%E0%B9%80%E0%B8%81%E0%B8%B4%E0%B8%94%E0%B9%80%E0%B8%AB%E0%B8%95%E0%B8%B8%E0%B9%80%E0%B8%9E%E0%B8%A5%E0%B8%B4%E0%B8%87%E0%B9%84%E0%B8%AB%E0%B8%A1%E0%B9%89%E0%B9%82%E0%B8%97%E0%B8%A3-199' }
        ]
      },
      {
        id: 'road', title: 'รถเสียบนถนน', short: 'รถเสียบนถนน', icon: 'i-road',
        sub: 'ทางด่วน ทางหลวง และสถานีวิทยุที่ช่วยประสานความช่วยเหลือ',
        items: [
          { num: '1543', name: 'รถเสียบนทางด่วน', desc: 'การทางพิเศษแห่งประเทศไทย (EXAT) · 24 ชม.',
            tags: ['ทางพิเศษ', 'กทพ', 'exat', 'ยางแตก', 'น้ำมันหมด'],
            src: 'https://www.exat.co.th/กทพ-แนะนำผู้ใช้ทางพิเศ/' },
          { num: '1137', name: 'จส.100 ช่วยประสานเมื่อรถเสีย', desc: 'สถานีวิทยุ จส.100 · 24 ชม.',
            tags: ['js100', 'วิทยุ', 'จราจร'],
            src: 'https://www.js100.com/en/site/lost_found/view/50210' },
          { num: '1644', name: 'สวพ. FM91 แจ้งรถเสีย / อุบัติเหตุ', desc: 'สถานีวิทยุเพื่อความปลอดภัยและการจราจร · 24 ชม.',
            tags: ['fm91', 'วิทยุ', 'จราจร'],
            src: 'https://www.fm91bkk.com/newsarticle/36926' },
          { num: '1193', name: 'ตำรวจทางหลวง', desc: 'รถเสีย / อุบัติเหตุบนทางหลวงและมอเตอร์เวย์ · 24 ชม.',
            tags: ['ทางหลวง', 'มอเตอร์เวย์', 'highway'],
            src: 'http://www.highway.police.go.th/archives/383' },
          { num: '1197', name: 'สายด่วนจราจร', desc: 'ตำรวจ แจ้งข้อมูลการจราจร เช่น รถเสียขวางถนน',
            tags: ['ตำรวจจราจร', 'จราจร', 'traffic'],
            src: 'https://saranitet.police.go.th/%E0%B8%AA%E0%B8%B2%E0%B8%A2%E0%B8%94%E0%B9%88%E0%B8%A7%E0%B8%99%E0%B8%88%E0%B8%A3%E0%B8%B2%E0%B8%88%E0%B8%A3-1197/' }
        ]
      },
      {
        id: 'tow', title: 'รถสไลด์ / รถยก (เอกชน)', short: 'รถสไลด์', icon: 'i-truck',
        sub: 'บริการ 24 ชม. ครอบคลุมกรุงเทพฯ',
        near: 'tow', nearTitle: 'รถสไลด์ / รถยก ใกล้คุณ', wideTag: 'ทั่วกรุงเทพฯ',
        nearNote: 'ระยะทางคิดจากเขตที่รถสไลด์ตั้งอยู่ โทรถามก่อนว่ามาถึงคุณได้เร็วแค่ไหน',
        note: 'ราคาขึ้นกับระยะทาง สอบถามราคาก่อนเรียกรถ · รถเสียบนทางด่วนให้โทร 1543 ก่อน · ถ้ามีประกันรถ ลองโทรหาประกันก่อน อาจมีรถยกให้ตามเงื่อนไขกรมธรรม์',
        items: [
          { num: '092-996-8888', name: 'ซูโม่ รถสไลด์', desc: 'บริษัท ซูโม่ โรดไซด์ เซอร์วิส จำกัด · 24 ชม.',
            tags: ['sumo', 'รถยก', 'รถลาก'],
            src: 'https://sumoroadside.co.th/' },
          { num: '094-861-9595', name: '24 คาร์ฟิกซ์ (24CARFIX)', desc: 'รถยก / รถสไลด์ และช่างนอกสถานที่ · 24 ชม.',
            tags: ['24carfix', 'รถยก', 'รถลาก', 'แบตเตอรี่'],
            src: 'https://slidecar.24carfix.com/' }
        ]
      },
      {
        id: 'insurance', title: 'ประกันรถยนต์: แจ้งอุบัติเหตุ / ขอความช่วยเหลือ', short: 'ประกันรถ', icon: 'i-shield',
        sub: 'ดูชื่อบริษัทบนกรมธรรม์หรือบัตรประกันของคุณ',
        items: [
          { num: '1557', name: 'วิริยะประกันภัย', desc: 'แจ้งอุบัติเหตุ / เคลม ทั่วประเทศ · 24 ชม.',
            tags: ['viriyah'], src: 'https://www.viriyah.co.th/customer-service/claim-1/' },
          { num: '1736', name: 'ทิพยประกันภัย', desc: 'Call Center แจ้งอุบัติเหตุ / เคลม',
            tags: ['dhipaya'], src: 'https://www.dhipaya.co.th/insurance/insurance.asp?ID=575&idMenu=490' },
          { num: '1620', name: 'กรุงเทพประกันภัย', desc: 'แจ้งอุบัติเหตุ และขอรถยก · 24 ชม.',
            tags: ['bangkok insurance', 'bki'], src: 'https://www.bangkokinsurance.com/th/company/media/knowledge/153' },
          { num: '1484', name: 'เมืองไทยประกันภัย', desc: 'แจ้งอุบัติเหตุ / เหตุฉุกเฉิน · 24 ชม.',
            tags: ['muang thai'], src: 'https://www.muangthaiinsurance.com/th/contact-us' },
          { num: '02-308-9300', name: 'ธนชาตประกันภัย', desc: 'แจ้งอุบัติเหตุ กด 1',
            tags: ['thanachart', 'tni'], src: 'https://www.thanachartinsurance.co.th/tnifrontend/tnicontactus.aspx' },
          { num: '1758', name: 'ชับบ์สามัคคีประกันภัย', desc: 'แจ้งอุบัติเหตุรถยนต์ · 24 ชม. (รวมลูกค้าเดิม LMG)',
            tags: ['chubb', 'lmg', 'แอลเอ็มจี'], src: 'https://www.chubb.com/th-th/claims/motor-customer-claims-guidance/emergency-notification.html' },
          { num: '02-624-1111', name: 'กรุงไทยพานิชประกันภัย', desc: 'แจ้งอุบัติเหตุรถยนต์ กด 1 · 24 ชม.',
            tags: ['krungthai panich', 'kpi'], src: 'https://www.kpi.co.th/kpi/en/service/motor/' },
          { num: '1292', name: 'อลิอันซ์ อยุธยา ประกันภัย', desc: 'แจ้งอุบัติเหตุรถยนต์ ทั่วประเทศ · 24 ชม.',
            tags: ['allianz', 'ayudhya'], src: 'https://www.allianz.co.th/th_TH/claims/motor-claims.html' },
          { num: '02-257-8080', name: 'คุ้มภัยโตเกียวมารีนประกันภัย', desc: 'แจ้งอุบัติเหตุฉุกเฉิน · 24 ชม.',
            tags: ['tokio marine'], src: 'https://www.tokiomarine.com/th/th/non-life/get-in-touch.html' },
          { num: '1231', name: 'ประกันภัยไทยวิวัฒน์', desc: 'รับแจ้งเหตุ / อุบัติเหตุรถยนต์ · 24 ชม.',
            tags: ['thaivivat'], src: 'https://www.thaivivat.co.th/th/contact.php' },
          { num: '02-118-8111', name: 'แอกซ่าประกันภัย', desc: 'แจ้งเคลมประกันรถยนต์ · 24 ชม.',
            tags: ['axa'], src: 'https://www.axa.co.th/private-car-insurance-claim' },
          { num: '1259', name: 'เอ็ม เอส ไอ จี ประกันภัย', desc: 'แจ้งอุบัติเหตุรถยนต์ · 24 ชม.',
            tags: ['msig'], src: 'https://www.msig-thai.com/en/contact-us' },
          { num: '1748', name: 'นวกิจประกันภัย', desc: 'กด 2 ช่วยเหลือรถเสียฉุกเฉิน · กด 1 แจ้งอุบัติเหตุ · 24 ชม.',
            tags: ['navakij'], src: 'https://www.navakij.co.th/th/nki-services/claim-service' },
          { num: '1291', name: 'เทเวศประกันภัย', desc: 'แจ้งอุบัติเหตุ กด 1 · 24 ชม.',
            tags: ['deves'], src: 'https://www.deves.co.th/th/customer-service/claims/' }
        ]
      },
      {
        id: 'brand', title: 'ศูนย์ช่วยเหลือของยี่ห้อรถ', short: 'ยี่ห้อรถ', icon: 'i-car',
        sub: 'รถยังอยู่ในระยะรับประกัน มักขอรถยกหรือช่างมาหาได้',
        note: 'สิทธิ์บริการฟรีขึ้นกับเงื่อนไขของแต่ละยี่ห้อ เช่น อายุรถหรือระยะรับประกัน',
        items: [
          { num: '1486', name: 'โตโยต้า (Toyota)', desc: 'ศูนย์ข้อมูลลูกค้า ประสานช่วยเหลือรถเสียฉุกเฉิน 24 ชม.',
            tags: ['toyota'], src: 'https://www.toyota.co.th/contact' },
          { num: '02-118-0777', name: 'อีซูซุ (Isuzu)', desc: 'สายด่วนลูกค้าสัมพันธ์ จ.–ศ. 08:30–17:00 น.',
            tags: ['isuzu', 'd-max', 'mu-x', 'ดีแม็กซ์'], src: 'https://www.isuzu-tis.com/contact-us' },
          { num: '02-111-1234', name: 'ฮอนด้า (Honda)', desc: 'ช่วยเหลือฉุกเฉินนอกสถานที่ 24 ชม.',
            tags: ['honda'], src: 'https://www.honda.co.th/en/news/roadside_changing_phone_number' },
          { num: '02-614-3609', name: 'มิตซูบิชิ (Mitsubishi)', desc: 'ช่วยเหลือฉุกเฉินบนท้องถนน 24 ชม.',
            tags: ['mitsubishi', 'triton', 'ไทรทัน'], src: 'https://www.mitsubishi-motors.co.th/th/campaigns/mitsubishi-roadside-service' },
          { num: '1383', name: 'ฟอร์ด (Ford)', desc: 'Ford Call Center ขอความช่วยเหลือฉุกเฉิน 24 ชม.',
            tags: ['ford', 'ranger', 'everest', 'เรนเจอร์'], src: 'https://www.ford.co.th/about-ford/newsroom/2020/ford-4-digit-call-center/' },
          { num: '02-045-8888', name: 'บีวายดี (BYD)', desc: 'ศูนย์บริการลูกค้า BYD',
            tags: ['byd', 'ev', 'รถไฟฟ้า'], src: 'https://www.byd.com/en-th/contact-us' },
          { num: '1267', name: 'เอ็มจี (MG)', desc: 'MG Call Center ช่วยเหลือรถเสียฉุกเฉิน 24 ชม.',
            tags: ['mg', 'ev', 'รถไฟฟ้า'], src: 'https://www.mgcars.com/th/promotions/MG-Family-Care-Campaign-2025' },
          { num: '02-305-8432', name: 'นิสสัน (Nissan)', desc: 'ช่วยเหลือรถเสียฉุกเฉิน 24 ชม. (รถในระยะรับประกัน)',
            tags: ['nissan'], src: 'https://www.nissan.co.th/aftersales/owner-benefits/roadside-assistance.html' },
          { num: '1401-333-000', name: 'มาสด้า (Mazda)', desc: 'Roadside Assistance 24 ชม. (เบอร์สำหรับโทรจากมือถือ)',
            tags: ['mazda'], src: 'https://www.mazda.co.th/owners/mazda-activ-service/roadside-assistance/' },
          { num: '1800-600-900', name: 'ซูซูกิ (Suzuki)', desc: 'Call Center ช่วยเหลือฉุกเฉิน 24 ชม.',
            tags: ['suzuki'], src: 'https://www.suzuki.co.th/services/roadside-assistance' },
          { num: '02-668-8888', name: 'จีดับเบิลยูเอ็ม (GWM)', desc: 'ช่วยเหลือฉุกเฉินบนท้องถนน 24 ชม. กด 1',
            tags: ['gwm', 'haval', 'ora', 'tank', 'ฮาวาล', 'รถไฟฟ้า'], src: 'https://www.gwm.co.th/th/services' },
          { num: '1250', name: 'เมอร์เซเดส-เบนซ์ (Mercedes-Benz)', desc: 'ช่วยเหลือเมื่อรถเสีย 24 ชม.',
            tags: ['mercedes', 'benz', 'เบนซ์'], src: 'https://www.mercedes-benz.co.th/th/passengercars/services/breakdown.html' },
          { num: '02-544-0366', name: 'วอลโว่ (Volvo)', desc: 'Volvo Assistance 24 ชม.',
            tags: ['volvo'], src: 'https://www.volvocars.com/en-th/support/topic/a9c6220e5df96a66c0a801517b487525/' }
        ]
      },
      {
        id: 'service', title: 'อู่ / ร้านบริการรถเครือข่าย', short: 'อู่/ร้านซ่อม', icon: 'i-wrench',
        sub: 'ยาง แบตเตอรี่ น้ำมันเครื่อง ช่วงล่าง มีหลายสาขาในกรุงเทพฯ',
        near: 'shop', nearTitle: 'อู่ / ร้านยาง / แบต ใกล้คุณ', wideTag: 'เบอร์กลาง',
        nearNote: 'ระยะทางคิดจากเขตที่สาขาตั้งอยู่ · โทรสาขาไม่ติด ลองเบอร์กลางของร้านด้านล่าง',
        items: [
          { num: '1153', name: 'บี-ควิก (B-Quik)', desc: 'ยาง แบต น้ำมันเครื่อง เบรก · โทร 08:00–21:00 น.',
            tags: ['b-quik', 'bquik', 'ยาง', 'แบตเตอรี่'], src: 'https://www.b-quik.com/en/contact' },
          { num: '1369', name: 'ค็อกพิท (Cockpit)', desc: 'ยาง แบต น้ำมันเครื่อง ช่วงล่าง เช็คระยะ',
            tags: ['cockpit', 'bridgestone', 'ยาง'], src: 'https://www.cockpit.co.th/contact' },
          { num: '1365', name: 'ฟิต ออโต้ (FIT Auto)', desc: 'Call Center ปตท. โออาร์ แล้วกด 17',
            tags: ['fit auto', 'ptt', 'ปตท', 'น้ำมันเครื่อง'], src: 'https://www.pttfitauto.com/th/contact-us' },
          { num: '065-504-8000', name: 'ออโต้แบคส์ (Autobacs)', desc: 'ยาง แบต น้ำมันเครื่อง ช่วงล่าง · 08:00–20:00 น.',
            tags: ['autobacs', 'ยาง', 'แบตเตอรี่'], src: 'https://www.autobacs.co.th/th/contact-us' }
        ]
      }
    ]
  };
});
