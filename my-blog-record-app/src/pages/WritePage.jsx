import React, { useEffect, useState } from 'react';
import ReviewForm from '../components/ReviewForm';
import KakaoMap from '../components/KakaoMap';

function WritePage() {
  const [reviews, setReviews] = useState([]);

  // 🚀 페이지 마운트 시 모든 리뷰 불러오기
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/reviews');
        const data = await res.json();
        setReviews(data); // ✅ 전체 리뷰 state로 저장
      } catch (err) {
        console.error('리뷰 불러오기 실패:', err);
      }
    };

    fetchReviews();
  }, []);

  // ✍️ 리뷰 등록 핸들러
  const handleSubmit = async (reviewData) => {
    console.log('📦 프론트에서 받은 데이터:', reviewData);

    try {
      const response = await fetch('http://localhost:4000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        alert('리뷰가 등록되었습니다!');
        // ✅ 새 리뷰를 reviews 배열에 추가
        setReviews((prev) => [...prev, reviewData]);
      } else {
        console.error('❌ 응답 실패:', response.status);
      }
    } catch (error) {
      console.error('🔥 리뷰 등록 실패:', error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">리뷰 작성</h1>
      <ReviewForm onSubmit={handleSubmit} />

      <h2 className="mt-8 text-xl font-semibold">📍 지도에서 보기</h2>
      {/* ✅ 이제 모든 리뷰를 지도에 표시 */}
      {reviews.length > 0 && <KakaoMap records={reviews} />}
    </div>
  );
}

export default WritePage;
