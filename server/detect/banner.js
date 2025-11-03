// server/detect/banner.js
const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SIGN_PATH = path.join(__dirname, 'signatures.json');
let SIGNATURES = [];
try {
  SIGNATURES = JSON.parse(fs.readFileSync(SIGN_PATH, 'utf8'));
} catch {
  SIGNATURES = [];
}

// ── helpers ─────────────────────────────────────────────────────
function parseRegion(region, meta) {
  if (!region || region === 'whole') return { left:0, top:0, width:meta.width, height:meta.height };
  if (region === 'left')   return { left:0, top:0, width:Math.floor(meta.width*0.5), height:meta.height };
  if (region === 'right')  return { left:Math.floor(meta.width*0.5), top:0, width:Math.ceil(meta.width*0.5), height:meta.height };
  if (region === 'top')    return { left:0, top:0, width:meta.width, height:Math.floor(meta.height*0.5) };
  if (region === 'bottom') return { left:0, top:Math.floor(meta.height*0.5), width:meta.width, height:Math.ceil(meta.height*0.5) };
  const parts = String(region).split(',').map(n => parseInt(n.trim(), 10));
  if (parts.length === 4 && parts.every(Number.isFinite)) {
    const [x,y,w,h] = parts;
    return { left:Math.max(0,x), top:Math.max(0,y), width:Math.max(1, Math.min(w, meta.width)), height:Math.max(1, Math.min(h, meta.height)) };
  }
  return { left:0, top:0, width:meta.width, height:meta.height };
}

async function aHashOf(buffer, region = 'whole') {
  const img = sharp(buffer, { failOn: 'none' });
  const meta = await img.metadata();
  const rect = parseRegion(region, meta);
  const crop = img.extract(rect).grayscale().resize(8, 8, { fit: 'fill' });
  const raw = await crop.raw().toBuffer(); // 64 bytes
  const avg = raw.reduce((s, v) => s + v, 0) / raw.length;

  let bits = 0n;
  for (let i = 0; i < raw.length; i++) bits = (bits << 1n) | BigInt(raw[i] >= avg);
  return bits.toString(16).padStart(16, '0'); // 16 hex chars
}

function hamming(hexA, hexB) {
  const a = BigInt('0x' + hexA), b = BigInt('0x' + hexB);
  let x = a ^ b, cnt = 0;
  while (x) { cnt++; x &= (x - 1n); }
  return cnt; // 0..64
}

async function fetchBuffer(url, timeout = 10000) {
  const { data } = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout,
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': url }
  });
  return Buffer.from(data);
}

// ── core compare ────────────────────────────────────────────────
async function compareWithSignatures(buf, threshold = 10) {
  const results = [];
  for (const sig of SIGNATURES) {
    try {
      const hash = await aHashOf(buf, sig.region || 'whole');
      const dist = hamming(hash, sig.avgHash);
      results.push({ name: sig.name, region: sig.region || 'whole', dist, matched: dist <= threshold });
    } catch { /* skip one */ }
  }
  results.sort((a, b) => a.dist - b.dist);
  const best = results[0] || null;
  return { best, results };
}

// URL 리스트로 판별(이미지 주소만 받기용)
async function detectSponsorByImages(imageUrls = [], opts = {}) {
  const threshold = opts.threshold ?? 10;
  const out = [];
  for (const url of imageUrls) {
    try {
      const buf = await fetchBuffer(url);
      const { best, results } = await compareWithSignatures(buf, threshold);
      out.push({ url, best, results });
    } catch (e) {
      out.push({ url, error: e.message });
    }
  }
  const winner = out
    .filter(x => x.best && x.best.matched)
    .sort((a, b) => a.best.dist - b.best.dist)[0]?.best || null;
  return { winner, details: out };
}

// 파일 업로드/버퍼 판별용
async function detectFromBuffer(buf, threshold = 10) {
  const { best } = await compareWithSignatures(buf, threshold);
  return best || null;
}

module.exports = {
  aHashOf,
  hamming,
  detectSponsorByImages,
  detectFromBuffer
};
