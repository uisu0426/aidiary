import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../../api/axios';
import RetrospectCard from '../RetrospectCard';
import '../../styles/CalendarRangeHighlight.css';

const RetrospectTab = () => {
  const [mode, setMode] = useState('recent'); // 'recent' or 'range'
  const [recentRetrospects, setRecentRetrospects] = useState({ week: null, month: null, year: null });
  const [customRetrospect, setCustomRetrospect] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    if (mode === 'recent') {
      fetchRecentRetrospects();
    }
  }, [mode]);

  const fetchRecentRetrospects = async () => {
    try {
      setLoading(true);
      const [weekRes, monthRes, yearRes] = await Promise.all([
        api.get('/diary/retrospect/', {
          headers: { Authorization: `Bearer ${token}` },
          params: { period: '7d' }
        }),
        api.get('/diary/retrospect/', {
          headers: { Authorization: `Bearer ${token}` },
          params: { period: '1m' }
        }),
        api.get('/diary/retrospect/', {
          headers: { Authorization: `Bearer ${token}` },
          params: { period: '1y' }
        })
      ]);
      setRecentRetrospects({
        week: weekRes.data,
        month: monthRes.data,
        year: yearRes.data
      });
    } catch (err) {
      console.error('회고록 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRangeRetrospect = async () => {
    if (!startDate || !endDate) {
      alert('시작일과 종료일을 모두 선택해주세요.');
      return;
    }

    if (startDate > endDate) {
      alert('시작 날짜는 종료 날짜보다 이전이어야 합니다.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/diary/retrospect/', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        },
      });

      setCustomRetrospect(res.data);
    } catch (err) {
      console.error('회고록 생성 실패:', err);
      alert('회고록 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;

    const classes = [];
    const current = new Date(date);

    if (startDate && endDate && startDate <= current && current <= endDate) {
      classes.push('highlight-range');
    }

    const day = current.getDay();
    if (day === 0) classes.push('text-red-500', 'font-bold'); // Sunday
    if (day === 6) classes.push('text-blue-500', 'font-bold'); // Saturday

    return classes.join(' ');
  };

  return (
    <div className="pt-10 px-6 max-w-6xl mx-auto">
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${mode === 'recent' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setMode('recent')}
        >
          최근 회고록 보기
        </button>
        <button
          className={`px-4 py-2 rounded ${mode === 'range' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setMode('range')}
        >
          선택 기간 회고록 보기
        </button>
      </div>

      {mode === 'recent' && (
        <div>
          <h2 className="text-xl font-bold mb-4">최근 회고록</h2>
          {loading ? (
            <p className="text-gray-500">불러오는 중...</p>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">📅 최근 7일 회고록</h3>
                {recentRetrospects.week ? (
                  <RetrospectCard data={recentRetrospects.week} />
                ) : <p className="text-gray-400">데이터 없음</p>}
              </div>
              <div>
                <h3 className="font-semibold mb-2">🗓 이번 달 회고록</h3>
                {recentRetrospects.month ? (
                  <RetrospectCard data={recentRetrospects.month} />
                ) : <p className="text-gray-400">데이터 없음</p>}
              </div>
              <div>
                <h3 className="font-semibold mb-2">📆 올해의 회고록</h3>
                {recentRetrospects.year ? (
                  <RetrospectCard data={recentRetrospects.year} />
                ) : <p className="text-gray-400">데이터 없음</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'range' && (
        <div>
          <h2 className="text-xl font-bold mb-4">기간 선택 후 회고록 생성</h2>
          <div className="flex gap-8 mb-4">
            <div>
              <p className="mb-2">시작 날짜 선택</p>
              <Calendar
                value={startDate}
                onChange={setStartDate}
                tileClassName={tileClassName}
                calendarType="gregory"
                formatShortWeekday={(locale, date) =>
                  ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
                }
              />
            </div>
            <div>
              <p className="mb-2">종료 날짜 선택</p>
              <Calendar
                value={endDate}
                onChange={setEndDate}
                tileClassName={tileClassName}
                calendarType="gregory"
                formatShortWeekday={(locale, date) =>
                  ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
                }
              />
            </div>
          </div>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={handleGenerateRangeRetrospect}
          >
            회고록 생성
          </button>

          <div className="mt-6">
            {loading ? (
              <p className="text-gray-500">생성 중...</p>
            ) : customRetrospect ? (
              customRetrospect.diaries?.length > 0 ? (
                <div>
                  <p className="text-gray-700 mb-2">
                    선택한 기간: {startDate?.toLocaleDateString()} ~ {endDate?.toLocaleDateString()}<br />
                    작성한 일기 수: {customRetrospect.diaries.length}일
                  </p>
                  <RetrospectCard data={customRetrospect} />
                </div>
              ) : (
                <p className="text-gray-500">회고할 일기가 없습니다.</p>
              )
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default RetrospectTab;
