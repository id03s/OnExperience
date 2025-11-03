// server/detect/lib/candidates.js

// 버튼/아이콘/작은 이미지 등 배너 후보 제외
const BAD = [
  'btn_', 'button', 'sprite', 'icon', 'favicon', 'download',
  'spblog', 'emoticon', 'logo', 'menu', 'arrow', 'banner_small'
];

exports.isBannerCandidate = ({ url, width, height }) => {
  const w = Number(width) || 0;
  const h = Number(height) || 0;
  const ratio = h ? w / h : 0;

  // 너무 작은 이미지 제외 (예: 120x40 미만)
  if (w * h < 120 * 40) return false;

  // 가로로 긴 배너만 허용
  if (ratio < 2.5 || ratio > 8) return false;

  // 파일명/경로로 버튼, 아이콘류 제외
  const u = (url || '').toLowerCase?.() || '';
  if (BAD.some(p => u.includes(p))) return false;

  return true;
};
