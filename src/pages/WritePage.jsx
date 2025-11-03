// src/pages/WritePage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReviewForm from '../components/ReviewForm';
import KakaoMap from '../components/KakaoMap';
import BulkUpload from '../components/BulkUpload';
import AutoClassifier from '../components/AutoClassifier';

// ★ 백엔드 기준 URL (로컬 개발용)
const API_BASE = 'http://localhost:4000';
const BASE_URL = `${API_BASE}/api/reviews`;

/* ===== Inline CSS (이 페이지 전용) ===== */
const WP_STYLE_ID = "wp-inline-style";
const wpCSS = `
.wp { --card: rgba(255,255,255,.92); --border: rgba(15,23,42,.09);
  --text:#0b1020; --muted:#6b7280; --g1:#5b73ff; --g2:#b457ff; --ok:#10b981; --bad:#ef4444;
  --shadow:0 10px 28px rgba(28,31,55,.08);
  background: linear-gradient(120deg,#eef2ff,#ffffff 40%,#fff0ff);
  min-height:100vh; padding:24px 14px; color:var(--text);
}
.wp * { box-sizing: border-box; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Noto Sans KR", Arial, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; }
.wp-shell { max-width: 1100px; margin: 0 auto; }
.wp-header { margin-bottom: 18px; }
.wp-title { margin:0; font-size:28px; font-weight:900;
  background: linear-gradient(90deg,var(--g1),var(--g2));
  -webkit-background-clip:text; background-clip:text; color: transparent;
}
.wp-sub { margin:6px 0 0; font-size:13px; color: var(--muted); }

.wp-card { background: var(--card); border:1px solid var(--border);
  border-radius:20px; box-shadow: var(--shadow); backdrop-filter: blur(8px);
}
.wp-card .wp-card-hd { padding:16px 18px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; gap:12px; }
.wp-card .wp-card-tt { font-size:18px; font-weight:800; }
.wp-card .wp-card-inner { padding:18px; }

.wp-actions { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
.wp-btn { padding:10px 14px; border-radius:12px; font-weight:800; border:1px solid var(--border); box-shadow:var(--shadow); background:#fff; cursor:pointer; }
.wp-btn:hover { filter:brightness(1.02); }
.wp-btn.grad { background:linear-gradient(90deg,var(--g1),var(--g2)); color:#fff; border:0; }
.wp-btn.danger { background:#111827; color:#fff; border:1px solid #111827; }
.wp-btn.danger[disabled] { opacity:.45; cursor:not-allowed; }
.wp-pill { padding:6px 10px; border-radius:999px; font-size:12px; background:#f3f4f6; color:#475569; }
.wp-badge { padding:6px 10px; border-radius:10px; font-size:12px; background:#eef2ff; color:#334155; }
.wp-badge.grad { background:linear-gradient(90deg,var(--g1),var(--g2)); color:#fff; }
.wp-status { font-size:12px; color:var(--muted); margin-top:8px; }
.wp-hide { display:none !important; }

.wp-table-wrap { overflow-x:auto; }
.wp-table { width:100%; border-collapse: collapse; }
.wp-table thead { background:#f8fafc; color:#64748b; }
.wp-table th, .wp-table td { font-size:13px; padding:10px 12px; border-bottom:1px solid #eef2f7; white-space:nowrap; }
.wp-table tbody tr:hover { background:#fafbff; }
.wp-empty { color:var(--muted); font-size:14px; padding:6px 2px; }
.wp-sep { height:16px; }

.th-check, .td-check { width:36px; text-align:center; }
input[type="checkbox"] { width:16px; height:16px; }

.kpi-grid { display:grid; gap:12px; grid-template-columns: repeat(2, minmax(0,1fr)); }
@media (min-width: 768px){ .kpi-grid { grid-template-columns: repeat(4, minmax(0,1fr)); } }
.kpi-card {
  position:relative; padding:16px; border-radius:16px; background:#fff;
  border:1px solid rgba(99,102,241,.15); box-shadow:0 8px 20px rgba(58,60,112,.08);
  overflow:hidden;
}
.kpi-card::after{
  content:""; position:absolute; inset:0; border-radius:16px; padding:1px;
  background:linear-gradient(120deg, rgba(91,115,255,.35), rgba(180,87,255,.35));
  -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
}
.kpi-tt { font-size:12px; letter-spacing:.3px; color:#6b7280; margin-bottom:6px; }
.kpi-val { font-weight:900; font-size:22px; }
.kpi-val strong { font-weight:900; }

.pager { display:flex; align-items:center; justify-content:center; gap:10px; padding:14px; }
.pager .pages { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
.pager-btn, .pager-num {
  min-width:34px; height:34px; padding:0 10px; display:inline-flex; align-items:center; justify-content:center;
  border-radius:8px; border:1px solid var(--border); background:#fff; cursor:pointer; font-weight:700; font-size:13px;
}
.pager-num.active { background:#111827; color:#fff; border-color:#111827; }
.pager-btn[disabled] { opacity:.45; cursor:not-allowed; }
.page-size { margin-left:auto; display:flex; align-items:center; gap:8px; font-size:12px; color:#6b7280; }
.page-size select { border:1px solid var(--border); border-radius:8px; padding:6px 8px; background:#fff; }

@media (max-width: 860px) { .hide-sm { display: none; } }

.wp-topbar{
  position:sticky; top:0; z-index:30;
  display:flex; align-items:center; justify-content:space-between; gap:10px;
  padding:10px 14px; margin:-8px -6px 12px;
  border-bottom:1px solid var(--border); backdrop-filter:blur(8px);
  background:linear-gradient(120deg,rgba(255,255,255,.9),rgba(255,240,255,.85));
  border-radius:12px;
}
.wp-brand{font-weight:900; font-size:16px; letter-spacing:.2px}
.wp-topbtn{padding:8px 12px; border-radius:10px; border:1px solid var(--border); background:#fff; font-weight:700; cursor:pointer}
.wp-topbtn:hover{filter:brightness(1.02)}
.wp-topbtn.danger{background:#ef4444; color:#fff; border-color:#ef4444}
`;

/* ===== 유틸: 스타일 주입 ===== */
function useInjectWPStyle() {
  useEffect(() => {
    if (!document.getElementById(WP_STYLE_ID)) {
      const s = document.createElement("style");
      s.id = WP_STYLE_ID;
      s.textContent = wpCSS;
      document.head.appendChild(s);
    }
  }, []);
}

// 공용 fetch 헬퍼 (에러 본문도 보여주기)
async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} :: ${text.slice(0,200)}`);
  try { return JSON.parse(text); } catch { throw new Error(`Invalid JSON :: ${text.slice(0,200)}`); }
}

// 숫자/표시 유틸
const toInt = (x) => {
  const n = parseInt(String(x ?? '').replace(/[, ]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
};
const fmt = (n) => Number(n || 0).toLocaleString();

// 🔑 날짜 파싱 키: 'YYYY-MM-DD' → time, 파싱 실패는 가장 뒤로 정렬되게 -Infinity
const dateKey = (v) => {
  const s = (v ?? '').toString().slice(0, 10);
  const t = Date.parse(s);
  return Number.isNaN(t) ? -Infinity : t;
};

/* ===== 상단바 ===== */
function TopBar() {
  const nav = useNavigate();
  return (
    <div className="wp-topbar">
      <div className="wp-brand">안녕하세요 곽수연님!</div>
      <div style={{display:'flex', gap:8}}>
        <button className="wp-topbtn">마이페이지</button>
        <button className="wp-topbtn">프로필 수정</button>
        <button className="wp-topbtn danger" onClick={()=> nav('/login')}>로그아웃</button>
      </div>
    </div>
  );
}

function WritePage() {
  useInjectWPStyle();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ 협찬/내돈내산 감지 결과
  // { label: 'sponsored'|'self'|'none'|'' , source?: 'ReviewNote' | ... }
  const [det, setDet] = useState({ label: '', source: '' });

  // ✅ 요약 필터(완료건만)
  const [onlyComplete, setOnlyComplete] = useState(false);

  // ✅ 페이징
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ✅ 선택삭제
  const [selected, setSelected] = useState(() => new Set());

  // 리스트 불러오기 (체험일 내림차순)
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await fetchJson(BASE_URL);
      const arr = Array.isArray(data) ? data : [];
      arr.sort((a, b) => dateKey(b.visitDate) - dateKey(a.visitDate));
      setReviews(arr);
      setPage(1);
      setSelected(new Set());
    } catch (err) {
      console.error('리뷰 불러오기 실패:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchReviews(); }, []);

  // 등록
  const handleSubmit = async (reviewData) => {
    try {
      await fetchJson(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });
      await fetchReviews();
      alert('등록 완료!');
    } catch (error) {
      console.error('🔥 리뷰 등록 실패:', error);
      alert('등록 실패: ' + error.message);
    }
  };

  // 단건 삭제
  const handleDelete = async (id) => {
    if (!id) return alert("id가 없어서 삭제할 수 없습니다. 새로고침 후 다시 시도하세요.");
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await fetchJson(`${BASE_URL}/${id}`, { method: 'DELETE' });
      setReviews(prev => prev.filter(r => r.id !== id));
      setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
      alert("리뷰가 삭제되었습니다!");
    } catch (error) {
      console.error('🔥 리뷰 삭제 실패:', error);
      alert('삭제 실패: ' + error.message);
    }
  };

  // 선택 토글
  const toggleOne = (id) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleAllOnPage = (idsOnPage) => setSelected(prev => {
    const s = new Set(prev);
    const all = idsOnPage.every(id => s.has(id));
    (all ? idsOnPage.forEach(id => s.delete(id)) : idsOnPage.forEach(id => s.add(id)));
    return s;
  });

  // 선택 삭제
  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (!window.confirm(`선택한 ${ids.length}건을 삭제할까요?`)) return;

    let ok = 0, fail = 0;
    for (const id of ids) {
      try { await fetchJson(`${BASE_URL}/${id}`, { method: 'DELETE' }); ok++; }
      catch (e) { console.error('삭제 실패:', id, e); fail++; }
    }
    await fetchReviews();
    alert(`선택 삭제 완료: ${ok}건${fail ? `, 실패 ${fail}건` : ''}`);
  };

  // 요약 계산
  const rowsForCalc = useMemo(
    () => (onlyComplete ? reviews.filter(r => !!r.isComplete) : reviews),
    [reviews, onlyComplete]
  );
  const summary = useMemo(() => {
    let sumSupport = 0, sumPayment = 0, sumSaved = 0;
    rowsForCalc.forEach(r => {
      const sp = toInt(r.supportPrice);
      const pp = toInt(r.paymentPrice);
      sumSupport += sp; sumPayment += pp; sumSaved += Math.max(sp - pp, 0);
    });
    return { count: rowsForCalc.length, sumSupport, sumPayment, sumSaved };
  }, [rowsForCalc]);

  // 페이징
  const totalPages = Math.max(1, Math.ceil(reviews.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pagedReviews = reviews.slice(startIdx, startIdx + pageSize);
  const idsOnPage = pagedReviews.map(r => r.id).filter(Boolean);
  const allSelectedOnPage = idsOnPage.length > 0 && idsOnPage.every(id => selected.has(id));
  const blockStart = Math.floor((currentPage - 1) / 10) * 10 + 1;
  const blockEnd = Math.min(blockStart + 9, totalPages);

  return (
    <div className="wp" id="top">
      <div className="wp-shell">

        {/* ★ 상단바 */}
        <TopBar />

        <header className="wp-header">
          <h1 className="wp-title">블로그 체험단 기록 · Write</h1>
          <p className="wp-sub">리뷰 등록 → 리스트 확인 → 지도에서 한눈에 보기</p>
        </header>
        
        {/* 스폰서 배너 자동 인식 */}
        <section className="wp-card" style={{ marginBottom: 16 }}>
          <div className="wp-card-hd">
            <div className="wp-card-tt">뒷광고 자동 인식</div>
            {det.label === 'sponsored' && (
              <span className="wp-pill">
                감지됨: 협찬{det.source ? ` (${det.source})` : ''}
              </span>
            )}
            {det.label === 'self' && (
              <span className="wp-pill" style={{background:'#dcfce7', color:'#065f46'}}>
                감지됨: 내돈내산
              </span>
            )}
          </div>
          <div className="wp-card-inner">
            <AutoDetectBlock apiBase={API_BASE} onDetect={(summary)=>setDet(summary)} />
            <p className="wp-status">링크를 입력하면 협찬인지 내돈내산인지 인지합니다</p>
          </div>
        </section>

        {/* 엑셀 일괄등록 */}
        <section className="wp-card" style={{ marginBottom: 16 }}>
          <div className="wp-card-inner">
            <BulkUpload apiBase={BASE_URL} onDone={fetchReviews} />
          </div>
        </section>

        

        {/* 폼 */}
        <section className="wp-card">
          <div className="wp-card-hd">
            <div className="wp-card-tt">리뷰 작성</div>
            <span className="wp-badge grad">총 {reviews.length}건</span>
          </div>
          <div className="wp-card-inner">
            <ReviewForm
              onSubmit={handleSubmit}
              detectedPlatform={det.label === 'sponsored' ? (det.source || '') : ''}
            />
          </div>
        </section>

        <div className="wp-sep" />

        {/* 리스트 */}
        <section className="wp-card">
          <div className="wp-card-hd">
            <div className="wp-card-tt">📋 리뷰 리스트</div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span className="wp-badge">선택 {selected.size}건</span>
              <button className="wp-btn danger" onClick={handleBulkDelete} disabled={selected.size === 0}>
                선택 삭제
              </button>
              <span className="wp-badge">총 절약액 ₩{fmt(summary.sumSaved)}</span>
              {loading && <span className="wp-pill">불러오는 중…</span>}
            </div>
          </div>
          <div className="wp-card-inner">
            {reviews.length > 0 ? (
              <>
                <div className="wp-table-wrap">
                  <table className="wp-table">
                    <thead>
                      <tr>
                        <th className="th-check">
                          <input
                            type="checkbox"
                            checked={allSelectedOnPage}
                            onChange={() => toggleAllOnPage(idsOnPage)}
                            aria-label="이번 페이지 전체 선택"
                          />
                        </th>
                        <th>체험단 사이트명</th>
                        <th>가게명</th>
                        <th className="hide-sm">주소</th>
                        <th>부문</th>
                        <th className="hide-sm">지원금</th>
                        <th>체험일</th>
                        <th>완료</th>
                        <th>제출 링크</th>
                        <th>주문</th>
                        <th>절약</th>
                        <th>삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedReviews.map((review) => {
                        const sp = toInt(review.supportPrice);
                        const pp = toInt(review.paymentPrice);
                        const saved = Math.max(sp - pp, 0);
                        const checked = selected.has(review.id);
                        return (
                          <tr key={review.id}>
                            <td className="td-check">
                              <input type="checkbox" checked={checked} onChange={() => toggleOne(review.id)} aria-label="행 선택" />
                            </td>
                            <td>{review.siteName ?? '—'}</td>
                            <td><strong>{review.place}</strong></td>
                            <td className="hide-sm">{review.address}</td>
                            <td><span className="wp-badge grad">{review.category}</span></td>
                            <td className="hide-sm">₩{fmt(sp)}</td>
                            <td>{review.visitDate}</td>
                            <td>{review.isComplete ? '✅' : '❌'}</td>
                            <td>{review.blogLink ? (<a href={review.blogLink} target="_blank" rel="noreferrer" className="wp-link">링크</a>) : '—'}</td>
                            <td>{review.menuType}</td>
                            <td>₩{fmt(saved)}</td>
                            <td><button onClick={() => handleDelete(review.id)} className="wp-btn">삭제</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 페이지네이션 */}
                <div className="pager">
                  <button className="pager-btn" onClick={() => setPage(1)} disabled={currentPage === 1}>« 처음</button>
                  <button className="pager-btn" onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>‹ 이전</button>

                  <div className="pages">
                    {blockStart > 1 && <span className="wp-pill">…</span>}
                    {Array.from({length: blockEnd - blockStart + 1}, (_,i)=>blockStart+i).map(n => (
                      <button key={n} className={`pager-num ${n === currentPage ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
                    ))}
                    {blockEnd < totalPages && <span className="wp-pill">…</span>}
                  </div>

                  <button className="pager-btn" onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>다음 ›</button>
                  <button className="pager-btn" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages}>끝 »</button>

                  <div className="page-size">
                    <span>페이지당</span>
                    <select value={pageSize} onChange={(e)=>{ setPageSize(Number(e.target.value)); setPage(1); }}>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <a href="#top" style={{marginLeft:12, textDecoration:'none', fontWeight:800, color:'#64748b'}}>▲ TOP</a>
                  </div>
                </div>
              </>
            ) : (
              <p className="wp-empty">등록된 리뷰가 없습니다.</p>
            )}
          </div>
        </section>

        <div className="wp-sep" />

        {/* 요약(엑셀 합계) */}
        <section className="wp-card" style={{ marginBottom: 16 }}>
          <div className="wp-card-hd">
            <div className="wp-card-tt">요약 (엑셀 합계)</div>
            <label className="wp-switch" style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={onlyComplete} onChange={(e) => setOnlyComplete(e.target.checked)} />
              <span className="wp-switch-lb">완료건만 포함</span>
            </label>
          </div>
          <div className="wp-card-inner">
            <div className="kpi-grid">
              <div className="kpi-card"><div className="kpi-tt">건수</div><div className="kpi-val"><strong>{fmt(summary.count)}</strong></div></div>
              <div className="kpi-card"><div className="kpi-tt">총 지원금</div><div className="kpi-val">₩<strong>{fmt(summary.sumSupport)}</strong></div></div>
              <div className="kpi-card"><div className="kpi-tt">총 결제금액</div><div className="kpi-val">₩<strong>{fmt(summary.sumPayment)}</strong></div></div>
              <div className="kpi-card"><div className="kpi-tt">총 절약액</div><div className="kpi-val">₩<strong>{fmt(summary.sumSaved)}</strong></div></div>
            </div>
          </div>
        </section>

        {/* 지도 */}
        <section className="wp-card">
          <div className="wp-card-hd"><div className="wp-card-tt">📍 지도에서 보기</div></div>
          <div className="wp-card-inner">
            {reviews.length > 0 ? <KakaoMap records={reviews} /> : <p className="wp-empty">리뷰를 등록하면 지도로 표시됩니다.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ====== 내부 소형 컴포넌트: 배너 자동 인식 블록 ====== */
function AutoDetectBlock({ onDetect, apiBase }) {
  const [blogUrl, setBlogUrl] = useState('');
  const [busy, setBusy] = useState(false);

  // 서버 summary 그대로 전달
  const applyDetectResult = (json) => {
    const s = json?.summary;
    if (!s) return;
    onDetect?.(s); // {label:'sponsored'|'self'|'none', source?}
  };

  async function detectByFile(file, threshold = 6) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('threshold', String(threshold));
    return fetchJson(`${apiBase}/api/detect/banner-file`, { method: 'POST', body: fd });
  }
  async function detectByPage(pageUrl, threshold = 6) {
    return fetchJson(`${apiBase}/api/detect/from-page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: pageUrl, threshold }),
    });
  }

  const runFile = async (f) => {
    if (!f) return;
    setBusy(true);
    try { applyDetectResult(await detectByFile(f, 6)); }
    catch (e) { console.error(e); alert('배너 인식 실패: ' + e.message); }
    finally { setBusy(false); }
  };

  const runBlog = async () => {
    if (!blogUrl.trim()) return;
    setBusy(true);
    try { applyDetectResult(await detectByPage(blogUrl.trim(), 6)); }
    catch (e) { console.error(e); alert('블로그 링크 인식 실패: ' + e.message); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ display:'grid', gap:10 }}>
      

      {/* 블로그 링크 인식 */}
      <div style={{ display:'flex', gap:8 }}>
        <input
          placeholder="블로그 글 URL (예: https://blog.naver.com/...)"
          value={blogUrl}
          onChange={(e)=>setBlogUrl(e.target.value)}
          style={{ flex:1, padding:8, border:'1px solid var(--border)', borderRadius:10 }}
        />
        <button className="wp-btn" onClick={runBlog} disabled={busy}>블로그 링크로 인식</button>
      </div>
    </div>
  );
}

export default WritePage;

