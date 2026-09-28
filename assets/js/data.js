/*
 * รายการเบอร์โทร — แก้ไขที่ไฟล์นี้ไฟล์เดียว (ไม่ต้อง build)
 *
 * checked  : วันที่ตรวจสอบเบอร์ล่าสุด (แสดงท้ายหน้า)
 * sections : หมวดเรียงตามลำดับที่แสดง (หมวดแรกควรเป็นฉุกเฉิน)
 *   id, title, short (ชื่อบนปุ่มหมวด), sub (คำอธิบาย), icon (ไอคอนใน index.html), tone: 'red' = สีฉุกเฉิน
 *   note  : ข้อความเตือนใต้หมวด (ถ้ามี)
 *   items : { num: เบอร์ตามที่ให้กด, name, desc (ไม่เกิน 60 ตัวอักษร), tags: คำค้นเพิ่มเติม, src: หน้าเว็บทางการที่ยืนยันเบอร์ }
 *
 * ทุกเบอร์ต้องมีแหล่งที่มา (src) จากเว็บไซต์ทางการของหน่วยงาน/บริษัทนั้น ๆ
 * ห้ามใส่เบอร์ที่ไม่ได้ตรวจสอบ เพราะคนที่รถเสียจะกดโทรทันที
 *
 * nearby    : ปุ่มค้นหาใกล้ตัวใน Google Maps ที่ขึ้นหลังรู้ตำแหน่ง ({ q: คำค้น, label: ชื่อบนปุ่ม })
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

    nearby: [
      { q: 'รถสไลด์', label: 'รถสไลด์' },
      { q: 'อู่ซ่อมรถ', label: 'อู่ซ่อมรถ' },
      { q: 'ร้านยางรถยนต์', label: 'ร้านยาง' },
      { q: 'ปั๊มน้ำมัน', label: 'ปั๊มน้ำมัน' }
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
        note: 'ราคาขึ้นกับระยะทาง สอบถามราคาก่อนเรียกรถ · ถ้ามีประกันรถ ลองโทรหาประกันก่อน อาจมีรถยกให้ตามเงื่อนไขกรมธรรม์',
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
