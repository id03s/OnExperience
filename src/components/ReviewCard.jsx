// src/components/ReviewCard.jsx
import React, { useEffect } from "react";

const RC_STYLE_ID = "rc-inline-style";
const rcCSS = `
.rc { --card: rgba(255,255,255,.92); --border: rgba(15,23,42,.09);
  --text:#0b1020; --muted:#6b7280; --g1:#5b73ff; --g2:#b457ff;
  --shadow:0 10px 28px rgba(28,31,55,.08);
  color: var(--text);
}
.rc-card {
  background: var(--card); border:1px solid var(--border);
  border-radius:18px; padding:18px; box-shadow:var(--shadow);
  backdrop-filter: blur(8px);
}
.rc-title { margin:0 0 4px; font-size:18px; font-weight:800; }
.rc-addr { margin:0 0 10px; font-size:13px; color:var(--muted); }

.rc-badges { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; }
.rc-badge {
  font-size:12px; font-weight:700; padding:6px 10px; border-radius:999px;
  background:#f3f4ff; color:#3442b8;
}
.rc-badge.grad {
  background:linear-gradient(90deg,var(--g1),var(--g2)); color:#fff;
  box-shadow:0 8px 18px rgba(91,115,255,.22);
}

.rc-money {
  display:flex; gap:10px; flex-wrap:wrap; margin:10px 0 12px;
  font-size:14px;
}
.rc-chip { padding:6px 10px; border-radius:12px; background:#f8fafc; border:1px solid #edf2f7; }
.rc-chip strong { font-weight:800; }

.rc-meta {
  display:flex; gap:10px; flex-wrap:wrap; font-size:12px; color:#374151;
}
.rc-meta .ok { color:#16a34a; font-weight:800; }
.rc-meta .no { color:#ef4444; font-weight:800; }

.rc-actions { margin-top:14px; display:flex; justify-content:space-between; align-items:center; gap:10px; }
.rc-link {
  text-decoration:none; color:#fff; font-weight:800; font-size:13px;
  padding:10px 14px; border-radius:12px;
  background:linear-gradient(90deg,var(--g1),var(--g2));
  box-shadow:0 10px 22px rgba(91,115,255,.28);
}
.rc-link:hover { filter:brightness(1.03); }
.rc-site { font-size:12px; color:var(--muted); }

.rc-grid { display:grid; gap:16px; grid-template-columns:1fr; }
@media (min-width:720px){ .rc-grid { grid-template-columns: 1fr 1fr; } }
@media (min-width:1080px){ .rc-grid { grid-template-columns: 1fr 1fr 1fr; } }
`;

function useInjectStyle() {
  useEffect(() => {
    if (!document.getElementById(RC_STYLE_ID)) {
      const el = document.createElement("style");
      el.id = RC_STYLE_ID;
      el.textContent = rcCSS;
      document.head.appendChild(el);
    }
  }, []);
}

const formatMoney = (n) => {
  const v = Number(n ?? 0);
  return isNaN(v) ? "0" : v.toLocaleString();
};

export default function ReviewCard({ review }) {
  useInjectStyle();

  const {
    siteName,
    place,
    address,
    category,
    menuType,
    supportPrice,
    paymentPrice,
    visitDate,
    isComplete,
    blogLink,
  } = review || {};

  return (
    <div className="rc rc-card">
      <h2 className="rc-title">{place}</h2>
      <p className="rc-addr">{address}</p>

      <div className="rc-badges">
        {category && <span className="rc-badge grad">{category}</span>}
        {menuType && <span className="rc-badge">{menuType}</span>}
      </div>

      <div className="rc-money">
        <span className="rc-chip">
          지원 <strong>₩{formatMoney(supportPrice)}</strong>
        </span>
        <span className="rc-chip">
          결제 <strong>₩{formatMoney(paymentPrice)}</strong>
        </span>
        <span className="rc-chip">
          합계 <strong>₩{formatMoney((supportPrice||0)+(paymentPrice||0))}</strong>
        </span>
      </div>

      <div className="rc-meta">
        <span>체험일: <strong>{visitDate || "-"}</strong></span>
        <span>완료: <span className={isComplete ? "ok" : "no"}>{isComplete ? "완료" : "미완"}</span></span>
      </div>

      <div className="rc-actions">
        <a
          className="rc-link"
          href={blogLink || "#"}
          target="_blank"
          rel="noreferrer noopener"
        >
          블로그 리뷰 보기
        </a>
        {siteName && <span className="rc-site">from {siteName}</span>}
      </div>
    </div>
  );
}

/* 선택: 카드 그리드로 여러 개 뿌리고 싶으면 아래 보조 컴포넌트도 같이 사용
export function ReviewGrid({ reviews = [] }) {
  useInjectStyle();
  return (
    <div className="rc rc-grid">
      {reviews.map((rv) => (
        <ReviewCard key={rv.id || rv.blogLink || rv.place} review={rv} />
      ))}
    </div>
  );
}
*/
