// server/routes/analyze.js
const express = require('express');
const router = express.Router();
const { fetchPosts } = require('../crawl/fetchPosts');
const classify = require('../classifier/classify');

router.get('/analyze', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'url query가 필요합니다' });

    const posts = await fetchPosts(url);

    const results = posts.map(p => {
      const cls = classify(p);
      return {
        title: p.title,
        link: p.link,
        pubDate: p.pubDate || '',
        label: cls.label,            // 'SelfPaid' | 'Unknown' (보수모드)
        confidence: cls.confidence,  // 0~1
        scoreSponsored: cls.scoreSponsored,
        scoreSelf: cls.scoreSelf,
        evidence: (cls.evidence || []).slice(0, 8),
      };
    });

    res.json({ count: results.length, results });
  } catch (e) {
    console.error('[analyze error]', e);
    res.status(500).json({ error: '분석 실패', detail: String(e.message || e) });
  }
});

module.exports = router;
