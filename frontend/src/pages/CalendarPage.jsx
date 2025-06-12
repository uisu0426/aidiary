import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import EmotionChart from '../components/EmotionChart';
import RetrospectCard from '../components/RetrospectCard';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import TopRightNav from '../components/TopRightNav';

ChartJS.register(ArcElement, Tooltip);

function CalendarPage() {
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [retrospectData, setRetrospectData] = useState(null);
  const [loadingRetrospect, setLoadingRetrospect] = useState(false);
  const token = localStorage.getItem('access_token');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/diary/entries/', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => setEntries(res.data));
  }, []);

  const getEntriesByDate = (date) =>
    entries.filter(entry =>
      new Date(entry.created_at).toDateString() === date.toDateString()
    );

  const getAverageHappiness = (dayEntries) => {
    if (dayEntries.length === 0) return 0;
    const total = dayEntries.reduce((sum, e) => sum + (e.happiness_score || 0), 0);
    return (total / dayEntries.length).toFixed(1);
  };


  const getTileClassName = ({ date, view }) => {
    if (view !== 'month') return '';
    const day = date.getDay();
    if (day === 0) return 'text-red-500 font-bold';
    if (day === 6) return 'text-blue-500 font-bold';
    return '';
  };

  const getTileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayEntries = getEntriesByDate(date);
      if (dayEntries.length > 0) {
        const avg = getAverageHappiness(dayEntries);
        const data = {
          datasets: [{
            data: [avg, 100 - avg],
            backgroundColor: ['#34d399', '#e5e7eb'],
            borderWidth: 0
          }]
        };
        const options = {
          cutout: '70%',
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
        };
        return (
          <div className="w-6 h-6 mx-auto mt-1">
            <Doughnut data={data} options={options} />
          </div>
        );
      }
    }
    return null;
  };

  const handleDateClick = (value) => {
    setSelectedDate(value);
  };

  const handleGenerateRetrospect = async () => {
    try {
      setLoadingRetrospect(true);
  
      const res = await api.get('/diary/retrospect/', {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      console.log('회고록 응답:', res.data);  // ✅ 콘솔에 API 응답 출력
  
      setRetrospectData(res.data);
    } catch (error) {
      console.error('회고록 생성 실패:', error);  // ✅ 오류 로그 출력
      alert('회고록 생성 실패');
    } finally {
      setLoadingRetrospect(false);
    }
  };

  return (
    <div className="pt-20 px-6 max-w-6xl mx-auto">
      <TopRightNav />
  
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">나의 일기 - 캘린더</h2>
      </div>
  
      <div className="flex flex-col lg:flex-row gap-8">
        {/* 캘린더 영역 */}
        <div className="lg:w-1/3">
          <Calendar
            onChange={handleDateClick}
            value={selectedDate}
            tileContent={getTileContent}
            tileClassName={getTileClassName}
            calendarType="gregory"
            formatShortWeekday={(locale, date) =>
              ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
            }
          />
        </div>
  
        {/* 회고록 박스 */}
        <div className="lg:w-2/3 border border-gray-300 rounded p-4 h-fit">
          <div className="mb-4">
            <button
              onClick={handleGenerateRetrospect}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              {loadingRetrospect ? '생성 중...' : '📘 회고록 생성'}
            </button>
          </div>
          {retrospectData ? (
            <RetrospectCard data={retrospectData} />
          ) : (
            <div className="text-gray-400">회고록이 여기에 표시됩니다.</div>
          )}
        </div>
      </div>
  
      {/* ✅ 선택 날짜의 일기들 - 전체 가로 폭으로 출력 */}
      {selectedDate && (() => {
        const dayEntries = getEntriesByDate(selectedDate);
        const avg = getAverageHappiness(dayEntries);
        const formattedDate = `${selectedDate.getFullYear()}. ${selectedDate.getMonth() + 1}. ${selectedDate.getDate()}.`;
  
        if (dayEntries.length === 0) {
          return (
            <div className="mt-10 text-gray-500 text-lg font-medium">
              {formattedDate} 작성된 일기가 없습니다.
            </div>
          );
        }
  
        return (
          <div className="mt-10 space-y-4">
            <h3 className="text-xl font-bold">
              {formattedDate} 일기
            </h3>
            
  
            {dayEntries.map((entry) => (
              <div key={entry.id} className="p-4 border rounded shadow space-y-2">
                <div className="text-sm text-gray-500">
                  작성 시간: {new Date(entry.created_at).toLocaleTimeString('ko-KR')}
                </div>
                <div className="flex gap-4 flex-col lg:flex-row">
                  <div className="lg:w-2/3">
                    <p className="whitespace-pre-wrap">{entry.generated_diary}</p>
                  </div>
                  <div className="lg:w-1/3">
                    <EmotionChart
                      joy={entry.joy}
                      anger={entry.anger}
                      sadness={entry.sadness}
                      pleasure={entry.pleasure}
                      happiness_score={entry.happiness_score}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

export default CalendarPage;