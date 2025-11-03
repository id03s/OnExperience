// server/detect/decide.js

// banner: { matched, name, dist, _isBannerCandidate }
// text: { S, P }
exports.decide = (banner, text) => {
  // 텍스트가 강하게 "내돈내산"이면 무조건 self
  if (text.P >= text.S + 2) return { label: 'self' };

  // 텍스트가 강하게 협찬이면 sponsored
  if (text.S >= text.P + 2) return { label: 'sponsored' };

  // 배너가 정상 후보이고 해밍 거리 기준 이하라면 sponsored
  if (banner?.matched && banner._isBannerCandidate && banner.dist <= 6) {
    return { label: 'sponsored', source: banner.name, dist: banner.dist };
  }

  // 애매하면 none
  return { label: 'none' };
};
