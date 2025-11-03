// server/classifier/classify.js
const { sponsored, selfPaid, negations } = require('./lexicons');

function norm(text = '') {
  return (text || '')
    .replace(/[\t\n\r]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .toLowerCase();
}

function hasNegationAround(text, idx, kw, window = 15) {
  const start = Math.max(0, idx - window);
  const end = Math.min(text.length, idx + kw.length + window);
  const slice = text.slice(start, end);
  return negations.some(ng => slice.includes(ng));
}

function score(text) {
  const t = norm(text);
  let scoreSponsored = 0;
  let scoreSelf = 0;
  const evidence = [];

  const bump = (list, type) => {
    list.forEach(kwRaw => {
      const kw = kwRaw.toLowerCase();
      let idx = t.indexOf(kw);
      while (idx !== -1) {
        const neg = hasNegationAround(t, idx, kw);
        const ev = { type, kw: kwRaw, index: idx, negated: neg };

        if (type === 'sponsored') {
          if (neg) { scoreSelf += 1; ev.flip = true; }   // "협찬 아님" 같은 문맥
          else { scoreSponsored += 1; }
        } else { // self
          if (neg) { scoreSponsored += 1; ev.flip = true; } // "내돈내산 아님" 같은 문맥
          else { scoreSelf += 1; }
        }

        evidence.push(ev);
        idx = t.indexOf(kw, idx + kw.length);
      }
    });
  };

  bump(sponsored, 'sponsored');
  bump(selfPaid, 'self');

  return { scoreSponsored, scoreSelf, evidence };
}

// 결정 규칙: 협찬/내돈내산/모름
function decide({ scoreSponsored, scoreSelf }) {
  const diff = scoreSponsored - scoreSelf;

  // 협찬 쪽 신호가 더 강하면 Sponsored
  if (diff >= 2) {
    return { label: 'Sponsored', confidence: Math.min(0.9, 0.6 + diff * 0.1) };
  }

  // 내돈내산 키워드가 1회 이상이면 SelfPaid (횟수에 따라 confidence 상승)
  if (scoreSelf >= 1) {
    return { label: 'SelfPaid', confidence: Math.min(0.95, 0.6 + 0.1 * (scoreSelf - 1)) };
  }

  // 둘 다 명확치 않으면 Unknown
  return { label: 'Unknown', confidence: 0.5 };
}

module.exports = function classify(post) {
  const pieces = [
    post.title,
    post.summary,
    post.content,
    (post.tags || []).join(' '),
    (post.altTexts || []).join(' ')
  ].filter(Boolean).join(' \n ');

  const scores = score(pieces);
  const decision = decide(scores);

  return { ...decision, ...scores };
};
