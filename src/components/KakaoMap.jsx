// src/components/KakaoMap.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/* ====== Inline CSS (가벼운 글래스 UI) ====== */
const KM_STYLE_ID = "km-inline-style-v2";
const kmCSS = `
.km{position:relative;width:100%;min-height:520px;border:1px solid rgba(15,23,42,.08);border-radius:18px;box-shadow:0 10px 24px rgba(28,31,55,.08);overflow:hidden;background:linear-gradient(120deg,#eef2ff,#fff 40%,#fff0ff)}
.km-map{width:100%;height:520px}
.km-top{position:absolute;left:12px;right:12px;top:12px;display:flex;justify-content:space-between;gap:10px;z-index:3}
.km-card{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.9);backdrop-filter:blur(8px);border:1px solid rgba(15,23,42,.08);box-shadow:0 6px 16px rgba(28,31,55,.08)}
.km-title{margin:0;font-size:14px;font-weight:800;background:linear-gradient(90deg,#5b73ff,#b457ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.km-badge{font-size:12px;font-weight:800;padding:6px 10px;border-radius:999px;background:linear-gradient(90deg,#5b73ff,#b457ff);color:#fff;box-shadow:0 8px 18px rgba(91,115,255,.22)}
.km-btn{height:34px;padding:0 12px;border-radius:10px;border:1px solid rgba(15,23,42,.08);background:#fff;font-weight:800;cursor:pointer}
.km-btn:hover{filter:brightness(1.03)}
.km-legend{position:absolute;right:12px;bottom:12px;z-index:3;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,.9);backdrop-filter:blur(8px);border:1px solid rgba(15,23,42,.08);font-size:12px;color:#374151}
.km-loader{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:4;padding:10px 14px;border-radius:12px;background:#111827;color:#fff;font-weight:800;box-shadow:0 10px 24px rgba(0,0,0,.2)}
`;

/* ====== 유틸 ====== */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const escapeHtml = (s = "") =>
  String(s).replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
const escapeAttr = (s = "") => String(s).replace(/"/g, "%22");
const num = (v) => {
  const n = Number(v ?? 0);
  return isNaN(n) ? "0" : n.toLocaleString();
};

/** 레코드 배열 → 주소 기준 유니크 + 의미 없는 값 제거 */
function uniqByAddress(records = []) {
  const map = new Map();
  for (const r of records) {
    const addr = r?.address?.trim();
    if (!addr) continue;
    map.set(addr, r);
  }
  return Array.from(map.values());
}

/** 주소 목록 시그니처 (데이터 변화 감지) */
function signature(list) {
  return JSON.stringify(list.map((r) => r.address).sort());
}

/** localStorage 캐시 */
const LS_PREFIX = "km_geo:";
const getLS = (addr) => {
  try { return JSON.parse(localStorage.getItem(LS_PREFIX + addr) || "null"); } catch { return null; }
};
const setLS = (addr, ll) => {
  try { localStorage.setItem(LS_PREFIX + addr, JSON.stringify(ll)); } catch {}
};

export default function KakaoMap({
  records = [],
  appkey = "eb46d70dcce4c3347f6e67a7afcfa896",
  maxConcurrency = 5,        // 동시 지오코딩 개수
  stepDelay = 40,            // 각 요청 사이 지연(ms)
  clusterThreshold = 80,     // 이 개수 이상이면 클러스터 사용
}) {
  /* CSS 1회 주입 */
  useEffect(() => {
    if (!document.getElementById(KM_STYLE_ID)) {
      const el = document.createElement("style");
      el.id = KM_STYLE_ID;
      el.textContent = kmCSS;
      document.head.appendChild(el);
    }
  }, []);

  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const geocoderRef = useRef(null);
  const clustererRef = useRef(null);
  const markersRef = useRef([]);
  const infoRef = useRef(null);

  // 지오코딩 캐시(세션 동안 유지)
  const geoCache = useRef(new Map());
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const runIdRef = useRef(0);          // 최신 실행 식별자
  const prevSigRef = useRef("");       // 이전 시그니처

  const items = useMemo(() => uniqByAddress(records), [records]);
  const sig = useMemo(() => signature(items), [items]);

  // SDK 로드 & 기본 객체 준비
  useEffect(() => {
    const init = () => {
      if (!containerRef.current) return;
      const kakao = window.kakao;
      const map = new kakao.maps.Map(containerRef.current, {
        center: new kakao.maps.LatLng(36.5, 127.5),
        level: 12,
      });
      mapRef.current = map;
      geocoderRef.current = new kakao.maps.services.Geocoder();
      infoRef.current   = new kakao.maps.InfoWindow({ zIndex: 3 });
      setReady(true);
    };

    if (!window.kakao || !window.kakao.maps) {
      const script = document.createElement("script");
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&autoload=false&libraries=services,clusterer`;
      script.async = true;
      script.onload = () => window.kakao.maps.load(init);
      document.head.appendChild(script);
    } else {
      window.kakao.maps.load(init);
    }
  }, [appkey]);

  // 메인: 지오코딩 + 마커 추가(성능 최적화)
  useEffect(() => {
    if (!ready || !mapRef.current || !geocoderRef.current) return;

    // 데이터 변화 없으면 패스
    if (prevSigRef.current === sig) return;
    prevSigRef.current = sig;

    // 이전 작업 무효화
    const myRun = ++runIdRef.current;

    const kakao = window.kakao;
    const map = mapRef.current;
    const geocoder = geocoderRef.current;

    // 정리
    if (clustererRef.current) clustererRef.current.clear();
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    setLoading(true);

    // 필요한 경우에만 클러스터러 생성
    const useCluster = items.length >= clusterThreshold;
    if (useCluster) {
      clustererRef.current = new kakao.maps.MarkerClusterer({
        map,
        averageCenter: true,
        minLevel: 7,
      });
    } else {
      clustererRef.current = null;
    }

    const bounds = new kakao.maps.LatLngBounds();

    // 지오코딩 함수(캐시 사용)
    const geocodeAddress = (addr) =>
      new Promise((resolve) => {
        if (!addr) return resolve(null);

        // 1) 메모리 캐시
        if (geoCache.current.has(addr)) return resolve(geoCache.current.get(addr));
        // 2) localStorage
        const ls = getLS(addr);
        if (ls && typeof ls.lat === "number" && typeof ls.lng === "number") {
          geoCache.current.set(addr, ls);
          return resolve(ls);
        }
        // 3) API 호출
        geocoder.addressSearch(addr, (result, status) => {
          if (status === kakao.maps.services.Status.OK && result[0]) {
            const ll = { lat: Number(result[0].y), lng: Number(result[0].x) };
            geoCache.current.set(addr, ll);
            setLS(addr, ll);
            resolve(ll);
          } else {
            console.warn("❌ 주소 검색 실패:", addr);
            resolve(null);
          }
        });
      });

    // 동시성 제한 풀
    const concurrency = Math.max(1, Math.min(10, maxConcurrency));
    let idx = 0;
    const results = new Array(items.length).fill(null);

    const worker = async () => {
      while (idx < items.length && runIdRef.current === myRun) {
        const cur = idx++;
        const rec = items[cur];
        const addr = rec.address?.trim();
        if (!addr) { results[cur] = null; continue; }
        const ll = await geocodeAddress(addr);
        results[cur] = ll;
        if (stepDelay) await wait(stepDelay); // 과도한 폭주 방지
      }
    };

    (async () => {
      // 워커 실행
      const workers = Array.from({ length: concurrency }, () => worker());
      await Promise.all(workers);
      if (runIdRef.current !== myRun) return; // 최신 실행만 유지

      // 좌표 유효한 것만 선택
      const markers = [];
      for (let i = 0; i < items.length; i++) {
        const rec = items[i];
        const ll = results[i];
        if (!ll) continue;

        // 살짝 지터로 겹침 최소화(매우 작게)
        const pos = new kakao.maps.LatLng(ll.lat + (Math.random()-0.5)*0.00015, ll.lng + (Math.random()-0.5)*0.00015);

        const marker = new kakao.maps.Marker({ position: pos, title: rec.place || "" });

        kakao.maps.event.addListener(marker, "click", () => {
          const html = `
            <div style="min-width:220px;max-width:260px;padding:10px 12px;border-radius:12px;border:1px solid rgba(15,23,42,.08);background:#fff;box-shadow:0 8px 18px rgba(0,0,0,.12);">
              <div style="font-weight:800;margin-bottom:6px">${escapeHtml(rec.place || "-")}</div>
              <div style="color:#6b7280;font-size:12px;margin-bottom:8px">${escapeHtml(rec.address || "-")}</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
                ${rec.category ? `<span style="font-size:11px;padding:4px 8px;border-radius:999px;background:linear-gradient(90deg,#5b73ff,#b457ff);color:#fff;font-weight:800"> ${escapeHtml(rec.category)} </span>` : ""}
                ${rec.menuType ? `<span style="font-size:11px;padding:4px 8px;border-radius:999px;background:#f3f4ff;color:#3442b8;font-weight:800"> ${escapeHtml(rec.menuType)} </span>` : ""}
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:12px;margin-bottom:8px">
                <span style="background:#f8fafc;border:1px solid #edf2f7;padding:4px 8px;border-radius:10px">지원 <b>₩${num(rec.supportPrice)}</b></span>
                <span style="background:#f8fafc;border:1px solid #edf2f7;padding:4px 8px;border-radius:10px">결제 <b>₩${num(rec.paymentPrice)}</b></span>
              </div>
              ${rec.blogLink ? `<a href="${escapeAttr(rec.blogLink)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-decoration:none;font-weight:800;font-size:12px;padding:8px 10px;border-radius:10px;background:linear-gradient(90deg,#5b73ff,#b457ff);color:#fff">블로그 리뷰 보기</a>` : ""}
            </div>
          `;
          infoRef.current.setContent(html);
          infoRef.current.open(map, marker);
        });

        markers.push(marker);
        bounds.extend(pos);
      }

      // 렌더링: 한 번에 추가 → 렉 최소화
      if (markers.length) {
        markersRef.current = markers;
        if (clustererRef.current) {
          clustererRef.current.addMarkers(markers);
        } else {
          markers.forEach((m) => m.setMap(map));
        }
        map.setBounds(bounds);
      }

      setLoading(false);
    })();

    // cleanup: 실행 중 다른 데이터가 오면 이전 마커/클러스터 정리는 다음 사이클에서 처리됨
    // 여기선 별도 return 불필요
  }, [sig, items, ready, maxConcurrency, stepDelay, clusterThreshold]);

  // 컨트롤
  const fitAll = () => {
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!map || !markersRef.current.length) return;
    const b = new kakao.maps.LatLngBounds();
    markersRef.current.forEach((m) => b.extend(m.getPosition()));
    map.setBounds(b);
  };

  const goMyLocation = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const kakao = window.kakao;
        const pos = new kakao.maps.LatLng(coords.latitude, coords.longitude);
        mapRef.current.setLevel(4);
        mapRef.current.panTo(pos);
      },
      () => alert("현재 위치를 가져올 수 없어요.")
    );
  };

  return (
    <div className="km">
      <div className="km-top">
        <div className="km-card">
          <h3 className="km-title">체험단 지도</h3>
          <span className="km-badge">표시 {items.length}곳</span>
        </div>
        <div className="km-card" style={{gap:8}}>
          <button className="km-btn" onClick={fitAll}>전체 보기</button>
          <button className="km-btn" onClick={goMyLocation}>내 위치</button>
        </div>
      </div>

      <div ref={containerRef} className="km-map" />

      <div className="km-legend">
        • 클릭: 상세 정보창, 휠/드래그: 확대·이동<br/>
        • 마커가 많으면 자동 클러스터링
      </div>

      {loading && <div className="km-loader">주소 변환 중…</div>}
    </div>
  );
}
