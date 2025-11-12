const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
//서버에있는 리뷰삭제
//db 경로 설정
const dbDir = path.join(__dirname, 'db');
const dbPath = path.join(dbDir, 'reviews.db');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// 테이블 생성
db.run(`CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  place TEXT,
  address TEXT,
  category TEXT,
  supportPrice TEXT,
  visitDate TEXT,
  paymentPrice TEXT,
  blogLink TEXT,
  menuType TEXT,
  isComplete INTEGER
)`);

// GET 전체 리뷰
router.get('/', (req, res) => {
  db.all('SELECT * FROM reviews', [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// POST 리뷰 등록
router.post('/', (req, res) => {
  const {
    place, address, category, supportPrice,
    visitDate, paymentPrice, blogLink, menuType, isComplete
  } = req.body;

  const query = `INSERT INTO reviews
    (place, address, category, supportPrice, visitDate, paymentPrice, blogLink, menuType, isComplete)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(query, [
    place, address, category, supportPrice,
    visitDate, paymentPrice, blogLink, menuType,
    isComplete ? 1 : 0
  ], function (err) {
    if (err) return res.status(500).json(err);
    res.json({ id: this.lastID }); // 새로 생성된 id 반환
  });
});

// DELETE 리뷰 삭제
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  console.log('🗑️ DELETE 요청 id:', id); // 로그 확인용

  db.run('DELETE FROM reviews WHERE id = ?', id, function (err) {
    if (err) {
      console.error('DB 삭제 에러:', err);
      return res.status(500).json(err);
    }
    console.log('DB 삭제 결과 changes:', this.changes);
    if (this.changes === 0) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }
    res.json({ deletedId: id });
  });
});

module.exports = router;
