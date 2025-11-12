//경로: src/App.jsx
//기본 루트 (삭제금물)
import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import WritePage from './pages/WritePage';

//로그인경로 중간컴포넌트
//로그인 성공시 자동으로 라이트 컴포넌트로 ㄱㄱ
function LoginRoute() {
  const navigate = useNavigate();
  return <Login onDone={() => navigate('/write', { replace: true })} />; 
}

//전체 앱 라우팅 구성 로그인->라이트페이지
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/write" element={<WritePage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
