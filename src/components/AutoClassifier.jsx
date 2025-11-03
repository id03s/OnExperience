import React, { useState } from 'react';

const API = 'http://localhost:4000/api/analyze';

export default function AutoClassifier() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await fetch(`${API}?url=${encodeURIComponent(url)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '분석 실패');
      setData(json);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-2xl shadow">
      <h2 className="text-2xl font-bold mb-4">블로그 내돈내산 자동탐지 (보수모드)</h2>

      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 border rounded-lg px-3 py-2"
          placeholder="블로그 홈 URL (예: https://blog.naver.com/yourid 또는 https://xxx.tistory.com)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          onClick={handleAnalyze}
          className="px-4 py-2 rounded-lg bg-black text-white"
          disabled={loading}
        >
          {loading ? '분석 중...' : '분석'}
        </button>
      </div>

      {error && <div className="text-red-600 mb-2">{error}</div>}

      {data && (
        <div>
          <div className="text-sm text-gray-500 mb-2">총 {data.count}건</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 border">제목</th>
                  <th className="p-2 border">라벨</th>
                  <th className="p-2 border">신뢰도</th>
                  <th className="p-2 border">링크</th>
                  <th className="p-2 border">근거(최대 8개)</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(data.results) && data.results.map((r, i) => (
                  <tr key={i}>
                    <td className="p-2 border align-top max-w-[360px] break-words">
                      {r.title || '(제목 없음)'}
                    </td>
                    <td className="p-2 border align-top">
                      <span className={r.label === 'SelfPaid' ? 'text-blue-600 font-semibold' : 'text-gray-600'}>
                        {r.label}
                      </span>
                    </td>
                    <td className="p-2 border align-top">
                      {typeof r.confidence === 'number' ? `${Math.round(r.confidence * 100)}%` : '-'}
                    </td>
                    <td className="p-2 border align-top">
                      {r.link ? (
                        <a className="underline" href={r.link} target="_blank" rel="noreferrer">열기</a>
                      ) : '-'}
                    </td>
                    <td className="p-2 border align-top">
                      {Array.isArray(r.evidence) && r.evidence.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1">
                          {r.evidence.map((e, j) => (
                            <li key={j}>
                              <code className="bg-gray-100 px-1 rounded">{e.kw}</code>
                              {e && e.negated ? ' (부정문맥·반전)' : ''}
                              {e && e.flip ? ' → 점수반전' : ''}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-gray-500">
                          명시적 자부담(내돈내산) 표현을 찾지 못했습니다.
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-xs text-gray-500 mt-2">
              * 보수모드: ‘내돈내산/광고 아님’ 등 명시 문구 있을 때만 SelfPaid, 그 외는 Unknown.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
