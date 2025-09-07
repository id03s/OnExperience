const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// db 경로 설정
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
    res.json({ id: this.lastID });
  });
});

module.exports = router;
