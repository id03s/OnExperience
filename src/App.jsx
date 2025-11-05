// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import WritePage from './pages/WritePage';

function LoginRoute() {
  const navigate = useNavigate();
  return <Login onDone={() => navigate('/write', { replace: true })} />;  // ⬅️ 여기서 이동
}

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
