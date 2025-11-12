// src/components/Login.jsx
//로그인파일 임시 데모파일
import React, { useState } from 'react';   // ⬅️ React 명시적으로 import!

export default function Login({ onDone }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');

  const submitLogin = (e) => {
    e.preventDefault();
    onDone?.(); //현재는 인증없음
  };

  const submitSignup = (e) => {
    e.preventDefault();
    if (!email || !pw) return alert('이메일과 비밀번호를 입력해 주세요.');
    if (pw !== pw2) return alert('비밀번호가 일치하지 않습니다.');
    try {
      localStorage.setItem('demoUser', JSON.stringify({ name, email }));
    } catch {}
    onDone?.(); // 데모: 회원가입 후 바로 입음
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(135deg,#eef2ff,#fff0ff)',
      }}
    >
      <form
        onSubmit={mode === 'login' ? submitLogin : submitSignup}
        style={{
          width: 360,
          padding: 24,
          borderRadius: 16,
          background: '#fff',
          boxShadow: '0 12px 32px rgba(0,0,0,.08)',
          display: 'grid',
          gap: 12,
        }}
      >
        {/* 제목 고정 */}
        <h2 style={{ margin: 0 }}>체험단 레코드 로그인</h2>

        {mode === 'signup' && (
          <>
            <label style={{ fontSize: 12, color: '#6b7280' }}>이름 (선택)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              style={{
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
              }}
            />
          </>
        )}

        <label style={{ fontSize: 12, color: '#6b7280' }}>이메일</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          style={{
            padding: '10px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
          }}
        />

        <label style={{ fontSize: 12, color: '#6b7280' }}>비밀번호</label>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="••••••••"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          style={{
            padding: '10px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
          }}
        />

        {mode === 'signup' && (
          <>
            <label style={{ fontSize: 12, color: '#6b7280' }}>비밀번호 확인</label>
            <input
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              style={{
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
              }}
            />
          </>
        )}

        <button
          type="submit"
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: 'none',
            background: '#6366f1',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {mode === 'login' ? '로그인' : '회원가입'}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setPw('');
            setPw2('');
          }}
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            background: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {mode === 'login' ? '아직 계정이 없나요? 회원가입' : '이미 계정이 있나요? 로그인'}
        </button>

        <p style={{ color: '#9ca3af', fontSize: 12, margin: 0, textAlign: 'center' }} />
      </form>
    </div>
  );
}
