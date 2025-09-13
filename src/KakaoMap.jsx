import React, { useEffect } from "react";

const KakaoMap = ({ records = [] }) => {
  useEffect(() => {
    // 이미 kakao 스크립트가 로딩되어 있는 경우, 중복 로딩 방지
    if (window.kakao && window.kakao.maps) {
      loadMap();
    } else {
      const script = document.createElement("script");
      script.src =
        "//dapi.kakao.com/v2/maps/sdk.js?appkey=cca675112191f29282761d3066b280e1&autoload=false&libraries=services";
      script.async = true;

      script.onload = () => {
        window.kakao.maps.load(loadMap);
      };

      document.head.appendChild(script);
    }

    function loadMap() {
      const container = document.getElementById("map");
      if (!container) {
        console.error("❌ 'map' DOM 요소가 존재하지 않습니다.");
        return;
      }

      const options = {
        center: new window.kakao.maps.LatLng(36.0, 127.5), // 전국 중심 좌표
        level: 12,
      };

      const map = new window.kakao.maps.Map(container, options);
      const geocoder = new window.kakao.maps.services.Geocoder();

      records.forEach((record) => {
        if (record.address) {
          geocoder.addressSearch(record.address, (result, status) => {
            if (status === window.kakao.maps.services.Status.OK) {
              const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);

              const marker = new window.kakao.maps.Marker({
                map,
                position: coords,
              });

              const infowindow = new window.kakao.maps.InfoWindow({
                content: `<div style="font-size:12px;">${record.store}</div>`,
              });

              marker.addListener("click", () => {
                infowindow.open(map, marker);
              });
            } else {
              console.warn(`⚠️ 주소 검색 실패: ${record.address}`);
            }
          });
        }
      });
    }
  }, [records]);

  return (
    <div>
      <h2 className="text-xl font-bold mt-6 mb-2">📍 지도에서 보기</h2>
      <div
        id="map"
        style={{ width: "100%", height: "400px", border: "1px solid #ccc" }}
      ></div>
    </div>
  );
};

export default KakaoMap;

