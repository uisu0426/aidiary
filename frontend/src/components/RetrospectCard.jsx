import React from 'react';
import EmotionChart from './EmotionChart';

function RetrospectCard({ data }) {
  if (!data) return null;

  const { average_happiness, summary, insight, emotion_summary } = data;
  const { joy, anger, sadness, pleasure } = emotion_summary || {};

  return (
    <div className="w-full bg-gray-100 p-4 rounded shadow">
      <p className="mb-2">💡 평균 행복지수: <strong>{average_happiness}%</strong></p>

      <div className="mb-4">
        <EmotionChart
          joy={joy}
          anger={anger}
          sadness={sadness}
          pleasure={pleasure}
          happiness_score={average_happiness}
        />
      </div>

      <p className="font-semibold">📝 요약:</p>
      <p className="text-gray-700 mb-2 whitespace-pre-wrap">{summary}</p>

      {insight && (
        <>
          <p className="font-semibold">🔍 인사이트:</p>
          <p className="text-gray-700 mb-2 whitespace-pre-wrap">{insight}</p>
        </>
      )}
    </div>
  );
}

export default RetrospectCard;