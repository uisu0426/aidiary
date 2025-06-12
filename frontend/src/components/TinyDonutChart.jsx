import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement } from 'chart.js';

ChartJS.register(ArcElement);

function TinyDonutChart({ percentage }) {
  const data = {
    datasets: [
      {
        data: [percentage, 100 - percentage],
        backgroundColor: ['#34d399', '#e5e7eb'], // green, gray
        borderWidth: 0,
      },
    ],
  };

  const options = {
    cutout: '70%',
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    responsive: false,
    maintainAspectRatio: false,
  };

  return (
    <div style={{ width: 30, height: 30 }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}

export default TinyDonutChart;