import React, { useEffect, useRef, useState } from 'react';

const KakaoMap = ({ records = [] }) => {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const geocoderRef = useRef(null);
  const [ready, setReady] = useState(false); // ✅ 초기화 완료 여부

  useEffect(() => {
    const initMap = () => {
      const container = document.getElementById('map');
      if (!container) return;

      const map = new window.kakao.maps.Map(container, {
        center: new window.kakao.maps.LatLng(36.5, 127.5),
        level: 12,
      });

      mapRef.current = map;
      geocoderRef.current = new window.kakao.maps.services.Geocoder();
      setReady(true); // ✅ 지도 + 지오코더 초기화 완료
    };

    if (!window.kakao || !window.kakao.maps) {
      const script = document.createElement('script');
      script.src =
        '//dapi.kakao.com/v2/maps/sdk.js?appkey=eb46d70dcce4c3347f6e67a7afcfa896&autoload=false&libraries=services';
      script.async = true;
      script.onload = () => window.kakao.maps.load(initMap);
      document.head.appendChild(script);
    } else {
      window.kakao.maps.load(initMap);
    }
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || !geocoderRef.current) return;

    const map = mapRef.current;
    const geocoder = geocoderRef.current;
    const bounds = new window.kakao.maps.LatLngBounds();

    // ✅ 중복 주소 제거
    const uniqueRecords = Array.from(
      new Map(records.map((r) => [r.address, r])).values()
    );

    // 이전 마커 제거
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const geocodePromises = uniqueRecords.map((record) => {
      return new Promise((resolve) => {
        const address = record.address?.trim();
        if (!address) return resolve(null);

        geocoder.addressSearch(address, (result, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
            const marker = new window.kakao.maps.Marker({
              map,
              position: coords,
            });

            markersRef.current.push(marker);
            bounds.extend(coords);
            resolve(coords);
          } else {
            console.warn("❌ 주소 검색 실패:", address);
            resolve(null);
          }
        });
      });
    });

    Promise.all(geocodePromises).then((results) => {
      const valid = results.filter((r) => r !== null);
      console.log("✅ 마커 찍힌 개수:", valid.length);

      if (valid.length > 0) {
        map.setBounds(bounds);
      }
    });
  }, [records, ready]); // ✅ ready 의존성 추가

  return <div id="map" style={{ width: '100%', height: '500px' }} />;
};

export default KakaoMap;
