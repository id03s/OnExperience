function ReviewCard({ review }) {
  return (
    <div className="border p-4 rounded shadow">
      <h2 className="text-lg font-semibold">{review.place}</h2>
      <p className="text-sm text-gray-600">{review.address}</p>
      <p>{review.category} / {review.menuType}</p>
      <p>{review.supportPrice}원 지원 / {review.paymentPrice}원 결제</p>
      <p>체험일: {review.visitDate} / 완료: {review.isComplete ? '✅' : '❌'}</p>
      <a href={review.blogLink} className="text-blue-500 underline">블로그 리뷰</a>
    </div>
  );
}