import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import MainPage from "./MainPage";
import WritePage from "./pages/WritePage";
import Login from "./components/Login";     // ★ 추가

function LoginPage() {                      // ★ 추가
  const nav = useNavigate();
  return <Login onDone={() => nav("/write")} />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* (A) 로그인 페이지 추가 */}
        <Route path="/login" element={<LoginPage />} />

        {/* (B) 우리가 쓰던 페이지 */}
        <Route path="/write" element={<WritePage />} />

        {/* (C) 기존 메인 유지 — /login으로 바로 가게 하려면 아래 한 줄로 교체 */}
        <Route path="/" element={<MainPage />} />

        {/* 만약 첫 화면부터 로그인으로 가고 싶으면 위 줄 대신 이 줄 사용:
            <Route path="/" element={<Navigate to="/login" replace />} />
        */}
      </Routes>
    </Router>
  );
}

export default App;

