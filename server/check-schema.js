const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.get(
    "SELECT sql AS create_sql FROM sqlite_master WHERE type='table' AND name='reviews'",
    (err, row) => {
      if (err) return console.error('sqlite_master 조회 오류:', err);
      console.log('--- CREATE SQL ---');
      console.log(row?.create_sql || '(없음)');
    }
  );

  db.all("PRAGMA table_info(reviews)", (err, rows) => {
    if (err) return console.error('PRAGMA 오류:', err);
    console.log('\n--- PRAGMA table_info(reviews) ---');
    console.table(rows);
  });
});
