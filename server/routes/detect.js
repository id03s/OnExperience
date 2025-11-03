// server/routes/detect.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const { detectSponsorByImages, detectFromBuffer } = require('../detect/banner');
const LEX = require('../classifier/lexicons'); // ← lexicons.js 경로

const router = express.Router();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });
const SIGN_PATH = path.resolve(__dirname, '..', 'detect', 'signatures.json');

/* -------------------- 공통 유틸 -------------------- */
function safeReferer(u) {
  try { const p = new URL(u); return p.origin + p.pathname; }
  catch { return undefined; }
}
const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));

function hamming(hex1, hex2) {
  const a = BigInt('0x' + hex1);
  const b = BigInt('0x' + hex2);
  let x = a ^ b, d = 0;
  while (x) { d += Number(x & 1n); x >>= 1n; }
  return d;
}

async function calcAHashFromBuffer(buf, region, meta) {
  const img = sharp(buf, { failOn: 'none' });
  const m = meta || await img.metadata();
  const rect =
    region === 'left'   ? { left:0, top:0, width:Math.floor(m.width*0.5), height:m.height } :
    region === 'right'  ? { left:Math.floor(m.width*0.5), top:0, width:Math.ceil(m.width*0.5), height:m.height } :
    region === 'top'    ? { left:0, top:0, width:m.width, height:Math.floor(m.height*0.5) } :
    region === 'bottom' ? { left:0, top:Math.floor(m.height*0.5), width:m.width, height:Math.ceil(m.height*0.5) } :
    (!region || region === 'whole') ? { left:0, top:0, width:m.width, height:m.height } :
    (()=>{ const [x,y,w,h] = String(region).split(',').map(v=>parseInt(v,10)); return { left:x, top:y, width:w, height:h }; })();

  const raw = await img.extract(rect).grayscale().resize(8,8,{fit:'fill'}).raw().toBuffer();
  const avg = raw.reduce((s,v)=>s+v,0)/raw.length;
  let bits=0n; for (let i=0;i<64;i++) bits = (bits<<1n) | BigInt(raw[i] >= avg);
  return bits.toString(16).padStart(16,'0');
}

function absoluteUrl(base, src) {
  try {
    if (!src) return null;
    src = (src || '').trim().split(' ')[0];
    if (src.startsWith('//')) return (new URL(base).protocol) + src;
    if (/^https?:\/\//i.test(src)) return src;
    return new URL(src, base).href;
  } catch { return null; }
}

function loadSigns() {
  if (!fs.existsSync(SIGN_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(SIGN_PATH,'utf8')) || []; }
  catch { return []; }
}

/* -------------------- 배너 후보/텍스트 스코어러 -------------------- */
const BAD_SNIPPETS = [
  'btn_', 'button', 'sprite', 'icon', 'favicon', 'download', 'spblog',
  'emoticon', 'logo', 'menu', 'arrow', 'banner_small', 'mylog/post/btn', 'download2'
];
function isBadUrl(u='') {
  const x = u.toLowerCase();
  if (/\.(gif)$/i.test(x)) return true; // 버튼/애니 gif 제외
  return BAD_SNIPPETS.some(p => x.includes(p));
}
function isBannerMeta(meta = {}) {
  const w = Number(meta.width) || 0, h = Number(meta.height) || 0;
  if (w * h < 120 * 40) return false;
  const ratio = h ? w / h : 0;
  if (ratio < 2.5 || ratio > 8) return false;
  return true;
}
function scoreText(text = '') {
  const t = String(text).replace(/[\s\r\n\t]+/g, ' ').toLowerCase();
  let S = 0, P = 0, hasSelf = false;
  const hasNeg = (i, kw, w=15) => {
    const s = Math.max(0, i-w), e = Math.min(t.length, i+kw.length+w);
    const slice = t.slice(s, e);
    return (LEX.negations||[]).some(n => slice.includes(n.toLowerCase()));
  };
  const scan = (arr=[], type) => {
    arr.forEach(raw=>{
      const kw = raw.toLowerCase();
      let i = t.indexOf(kw);
      while(i!==-1){
        const neg = hasNeg(i, kw);
        if (type==='S') S += neg ? -2 : +2;
        else { if(!neg) hasSelf = true; P += neg ? -1 : +3; }
        i = t.indexOf(kw, i+kw.length);
      }
    });
  };
  scan(LEX.sponsored, 'S');
  scan(LEX.selfPaid, 'P');
  return { S, P, hasSelf };
}

/* -------------------- A) /api/detect/banner -------------------- */
router.post('/banner', async (req, res) => {
  try {
    const { url, images = [], threshold = 10 } = req.body || {};
    let imgUrls = images;

    if (url) {
      const html = await axios.get(url, {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0', ...(safeReferer(url) ? { Referer: safeReferer(url) } : {}) }
      }).then(r => r.data);

      const $ = cheerio.load(html, { decodeEntities:false });
      const set = new Set();

      $('img').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src') || '';
        const abs = absoluteUrl(url, src);
        if (abs) set.add(abs);
      });
      $('img[srcset]').each((_, el) => {
        const srcset = ($(el).attr('srcset') || '').split(',');
        srcset.forEach(part=>{
          const s = part.trim().split(' ')[0];
          const abs = absoluteUrl(url, s);
          if (abs) set.add(abs);
        });
      });

      imgUrls = Array.from(set);
    }

    if (!imgUrls.length) {
      return res.status(400).json({ ok:false, message:'이미지 URL이 없습니다.' });
    }

    const result = await detectSponsorByImages(imgUrls, { threshold: Number(threshold) });
    res.json({ ok:true, ...result });
  } catch (e) {
    res.status(500).json({ ok:false, message: String(e?.message||e) });
  }
});

/* -------------------- B) /api/detect/banner-file -------------------- */
router.post('/banner-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok:false, message:'file 필드가 없습니다.' });
    const threshold = Number(req.body?.threshold ?? 6);
    const best = await detectFromBuffer(req.file.buffer, threshold);

    if (best && best.matched && !isBadUrl(best.imageUrl || '') && best.dist <= 6) {
      return res.json({ ok:true, summary:{ label:'sponsored', source: best.name, dist: best.dist } });
    }
    return res.json({ ok:true, summary:{ label:'none' } });
  } catch (e) {
    res.status(500).json({ ok:false, message: String(e?.message||e) });
  }
});

/* -------------------- C) /api/detect/from-page -------------------- */
// 이미지 + 텍스트 동시 추출(일반 + 네이버 iframe)
async function extractFromPage(entryUrl) {
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124';
  const get = async (u) => {
    const res = await axios.get(u, {
      headers: { 'User-Agent': UA, ...(safeReferer(u) ? { Referer: safeReferer(u) } : {}) },
      timeout: 15000
    });
    return res.data;
  };

  const urls = [];
  let baseUrl = entryUrl;

  // 1차 페이지
  let html = await get(entryUrl);
  let $ = cheerio.load(html, { decodeEntities:false });

  // 네이버 블로그(iframe) 특례
  const frame = $('frame#mainFrame, iframe#mainFrame').attr('src');
  if (frame) {
    const inner = absoluteUrl(entryUrl, frame);
    if (inner) {
      html = await get(inner);
      $ = cheerio.load(html, { decodeEntities:false });
      baseUrl = inner;
    }
  }

  // 본문 텍스트
  const text = $('body').text() || '';

  // 이미지 수집
  $('img').each((_, el)=>{
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    const abs = absoluteUrl(baseUrl, src);
    if (abs) urls.push(abs);

    const srcset = $(el).attr('srcset');
    if (srcset) {
      srcset.split(',').forEach(part=>{
        const s = part.trim().split(' ')[0];
        const abs2 = absoluteUrl(baseUrl, s);
        if (abs2) urls.push(abs2);
      });
    }
  });

  // noscript 안의 img
  $('noscript').each((_, el)=>{
    const $n = cheerio.load($(el).html() || '');
    $n('img').each((__, img)=>{
      const src = $n(img).attr('src');
      const abs = absoluteUrl(baseUrl, src);
      if (abs) urls.push(abs);
    });
  });

  // og:image, link rel=image_src
  const og = $('meta[property="og:image"]').attr('content');
  if (og) urls.push(absoluteUrl(baseUrl, og));
  const linkImg = $('link[rel="image_src"]').attr('href');
  if (linkImg) urls.push(absoluteUrl(baseUrl, linkImg));

  // CSS background-image(url)
  $('[style*="background"]').each((_, el)=>{
    const st = ($(el).attr('style')||'');
    const m = st.match(/url\((['"]?)(.*?)\1\)/i);
    if (m && m[2]) {
      const abs = absoluteUrl(baseUrl, m[2]);
      if (abs) urls.push(abs);
    }
  });

  // 후보 정리
  const exts = /\.(png|jpe?g|webp|gif|bmp|svg)(\?|$)/i;
  const candidates = uniq(urls)
    .filter(u => exts.test(u) || /\/img\.php|image\.webp|bottomImgView/i.test(u))
    .filter(u => !isBadUrl(u))
    .slice(0, 80);

  return { candidates, text };
}

// 이미지 매칭
async function matchOneImage(url, signs) {
  try {
    const resp = await axios.get(url, {
      responseType:'arraybuffer',
      headers: { 'User-Agent': 'Mozilla/5.0', ...(safeReferer(url) ? { Referer: safeReferer(url) } : {}) },
      timeout: 15000
    });
    const buf = Buffer.from(resp.data);
    const img = sharp(buf, { failOn:'none' });
    const meta = await img.metadata();

    const isBanner = isBannerMeta(meta);

    let best = null;
    for (const s of signs) {
      const hash = await calcAHashFromBuffer(buf, s.region || 'whole', meta);
      const dist = hamming(hash, s.avgHash);
      if (!best || dist < best.dist)
        best = { name: s.name, region: s.region, dist, hash, sign: s.avgHash, imageUrl: url, _isBannerCandidate: isBanner };
    }
    return best;
  } catch { return null; }
}

// 블로그 페이지 URL로 감지(요약만 반환)
router.post('/from-page', async (req, res) => {
  try {
    const pageUrl = req.body?.pageUrl || req.body?.url;
    const threshold = Number(req.body?.threshold ?? 6); // 보수적
    if (!pageUrl) return res.status(400).json({ ok:false, message:'pageUrl 필요' });

    const signs = loadSigns();
    if (!signs.length) return res.status(400).json({ ok:false, message:'signatures.json 비어있음' });

    // ✅ 한 번만 호출해서 candidates + text 동시 확보
    const { candidates, text } = await extractFromPage(pageUrl);
    if (!candidates.length && !text) {
      return res.json({ ok:true, summary:{ label:'none' } });
    }

    const T = scoreText(text || '');

    const results = [];
    for (const u of candidates) {
      const r = await matchOneImage(u, signs);
      if (r) results.push(r);
    }
    results.sort((a,b)=>a.dist-b.dist);
    const winner = results[0] || null;

    let summary;
    if (T.hasSelf || T.P >= T.S + 2) summary = { label: 'self' };
    else if (T.S >= T.P + 2)        summary = { label: 'sponsored' };
    else if (winner && winner._isBannerCandidate && winner.dist <= threshold)
      summary = { label: 'sponsored', source: winner.name, dist: winner.dist };
    else summary = { label: 'none' };

    return res.json({ ok:true, summary });
  } catch (e) {
    res.status(500).json({ ok:false, message:String(e?.message||e) });
  }
});

module.exports = router;

