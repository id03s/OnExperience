const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const reviewRoutes = require('./routes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/reviews', reviewRoutes);  // 꼭 있어야 함

app.listen(4000, () => {
  console.log('✅ 서버 실행됨: http://localhost:4000');
});
