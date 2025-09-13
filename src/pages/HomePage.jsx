import React, { useEffect, useState } from 'react';
import ReviewCard from '../components/ReviewCard';

function HomePage() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetch('http://localhost:4000/api/reviews')
      .then(res => res.json())
      .then(data => setReviews(data));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">리뷰 목록</h1>
      <div className="grid grid-cols-1 gap-4">
        {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
      </div>
    </div>
  );
}

export default HomePage;
