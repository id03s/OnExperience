// src/components/BulkUpload.jsx
import React, { useRef, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';

export default function BulkUpload({ apiBase, onDone }) {
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState([]);
  const [status, setStatus] = useState('');
  const [onlyComplete, setOnlyComplete] = useState(false); // ✅ 계산기 필터

  // ========== 공통 유틸 ==========
  const toInt = (x) => {
    const n = parseInt(String(x ?? '').replace(/[, ]/g, ''), 10);
    return Number.isFinite(n) ? n : 0;
  };
  const fmt = (n) => Number(n || 0).toLocaleString();

  const cleanKey = (k = '') =>
    String(k).replace(/\uFEFF/g, '').trim().toLowerCase();

  const pick = (row = {}, candidates = []) => {
    const map = {};
    Object.keys(row).forEach(k => (map[cleanKey(k)] = row[k]));
    for (const c of candidates) {
      const v = map[cleanKey(c)];
      if (v !== undefined && v !== null && String(v).trim() !== '') return v;
    }
    return '';
  };

  const parseExcel = async (file) => {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
    setPreview(json);
  };

  const handlePick = () => fileRef.current?.click();

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    parseExcel(f);
  };

  // 엑셀 날짜(일련값) -> YYYY-MM-DD
  const excelDateToISO = (v) => {
    if (typeof v === 'number') {
      const d = XLSX.SSF.parse_date_code(v);
      if (d) {
        const m = String(d.m).padStart(2, '0');
        const day = String(d.d).padStart(2, '0');
        return `${d.y}-${m}-${day}`;
      }
    }
    const s = String(v || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    return s.substring(0, 10);
  };

  // ✅ SiteName 포함, 다양한 한/영 변형 허용
  const normalizeRow = (r = {}) => {
    const toBool = (x) => /^(true|1|y|yes|완료)$/i.test(String(x).trim());
    return {
      siteName: pick(r, ['SiteName','siteName','sitename','사이트명','플랫폼','체험단명']),
      place: pick(r, ['place','PLACE','가게명','업소명','상호명']),
      address: pick(r, ['address','주소','소재지','소재지(도로명)','소재지(지번)']),
      category: pick(r, ['category','카테고리','업종','업종명']),
      supportPrice: toInt(pick(r, ['supportPrice','지원금','지원금액'])),
      visitDate: excelDateToISO(pick(r, ['visitDate','방문일','방문일자','date'])),
      paymentPrice: toInt(pick(r, ['paymentPrice','지출금액','결제금액'])),
      blogLink: pick(r, ['blogLink','블로그링크','링크','url']),
      menuType: pick(r, ['menuType','menuTypes','메뉴','주문메뉴']),
      isComplete: toBool(pick(r, ['isComplete','완료여부','완료'])),
    };
  };

  const normalizedRows = useMemo(() => preview.map(normalizeRow), [preview]);

  const calcSummary = (rows = [], { onlyComplete = false } = {}) => {
    let count = 0, sumSupport = 0, sumPayment = 0, sumSaved = 0;
    rows.forEach(r => {
      if (onlyComplete && !r.isComplete) return;
      count += 1;
      sumSupport += toInt(r.supportPrice);
      sumPayment += toInt(r.paymentPrice);
      sumSaved  += Math.max(toInt(r.supportPrice) - toInt(r.paymentPrice), 0);
    });
    return { count, sumSupport, sumPayment, sumSaved };
  };

  const summary = useMemo(
    () => calcSummary(normalizedRows, { onlyComplete }),
    [normalizedRows, onlyComplete]
  );

  const handleUpload = async () => {
    if (!preview.length) return setStatus('파일을 먼저 선택해주세요.');
    const rows = normalizedRows;

    const missing = rows.filter(r => !r.place || !r.visitDate);
    if (missing.length) return setStatus(`필수값(place, visitDate) 누락 ${missing.length}건. 엑셀 확인!`);

    setStatus('업로드 중...');
    try {
      const res = await fetch(`${apiBase}/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows)
      });
      const data = await res.json();
      if (!res.ok || data?.ok === false) throw new Error(data?.message || '업로드 실패');
      setStatus(`완료! ${data.inserted ?? rows.length}건 등록 (총 절약액 ${fmt(calcSummary(rows, { onlyComplete:false }).sumSaved)}원)`);
      onDone?.();
    } catch (e) {
      setStatus(`에러: ${e.message}`);
    }
  };

  // ✅ 템플릿 다운로드 (서버에서 바로 내려받기)
  const downloadUrl = 'http://localhost:4000/api/template/reviews-bulk';

  return (
    <section className="wp-card">
      <div className="wp-card-hd">
        <div className="wp-card-tt">엑셀 일괄등록</div>
        {/* ✅ 클릭 시 브라우저 다운로드 폴더에 저장 */}
        <a className="wp-btn" href={downloadUrl}>
          템플릿 받기
        </a>
      </div>

      <div className="wp-card-inner">
        {/* 파일 입력 */}
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFile}
          className="wp-hide"
          aria-hidden="true"
        />

        {/* 계산기 블록 */}
        {normalizedRows.length > 0 && (
          <div className="wp-card" style={{ marginBottom: 12 }}>
            <div className="wp-card-hd">
              <div className="wp-card-tt">계산기 (엑셀 합계)</div>
              <label className="wp-switch" style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input
                  type="checkbox"
                  checked={onlyComplete}
                  onChange={(e) => setOnlyComplete(e.target.checked)}
                />
                <span className="wp-switch-lb">완료건만 포함</span>
              </label>
            </div>
            <div className="wp-card-inner">
              <div className="wp-grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="wp-kpi">
                  <div className="wp-kpi-tt">건수</div>
                  <div className="wp-kpi-val">{fmt(summary.count)}</div>
                </div>
                <div className="wp-kpi">
                  <div className="wp-kpi-tt">총 지원금</div>
                  <div className="wp-kpi-val">{fmt(summary.sumSupport)} 원</div>
                </div>
                <div className="wp-kpi">
                  <div className="wp-kpi-tt">총 결제금액</div>
                  <div className="wp-kpi-val">{fmt(summary.sumPayment)} 원</div>
                </div>
                <div className="wp-kpi">
                  <div className="wp-kpi-tt">총 절약액</div>
                  <div className="wp-kpi-val">{fmt(summary.sumSaved)} 원</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 액션 */}
        <div className="wp-actions">
          <button className="wp-btn" onClick={handlePick}>파일 선택</button>
          <button className="wp-btn grad" onClick={handleUpload}>업로드</button>
          <span className="wp-pill">{fileName || '선택된 파일 없음'}</span>
          {preview.length > 0 && <span className="wp-pill">미리보기 {preview.length}행</span>}
        </div>

        {status && <div className="wp-status">{status}</div>}
      </div>
    </section>
  );
}
