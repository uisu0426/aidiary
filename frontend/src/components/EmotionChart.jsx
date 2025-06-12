import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const EmotionChart = ({ joy, anger, sadness, pleasure, happiness_score }) => {
  const emotionData = {
    labels: ['기쁨', '분노', '슬픔', '즐거움'],
    datasets: [
      {
        data: [joy, anger, sadness, pleasure],
        backgroundColor: ['#facc15', '#ef4444', '#3b82f6', '#10b981'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    plugins: { legend: { display: false } },
    cutout: '50%',
    responsive: true,
    maintainAspectRatio: false,
  };

  const emotionLabels = [
    { label: '기쁨', value: joy, color: '#facc15' },
    { label: '슬픔', value: sadness, color: '#3b82f6' },
    { label: '분노', value: anger, color: '#ef4444' },
    { label: '즐거움', value: pleasure, color: '#10b981' },
  ];

  return (
    <div className="flex flex-col w-full space-y-2">
      {/* 행복지수 */}
      <div>
        <p className="font-semibold mb-1">행복지수: {happiness_score}%</p>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-green-400 h-4 rounded-full"
            style={{ width: `${happiness_score}%` }}
          />
        </div>
      </div>

      {/* 도넛차트 + 감정 레이블 */}
      <div className="flex items-center">
        {/* 도넛 */}
        <div className="w-20 h-20 relative">
          <Doughnut data={emotionData} options={chartOptions} />
        </div>

        {/* 레이블 */}
        <div className="ml-4 text-sm space-y-1">
          {emotionLabels.map((item) => (
            <div key={item.label} className="flex items-center space-x-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              ></span>
              <span className="text-gray-800 font-medium">
                {item.label}: {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmotionChart;