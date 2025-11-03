// server/server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ===== DB =====
const DB_PATH = path.resolve(__dirname, 'database.sqlite');
console.log('[DB]', DB_PATH);
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      siteName TEXT,
      place TEXT NOT NULL,
      address TEXT,
      category TEXT,
      supportPrice INTEGER DEFAULT 0,
      visitDate TEXT NOT NULL,
      paymentPrice INTEGER DEFAULT 0,
      blogLink TEXT,
      menuType TEXT,
      isComplete INTEGER DEFAULT 0
    )
  `);

  // ★ 기존 테이블에 siteName 없으면 추가(1회 마이그레이션)
  db.all('PRAGMA table_info(reviews);', (err, cols) => {
    if (err) {
      console.warn('PRAGMA table_info 오류:', err.message);
      return;
    }
    const hasSiteName =
      Array.isArray(cols) && cols.some(c => String(c.name).toLowerCase() === 'sitename');
    if (!hasSiteName) {
      db.run('ALTER TABLE reviews ADD COLUMN siteName TEXT', (e) => {
        if (e) console.warn('siteName 컬럼 추가 실패:', e.message);
        else console.log('siteName 컬럼 추가 완료');
      });
    }
  });
});

// ===== 유틸 =====
const sanitize = (x = {}) => ({
  siteName: String(x.siteName ?? '').trim(),
  place: String(x.place ?? '').trim(),
  address: String(x.address ?? '').trim(),
  category: String(x.category ?? '').trim(),
  supportPrice: Number(x.supportPrice ?? 0) || 0,
  visitDate: String(x.visitDate ?? '').trim(),
  paymentPrice: Number(x.paymentPrice ?? 0) || 0,
  blogLink: String(x.blogLink ?? '').trim(),
  menuType: String(x.menuType ?? '').trim(),
  isComplete:
    (typeof x.isComplete === 'boolean' && x.isComplete) ||
    String(x.isComplete ?? '').toLowerCase() === 'true' ||
    Number(x.isComplete) === 1
});

const INSERT_SQL = `
  INSERT INTO reviews
  (siteName, place, address, category, supportPrice, visitDate, paymentPrice, blogLink, menuType, isComplete)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

// ===== 공용 진단 =====
app.get('/health', (_, res) => res.send('ok'));

// ===== ✅ 엑셀 템플릿 강제 다운로드 =====
app.get('/api/template/reviews-bulk', (req, res) => {
  const filePath = path.join(__dirname, '../public/templates/reviews_bulk_template.xlsx');

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('템플릿 파일이 존재하지 않습니다.');
  }

  // ⭐ 핵심: 무조건 다운로드
  res.download(filePath, 'reviews_bulk_template.xlsx', (err) => {
    if (err) {
      console.error('파일 다운로드 오류:', err.message);
      res.status(500).send('파일 다운로드 중 오류 발생');
    }
  });
});

// ===== 리뷰 CRUD =====
// 목록
app.get('/api/reviews', (req, res) => {
  db.all('SELECT * FROM reviews ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ ok:false, message:'조회 오류', detail:String(err) });
    res.json(rows);
  });
});

// 단건 조회
app.get('/api/reviews/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ ok:false, message:'id invalid' });
  db.get('SELECT * FROM reviews WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ ok:false, message:'조회 오류', detail:String(err) });
    if (!row) return res.status(404).json({ ok:false, message:`id=${id} 대상 없음` });
    res.json({ ok:true, row });
  });
});

// 저장
app.post('/api/reviews', (req, res) => {
  const d = sanitize(req.body);
  if (!d.place || !d.visitDate) return res.status(400).json({ ok:false, message:'필수값 누락' });

  db.run(INSERT_SQL, [
    d.siteName, d.place, d.address, d.category, d.supportPrice, d.visitDate,
    d.paymentPrice, d.blogLink, d.menuType, d.isComplete ? 1 : 0
  ], function (err) {
    if (err) return res.status(500).json({ ok:false, message:'저장 오류', detail:String(err) });
    res.status(201).json({ ok:true, id:this.lastID });
  });
});

// 벌크 저장
app.post('/api/reviews/bulk', (req, res) => {
  const rows = Array.isArray(req.body) ? req.body : [];
  if (!rows.length) return res.status(400).json({ ok:false, message:'빈 배열' });

  const data = rows.map(sanitize);
  const invalid = data.filter(r => !r.place || !r.visitDate);
  if (invalid.length) return res.status(400).json({ ok:false, message:`필수값 누락 ${invalid.length}건` });

  const run = (q,p=[]) => new Promise((resolve,reject)=> {
    db.run(q,p,function(err){ if(err) reject(err); else resolve(this); });
  });

  db.serialize(async () => {
    try {
      await run('BEGIN');
      for (const r of data) {
        await run(INSERT_SQL, [
          r.siteName, r.place, r.address, r.category, r.supportPrice, r.visitDate,
          r.paymentPrice, r.blogLink, r.menuType, r.isComplete ? 1 : 0
        ]);
      }
      await run('COMMIT');
      res.json({ ok:true, inserted:data.length });
    } catch (e) {
      await run('ROLLBACK').catch(()=>{});
      res.status(500).json({ ok:false, message:'벌크 저장 오류', detail:String(e) });
    }
  });
});

// 부분 수정(PATCH)
app.patch('/api/reviews/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ ok:false, message:'id invalid' });
  }

  const allowed = ['siteName','place','address','category','supportPrice','visitDate','paymentPrice','blogLink','menuType','isComplete'];
  const updates = [];
  const params = [];

  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, k)) {
      updates.push(`${k} = ?`);
      if (k === 'supportPrice' || k === 'paymentPrice') params.push(Number(req.body[k]) || 0);
      else if (k === 'isComplete') params.push((req.body[k] === true || Number(req.body[k]) === 1) ? 1 : 0);
      else params.push(String(req.body[k] ?? '').trim());
    }
  }

  if (updates.length === 0) return res.status(400).json({ ok:false, message:'no fields to update' });

  params.push(id);
  const sql = `UPDATE reviews SET ${updates.join(', ')} WHERE id = ?`;
  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ ok:false, message:'update error', detail:String(err) });
    if (this.changes === 0) return res.status(404).json({ ok:false, message:`id=${id} not found` });
    res.json({ ok:true, updated:this.changes });
  });
});

// 삭제
app.delete('/api/reviews/:id', (req, res) => {
  const idRaw = req.params.id;
  const id = Number(idRaw);
  console.log('[DELETE] /api/reviews/:id ->', idRaw, '(parsed:', id, ')');

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ ok:false, message:'id invalid' });
  }

  db.get('SELECT id FROM reviews WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ ok:false, message:'존재 확인 오류', detail:String(err) });
    if (!row) return res.status(404).json({ ok:false, message:`id=${id} 대상 없음` });

    db.run('DELETE FROM reviews WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({ ok:false, message:'삭제 오류', detail:String(err) });
      console.log('  └─ deleted rows =', this.changes);
      res.json({ ok:true, deleted:this.changes });
    });
  });
});

// ===== detect 라우트(중요: listen보다 위!) =====
app.use('/api/detect', require('./routes/detect'));

// ===== 서버 시작 =====
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ API on http://localhost:${PORT}`));
