import React, { useState, useEffect } from "react";
import { db } from "./firebase"; // firebase 연결파일 따로 필요함
import { collection, addDoc, getDocs } from "firebase/firestore";
import KakaoMap from "./KakaoMap";

function App() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    siteName: "",
    store: "",
    address: "",
    category: "",
    support: "",
    date: "",
    done: false,
    cost: "",
    link: "",
    menu: "",
    type: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, "records"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRecords(data);
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "records"), form);
    alert("등록 완료!");
    window.location.reload();
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">블로그 체험단 기록</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mb-6">
        <input name="siteName" placeholder="사이트명" onChange={handleChange} className="border p-2" />
        <input name="store" placeholder="협찬가게" onChange={handleChange} className="border p-2" />
        <input name="address" placeholder="주소" onChange={handleChange} className="border p-2" />
        <input name="category" placeholder="부문 (블로그/인스타)" onChange={handleChange} className="border p-2" />
        <input name="support" placeholder="지원금 (숫자만)" onChange={handleChange} className="border p-2" />
        <input name="date" placeholder="언제 갔는지 (ex. 5월)" onChange={handleChange} className="border p-2" />
        <input name="cost" placeholder="얼마 썼는지" onChange={handleChange} className="border p-2" />
        <input name="link" placeholder="리뷰 링크" onChange={handleChange} className="border p-2" />
        <input name="menu" placeholder="뭘 주문했는지" onChange={handleChange} className="border p-2" />
        <input name="type" placeholder="종류 (한식,카페 등)" onChange={handleChange} className="border p-2" />
        <label className="col-span-2">
          <input type="checkbox" name="done" onChange={handleChange} className="mr-2" /> 완료 여부
        </label>
        <button type="submit" className="col-span-2 bg-blue-500 text-white py-2 rounded">등록</button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th>사이트</th><th>가게</th><th>주소</th><th>부문</th><th>지원금</th><th>체험일</th><th>완료</th><th>지출</th><th>링크</th><th>주문</th><th>종류</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="text-center border-b">
                <td>{r.siteName}</td><td>{r.store}</td><td>{r.address}</td><td>{r.category}</td><td>{r.support}</td>
                <td>{r.date}</td><td>{r.done ? "O" : "X"}</td><td>{r.cost}</td>
                <td><a href={r.link} className="text-blue-500" target="_blank">링크</a></td>
                <td>{r.menu}</td><td>{r.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <KakaoMap records={records} />
    </div>
  );
}

export default App;