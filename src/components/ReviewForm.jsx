// src/components/ReviewForm.jsx
import React, { useMemo, useState, useEffect } from "react";

/* ===== 1) 이 컴포넌트 전용 CSS를 한 번만 <head>에 주입 ===== */
const RF_STYLE_ID = "rf-inline-style";
const rfCSS = `
.rf { --card: rgba(255,255,255,.92); --border: rgba(15,23,42,.09);
  --muted:#6b7280; --text:#0b1020; --g1:#5b73ff; --g2:#b457ff;
  --ring-h:235; --ring-s:90%; --ring-l:55%;
  --shadow:0 10px 30px rgba(28,31,55,.08);
  min-height: 100%; padding: 20px 12px; color: var(--text);
  background: linear-gradient(120deg,#eef2ff,#ffffff 40%,#fff0ff);
}
.rf * { box-sizing: border-box; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Noto Sans KR", Arial, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; }
.rf-shell { max-width: 1000px; margin: 0 auto; }
.rf-card { background: var(--card); border: 1px solid var(--border);
  border-radius: 20px; padding: 26px; box-shadow: var(--shadow);
  backdrop-filter: blur(8px);
}
.rf-h1 { margin: 0 0 6px; font-size: 28px; font-weight: 800;
  background: linear-gradient(90deg,var(--g1),var(--g2)); -webkit-background-clip:text; background-clip:text; color: transparent;
}
.rf-sub { margin: 0 0 18px; font-size: 13px; color: var(--muted); }
.rf-req { color: #d946ef; font-weight: 700; }

.rf-grid { display: grid; gap: 16px; grid-template-columns: 1fr; }
@media (min-width: 860px) { .rf-grid { grid-template-columns: 1fr 1fr; } }

.rf-field { display: flex; flex-direction: column; }
.rf-label { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 8px; }

.rf-input, .rf-select, .rf-number, .rf-date {
  width: 100%; height: 48px; padding: 0 14px; border-radius: 14px;
  border: 1px solid var(--border); background: #fff; color: var(--text);
  font-size: 15px; outline: none; transition: box-shadow .15s ease, border-color .15s ease, transform .04s ease;
}
.rf-input::placeholder{ color:#9aa0ab; }
.rf-input:focus, .rf-select:focus, .rf-number:focus, .rf-date:focus {
  border-color: hsl(var(--ring-h),var(--ring-s),var(--ring-l));
  box-shadow: 0 0 0 6px hsla(var(--ring-h),var(--ring-s),var(--ring-l),.16);
}
.rf-number { -moz-appearance: textfield; }
.rf-number::-webkit-outer-spin-button,
.rf-number::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

.rf-err { color: #e11d48; font-size: 12px; margin-top: 6px; }

.rf-row { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 6px; }
.rf-checkwrap { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
.rf-checkbox { width: 18px; height: 18px; accent-color: #4f46e5; transform: translateY(1px); }

.rf-right { display: inline-flex; align-items: center; gap: 12px; }
.rf-total { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px;
  border-radius: 999px; color: #fff; font-weight: 800; font-size: 13px;
  background: linear-gradient(90deg,var(--g1),var(--g2));
  box-shadow: 0 8px 18px rgba(91,115,255,.25);
}

.rf-btn { height: 48px; padding: 0 22px; border: 0; border-radius: 14px;
  color: #fff; font-weight: 800; cursor: pointer;
  background: linear-gradient(90deg,var(--g1),var(--g2));
  box-shadow: 0 10px 24px rgba(91,115,255,.35);
  transition: transform .06s ease, filter .15s ease;
}
.rf-btn:hover { filter: brightness(1.03); }
.rf-btn:active { transform: translateY(1px); }
.rf-btn[disabled]{ opacity:.6; cursor:not-allowed; }

.rf-toast { position: fixed; right: 22px; top: 20px; z-index: 9999;
  background:#111827; color:#fff; padding: 12px 16px; border-radius: 12px; box-shadow: var(--shadow);
  animation: rf-toast-in .2s ease-out;
}
@keyframes rf-toast-in { from{opacity:0; transform: translateY(-6px)} to{opacity:1; transform:none} }
`;

// ✅ detectedPlatform을 받아 자동으로 siteName 채워줍니다.
export default function ReviewForm({ onSubmit, detectedPlatform = '' }) {
  /* CSS 주입 */
  useEffect(() => {
    if (!document.getElementById(RF_STYLE_ID)) {
      const style = document.createElement("style");
      style.id = RF_STYLE_ID;
      style.textContent = rfCSS;
      document.head.appendChild(style);
    }
  }, []);

  /* ===== 2) 상태/유틸 ===== */
  const [form, setForm] = useState({
    siteName: detectedPlatform || "",   // ✅ 초기값에 적용
    place: "",
    address: "",
    category: "",
    supportPrice: "",
    visitDate: "",
    paymentPrice: "",
    blogLink: "",
    menuType: "",
    isComplete: false,
  });

  // ✅ detectedPlatform이 바뀌면 입력칸에 반영
  useEffect(() => {
    if (detectedPlatform && detectedPlatform !== form.siteName) {
      setForm((p) => ({ ...p, siteName: detectedPlatform }));
    }
  }, [detectedPlatform]); // eslint-disable-line react-hooks/exhaustive-deps

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  const toNumber = (v) => Number(String(v).replaceAll(",", "") || 0);
  const toMoney = (v) => {
    const n = toNumber(v);
    return isNaN(n) ? "" : n.toLocaleString();
  };

  const total = useMemo(
    () => toNumber(form.supportPrice) + toNumber(form.paymentPrice),
    [form.supportPrice, form.paymentPrice]
  );

  const setVal = (name, value) => setForm((p) => ({ ...p, [name]: value }));
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setVal(name, type === "checkbox" ? checked : value);
  };
  const onMoneyBlur = (name) => setVal(name, toMoney(form[name]));

  const showToast = (msg) => {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(""), 1700);
  };

  const validate = () => {
    const next = {};
    const req = (k, msg) => { if (!String(form[k]).trim()) next[k] = msg; };
    req("siteName", "체험단 사이트명을 입력하세요.");
    req("place", "가게명을 입력하세요.");
    req("address", "주소를 입력하세요.");
    if (!form.category) next.category = "업종을 선택하세요.";
    if (!form.menuType) next.menuType = "메뉴 유형을 선택하세요.";
    const s = toNumber(form.supportPrice);
    const p = toNumber(form.paymentPrice);
    if (isNaN(s) || s < 0) next.supportPrice = "0 이상의 금액을 입력하세요.";
    if (isNaN(p) || p < 0) next.paymentPrice = "0 이상의 금액을 입력하세요.";
    req("visitDate", "방문 날짜를 선택하세요.");
    req("blogLink", "블로그 링크를 입력하세요.");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        supportPrice: toNumber(form.supportPrice),
        paymentPrice: toNumber(form.paymentPrice),
      };
      if (typeof onSubmit === "function") onSubmit(payload);
      else console.log("제출 데이터:", payload);
      showToast("등록 완료!");
      setForm({
        siteName: detectedPlatform || "", // ✅ 폼 리셋 시에도 유지
        place: "",
        address: "",
        category: "",
        supportPrice: "",
        visitDate: "",
        paymentPrice: "",
        blogLink: "",
        menuType: "",
        isComplete: false,
      });
      setErrors({});
    } finally {
      setSubmitting(false);
    }
  };

  /* ===== 3) UI ===== */
  return (
    <div className="rf">
      <div className="rf-shell">
        <div className="rf-card">
          <h1 className="rf-h1">리뷰 작성</h1>
          <p className="rf-sub">
            필수 항목은 <span className="rf-req">＊</span> 표시됩니다.
          </p>

          <form className="rf-grid" onSubmit={handleSubmit} noValidate>
            <div className="rf-field">
              <label className="rf-label">체험단 사이트명 <span className="rf-req">＊</span></label>
              <input
                className="rf-input"
                name="siteName"
                value={form.siteName}
                onChange={onChange}
                placeholder="예: 디너의 여왕, 리뷰노트"
              />
              {/* ✅ 자동 인식 안내 */}
              {detectedPlatform && (
                <div className="rf-err" style={{ color:'#16a34a' }}>
                  자동 인식됨: <b>{detectedPlatform}</b>
                </div>
              )}
              {errors.siteName && <p className="rf-err">{errors.siteName}</p>}
            </div>

            <div className="rf-field">
              <label className="rf-label">가게명 <span className="rf-req">＊</span></label>
              <input className="rf-input" name="place" value={form.place}
                     onChange={onChange} placeholder="가게명" />
              {errors.place && <p className="rf-err">{errors.place}</p>}
            </div>

            <div className="rf-field">
              <label className="rf-label">주소 <span className="rf-req">＊</span></label>
              <input className="rf-input" name="address" value={form.address}
                     onChange={onChange} placeholder="전북 군산시 ..." />
              {errors.address && <p className="rf-err">{errors.address}</p>}
            </div>

            <div className="rf-field">
              <label className="rf-label">업종 <span className="rf-req">＊</span></label>
              <select className="rf-select" name="category" value={form.category} onChange={onChange}>
                <option value="" disabled>업종 선택</option>
                {["음식점","카페","술집","디저트","과일가게","기타"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.category && <p className="rf-err">{errors.category}</p>}
            </div>

            <div className="rf-field">
              <label className="rf-label">메뉴 유형 <span className="rf-req">＊</span></label>
              <select className="rf-select" name="menuType" value={form.menuType} onChange={onChange}>
                <option value="" disabled>종류 선택</option>
                {["세트","단품","디저트","음료","코스","기타"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              {errors.menuType && <p className="rf-err">{errors.menuType}</p>}
            </div>

            <div className="rf-field">
              <label className="rf-label">지원금(₩) <span className="rf-req">＊</span></label>
              <input className="rf-number" name="supportPrice" inputMode="numeric" placeholder="0"
                     value={form.supportPrice} onChange={onChange}
                     onBlur={() => onMoneyBlur("supportPrice")} />
              {errors.supportPrice && <p className="rf-err">{errors.supportPrice}</p>}
            </div>

            <div className="rf-field">
              <label className="rf-label">결제 금액(₩) <span className="rf-req">＊</span></label>
              <input className="rf-number" name="paymentPrice" inputMode="numeric" placeholder="0"
                     value={form.paymentPrice} onChange={onChange}
                     onBlur={() => onMoneyBlur("paymentPrice")} />
              {errors.paymentPrice && <p className="rf-err">{errors.paymentPrice}</p>}
            </div>

            <div className="rf-field">
              <label className="rf-label">방문 날짜 <span className="rf-req">＊</span></label>
              <input type="date" className="rf-date" name="visitDate"
                     value={form.visitDate} onChange={onChange} />
              {errors.visitDate && <p className="rf-err">{errors.visitDate}</p>}
            </div>

            <div className="rf-field">
              <label className="rf-label">블로그 링크 <span className="rf-req">＊</span></label>
              <input className="rf-input" name="blogLink" value={form.blogLink}
                     onChange={onChange} placeholder="https://blog.naver.com/..." />
              {errors.blogLink && <p className="rf-err">{errors.blogLink}</p>}
            </div>

            <div className="rf-row">
              <label className="rf-checkwrap">
                <input type="checkbox" className="rf-checkbox"
                       name="isComplete" checked={form.isComplete} onChange={onChange} />
                <span>리뷰/방문 완료</span>
              </label>
              <div className="rf-right">
                <span className="rf-total">총 금액 ₩{total.toLocaleString()}</span>
                <button type="submit" className="rf-btn" disabled={submitting}>
                  {submitting ? "등록 중…" : "등록"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {toast && <div className="rf-toast">{toast}</div>}
    </div>
  );
}


