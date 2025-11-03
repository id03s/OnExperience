// server/detect/make-signature.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');

const SIGN_PATH = path.join(__dirname, 'signatures.json');

function arg(key) {
  const i = process.argv.indexOf(`--${key}`);
  return i !== -1 ? process.argv[i + 1] : null;
}

function parseRegion(region, meta) {
  if (!region || region === 'whole') return { left:0, top:0, width:meta.width, height:meta.height };
  if (region === 'left')   return { left:0, top:0, width:Math.floor(meta.width*0.5), height:meta.height };
  if (region === 'right')  return { left:Math.floor(meta.width*0.5), top:0, width:Math.ceil(meta.width*0.5), height:meta.height };
  if (region === 'top')    return { left:0, top:0, width:meta.width, height:Math.floor(meta.height*0.5) };
  if (region === 'bottom') return { left:0, top:Math.floor(meta.height*0.5), width:meta.width, height:Math.ceil(meta.height*0.5) };
  const [x,y,w,h] = String(region).split(',').map(n => parseInt(n.trim(),10));
  return { left:x, top:y, width:w, height:h };
}

async function aHash(buf, region) {
  const img = sharp(buf, { failOn: 'none' });
  const meta = await img.metadata();
  const rect = parseRegion(region, meta);
  const raw = await img.extract(rect).grayscale().resize(8,8,{fit:'fill'}).raw().toBuffer();
  const avg = raw.reduce((s,v)=>s+v,0)/raw.length;
  let bits = 0n;
  for (let i=0;i<raw.length;i++) bits=(bits<<1n)|BigInt(raw[i]>=avg);
  return bits.toString(16).padStart(16,'0');
}

(async ()=>{
  const name = arg('name');
  const region = arg('region') || 'whole';
  const url = arg('url');
  const file = arg('file');

  if (!name || (!url && !file)) {
    console.log('사용법: --name "플랫폼명" --region "whole|left|right|top|bottom|x,y,w,h" (--url "이미지URL" | --file "로컬경로")');
    process.exit(1);
  }

  let buf;
  if (url) {
    const { data } = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent':'Mozilla/5.0', 'Referer': url }
    });
    buf = Buffer.from(data);
  } else {
    buf = fs.readFileSync(file);
  }

  const avgHash = await aHash(buf, region);
  let list = [];
  try { list = JSON.parse(fs.readFileSync(SIGN_PATH,'utf8')); } catch {}
  list.push({ name, region, avgHash, note: 'added by script' });
  fs.writeFileSync(SIGN_PATH, JSON.stringify(list, null, 2));
  console.log('✅ 추가 완료:', { name, region, avgHash });
})();
