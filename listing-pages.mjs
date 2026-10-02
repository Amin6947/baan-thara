// สร้างหน้าแชร์ของแต่ละประกาศ (p/CODE.html) ให้มีรูปและชื่อทรัพย์ในการ์ดพรีวิว WeChat / LINE / Facebook
// GitHub Actions รันไฟล์นี้อัตโนมัติทุก 30 นาที (ดู .github/workflows/listing-pages.yml)
import fs from 'node:fs';
const SB = 'https://srdcpdkckuifvtetxdwx.supabase.co';
const KEY = 'sb_publishable_ixCwFiIjgHEZZCl_yhK0Rg_BYzsE9F6';
const SITE = 'https://amin6947.github.io/baan-thara/';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const okImg = u => typeof u === 'string' && (/^https:\/\/images\.unsplash\.com\/photo-[0-9a-f-]+\?[A-Za-z0-9=&]*$/.test(u) || /^[0-9a-f-]{36}\/[A-Za-z0-9_-]{4,40}\.jpg$/.test(u));
const imgUrl = u => u.startsWith('https://') ? u.replace(/w=\d+/, 'w=1200') : `${SB}/storage/v1/object/public/listing-photos/${u}`;
const baht = n => '฿' + Math.round(Number(n)).toLocaleString('en-US');
const KIND_TH = {condo:'คอนโด', house:'บ้านเดี่ยว', town:'ทาวน์โฮม'}, KIND_ZH = {condo:'公寓', house:'独栋别墅', town:'联排别墅'};

const res = await fetch(`${SB}/rest/v1/listings?select=code,mode,kind,project,district,station,beds,baths,area,rent,sale,pets,photos,description&status=eq.active&limit=2000`, {headers:{apikey:KEY, Authorization:`Bearer ${KEY}`}});
if (!res.ok) { console.error('fetch failed', res.status, await res.text()); process.exit(1); }
const rows = await res.json();
fs.mkdirSync('p', {recursive:true});
const keep = new Set();
for (const r of rows) {
  if (!/^[A-Za-z0-9-]{3,30}$/.test(r.code)) continue;
  const cover = (Array.isArray(r.photos) ? r.photos : []).map(x => x && x.f).find(okImg);
  const img = cover ? imgUrl(cover) : SITE + 'share.jpg';
  const priceTh = [r.rent ? `เช่า ${baht(r.rent)}/เดือน` : '', r.sale ? `ขาย ${baht(r.sale)}` : ''].filter(Boolean).join(' · ');
  const priceZh = [r.rent ? `月租 ${baht(r.rent)}` : '', r.sale ? `售价 ${baht(r.sale)}` : ''].filter(Boolean).join(' · ');
  const title = `${r.project} · ${priceTh} | JUBILEE Real Estate`;
  const desc = `曼谷 ${r.district} · ${KIND_ZH[r.kind]||''} ${r.beds}卧${r.baths}卫 ${r.area}㎡ · ${priceZh} | ${KIND_TH[r.kind]||''} ${r.beds} ห้องนอน ${r.area} ตร.ม. ${r.district}${r.station ? ' ใกล้ ' + r.station : ''}`;
  const target = `../?p=${encodeURIComponent(r.code)}`;
  const url = `${SITE}p/${r.code}.html`;
  const html = `<!doctype html>
<html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="JUBILEE Real Estate">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}"><meta property="og:url" content="${esc(url)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:image" content="${esc(img)}">
<meta itemprop="name" content="${esc(title)}"><meta itemprop="description" content="${esc(desc)}"><meta itemprop="image" content="${esc(img)}">
<link rel="canonical" href="${esc(SITE + '?p=' + encodeURIComponent(r.code))}">
<script>location.replace(${JSON.stringify(target)}+(location.hash||''));</script>
<style>body{font-family:system-ui,sans-serif;margin:0;padding:16px;max-width:720px;margin-inline:auto;color:#111}img{width:100%;border-radius:12px}a{color:#B8137F;font-weight:700}</style>
</head><body>
<img src="${esc(img)}" alt="${esc(r.project)}">
<h1>${esc(r.project)}</h1><p>${esc(desc)}</p>
<p><a href="${esc(target)}">ดูรายละเอียดประกาศ / 查看房源详情 / View listing</a></p>
</body></html>
`;
  const file = `p/${r.code}.html`; keep.add(file);
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== html) fs.writeFileSync(file, html);
}
for (const f of fs.readdirSync('p')) if (!keep.has(`p/${f}`)) fs.unlinkSync(`p/${f}`);
console.log(`share pages: ${keep.size}`);
