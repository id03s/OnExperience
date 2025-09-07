import React, { useState } from 'react';

function ReviewForm({ onSubmit }) {
  const [form, setForm] = useState({
    place: '',
    address: '',
    category: '',
    supportPrice: '',
    visitDate: '',
    paymentPrice: '',
    blogLink: '',
    menuType: '',
    isComplete: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 🔧 숫자 필드 변환: 비어 있으면 0 처리
    const parsedForm = {
      ...form,
      supportPrice: Number(form.supportPrice || 0),
      paymentPrice: Number(form.paymentPrice || 0),
    };

    // ✅ 디버깅 로그
    console.log('📝 제출된 데이터:', parsedForm);

    onSubmit(parsedForm);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
      <input name="place" value={form.place} onChange={handleChange} placeholder="가게명" className="border p-1" required />
      <input name="address" value={form.address} onChange={handleChange} placeholder="주소" className="border p-1" required />
      <input name="category" value={form.category} onChange={handleChange} placeholder="업종 (예: 냉삼)" className="border p-1" required />
      <input name="menuType" value={form.menuType} onChange={handleChange} placeholder="음식 종류 (예: 한식)" className="border p-1" required />
      
      {/* 숫자 입력 필드: type="number" */}
      <input type="number" name="supportPrice" value={form.supportPrice} onChange={handleChange} placeholder="지원금" className="border p-1" required />
      <input type="number" name="paymentPrice" value={form.paymentPrice} onChange={handleChange} placeholder="결제 금액" className="border p-1" required />

      <input name="visitDate" value={form.visitDate} onChange={handleChange} placeholder="체험일 (예: 5월)" className="border p-1" required />
      <input name="blogLink" value={form.blogLink} onChange={handleChange} placeholder="블로그 링크" className="border p-1" required />

      <label className="flex items-center">
        <input type="checkbox" name="isComplete" checked={form.isComplete} onChange={handleChange} className="mr-1" />
        완료 여부
      </label>

      <button type="submit" className="bg-gray-700 text-white px-3 py-1">등록</button>
    </form>
  );
}

export default ReviewForm;

