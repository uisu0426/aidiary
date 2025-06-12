import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import EmotionChart from '../EmotionChart';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { isSameDiaryInputs } from '../../utils/diaryUtils';

ChartJS.register(ArcElement, Tooltip);

const isSameDate = (date1, date2) => {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const CalendarTab = () => {
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [summaryEntry, setSummaryEntry] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState('');
  const [summaryModified, setSummaryModified] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editMode, setEditMode] = useState('');
  const [editText, setEditText] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [editSummaryText, setEditSummaryText] = useState('');
  const token = localStorage.getItem('access_token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    fetchEntries(); // 여기서 setEntries가 실행됨
  }, []);

  const fetchEntries = async () => {
    const res = await api.get('/diary/entries/', {
      headers: { Authorization: `Bearer ${token}` },
    });
  
    const data = res.data;
    if (!Array.isArray(res.data)) {
      console.error('❌ entries 응답값이 배열이 아님:', res.data);
      return [];
    }
  
    setEntries(data);
    return data;
  };

  const getEntriesByDate = (date, entriesOverride = null) => {
    const data = Array.isArray(entriesOverride) ? entriesOverride : entries;
    if (!Array.isArray(data)) {
      console.error("❌ getEntriesByDate: entries 데이터가 배열이 아님", data);
      return [];
    }
    return data.filter(entry => !entry.is_summary && isSameDate(new Date(entry.created_at), date));
  };
  
  const getSummaryByDate = (date, entriesOverride = null) => {
    const data = Array.isArray(entriesOverride) ? entriesOverride : entries;
    if (!Array.isArray(data)) {
      console.error("❌ getSummaryByDate: entries 데이터가 배열이 아님", data);
      return null;
    }
    return data.find(entry => entry.is_summary && isSameDate(new Date(entry.created_at), date));
  };

  const handleGenerateDailySummary = async (dateObj) => {
    const dateStr = formatDate(dateObj);
    setIsSummaryLoading(true);
    try {
      await api.post('/diary/daily-summary/', { date: dateStr }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newEntries = await fetchEntries();
      if (Array.isArray(newEntries)) {
        setEntries(newEntries);
        handleDateClick(selectedDate, newEntries);
      }      
      setSummaryModified(false);
    } catch (error) {
      alert('하루 종합 일기 생성 또는 조회 실패');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleDateClick = async (date, entriesOverride = null) => {
    setSelectedDate(date);
    setSummaryEntry(null);
    setSummaryStatus('');
    setIsSummaryLoading(true);
    setSummaryModified(false);

    const dateStr = formatDate(date);
    const dayEntries = getEntriesByDate(date, entriesOverride);
    const hasEntries = dayEntries.length > 0;

    try {
      const res = await api.get(`/diary/daily-summary/?date=${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummaryEntry(res.data);
      setSummaryStatus('exists');

      const currentInputs = dayEntries.map(e => ({
        raw_input: e.raw_input,
        diary: e.generated_diary,
      }));
      const savedInputs = res.data.original_inputs || [];

      const isModified = !isSameDiaryInputs(currentInputs, savedInputs);
      setSummaryModified(isModified);

    } catch (err) {
      if (err.response?.status === 404) {
        setSummaryStatus(hasEntries ? 'can_generate' : 'no_entries');
      } else {
        alert('하루 종합 일기 조회 실패');
      }
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  };

  const handleEdit = (id, originalText, mode, hashtags = []) => {
    setEditId(id);
    setEditMode(mode);
    setEditText(originalText);
    setEditHashtags(hashtags.join(', '));
  };

  const handleEditSubmit = async (id) => {
    const payload =
      editMode === 'gpt'
        ? { raw_input: editText }
        : {
            generated_diary: editText,
            hashtags: editHashtags
              .split(',')
              .map(tag => tag.trim())
              .filter(tag => tag.length > 0),
          };

    try {
      await api.put(`/diary/edit/${id}/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('수정 완료');
      setEditId(null);
      setEditMode('');
      setEditText('');
      setEditHashtags('');

      const newEntries = await fetchEntries();
      setEntries(newEntries);
      handleDateClick(selectedDate, newEntries);

    } catch {
      alert('수정 실패');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/diary/edit/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newEntries = await fetchEntries();
      handleDateClick(selectedDate, newEntries);
    } catch {
      alert('삭제 실패');
    }
  };

  const filteredEntries = selectedDate ? getEntriesByDate(selectedDate) : [];

  const handleEditSummary = () => {
    setEditMode('summary');
    setEditText(summaryEntry.generated_diary);
  };

  const handleSummarySubmit = async () => {
    try {
      await api.put(`/diary/edit/${summaryEntry.id}/`, {
        generated_diary: editText,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('하루 종합 일기 수정 완료');
      setEditMode('');
      setEditText('');
      const newEntries = await fetchEntries();
      handleDateClick(selectedDate, newEntries);
    } catch {
      alert('수정 실패');
    }
  };

  const handleDeleteSummary = async () => {
    if (!window.confirm('하루 종합 일기를 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/diary/daily-summary/delete/${summaryEntry.id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('하루 종합 일기가 삭제되었습니다.');
      setSummaryEntry(null);
      const newEntries = await fetchEntries();
      handleDateClick(selectedDate, newEntries);
    } catch {
      alert('삭제 실패');
    }
  };

  return (
    <div className="pt-10 px-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">나의 일기 - 캘린더</h2>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/3">
          <Calendar
            onChange={handleDateClick}
            value={selectedDate}
            tileClassName={({ date }) => {
              const day = date.getDay();
              if (day === 0) return 'text-red-500 font-bold';
              if (day === 6) return 'text-blue-500 font-bold';
              return '';
            }}
            tileContent={({ date }) => {
              if (!Array.isArray(entries)) return null;
            
              const summaryMatch = entries.find(e => e.is_summary && isSameDate(new Date(e.date), date));
              const entryMatch = entries.find(e => !e.is_summary && isSameDate(new Date(e.created_at), date));
            
              console.log('📆 date:', date, '⭕️ match:', summaryMatch, '🔺 match:', entryMatch);
            
              if (summaryMatch) return <div className="text-green-500 text-xs text-center mt-1">⭕️</div>;
              if (entryMatch) return <div className="text-yellow-500 text-xs text-center mt-1">🔺</div>;
              return <div className="text-gray-400 text-xs text-center mt-1">❌</div>;
            }}
            
            calendarType="gregory"
            formatShortWeekday={(locale, date) =>
              ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
            }
          />
        </div>

        <div className="lg:w-2/3 space-y-6">
          {selectedDate && (
            <>
              <h3 className="text-xl font-bold">
                {selectedDate.getFullYear()}. {selectedDate.getMonth() + 1}. {selectedDate.getDate()}.
              </h3>


              {/* 하루 종합 일기 */}
              <div className="p-4 border rounded shadow space-y-2">
                <div className="text-sm font-semibold text-gray-600 flex justify-between items-center">
                  <span>📘 하루 종합 일기</span>

                  
                {/* 버튼 표시 조건: 시간대별 일기가 1개 이상 있는 경우 */}
                {filteredEntries.length > 0 && (
                  <button
                    onClick={() => handleGenerateDailySummary(selectedDate)}
                    className="text-xs bg-indigo-500 text-white px-2 py-1 rounded"
                  >
                    {summaryStatus === 'exists' ? '재생성' : '생성하기'}
                  </button>
                )}
              </div>

                {/* 1. 하루 종합 일기 존재 */}
                {summaryStatus === 'exists' && summaryEntry ? (
                  <div>
                    {/* 감정 출력 */}
                    <p className="text-sm text-gray-500">감정: {summaryEntry.emotion || '분석 불가'}</p>

                    {/* 변경된 경우 표시 */}
                    {summaryModified && (
                      <p className="text-red-500 text-sm">변경 사항이 있습니다.</p>
                    )}

                    {/* 수정 모드 */}
                    {editMode === 'summary' ? (
                      <>
                        <textarea
                          className="w-full border rounded p-2 mb-2"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                        />
                        <div className="space-x-2">
                          <button
                            onClick={handleSummarySubmit}
                            className="bg-blue-500 text-white px-3 py-1 rounded"
                          >
                            수정 완료
                          </button>
                          <button
                            onClick={() => {
                              setEditMode('');
                              setEditText('');
                            }}
                            className="bg-gray-500 text-white px-3 py-1 rounded"
                          >
                            취소
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* 일기 내용 출력 */}
                        {summaryEntry.generated_diary ? (
                          <p className="whitespace-pre-wrap">{summaryEntry.generated_diary}</p>
                        ) : (
                          <p className="text-gray-400">일기 내용이 없습니다.</p>
                        )}

                        {/* 해시태그 출력 */}
                        {summaryEntry.hashtags?.length > 0 && (
                          <span className="text-blue-500">
                            {summaryEntry.hashtags.map((tag) => `#${tag}`).join(' ')}
                          </span>
                        )}

                        {/* 수정 버튼 */}
                        <div className="mt-2 space-x-2">
                          <button
                            onClick={handleEditSummary}
                            className="bg-yellow-500 text-white px-3 py-1 rounded"
                          >
                            직접 수정
                          </button>
                          <button
                            onClick={handleDeleteSummary}
                            className="bg-red-500 text-white px-3 py-1 rounded"
                          >
                            삭제
                          </button>
                        </div>
                      </>
                    )}

                    {/* 감정 차트 출력 */}
                    <EmotionChart
                      joy={summaryEntry.joy}
                      anger={summaryEntry.anger}
                      sadness={summaryEntry.sadness}
                      pleasure={summaryEntry.pleasure}
                      happiness_score={summaryEntry.happiness_score}
                    />
                  </div>

                ) : summaryStatus === 'can_generate' ? (
                  <p className="text-gray-500">하루 종합 일기를 생성할 수 있습니다.</p>
                ) : (
                  <p className="text-gray-400">작성된 일기가 없습니다.</p>
                )}
              </div>

              {/* 시간대별 일기 출력 */}
              <div className="text-lg font-semibold text-gray-700 mt-4">🕒 시간대별 일기</div>
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="p-4 border rounded shadow space-y-2 flex flex-col lg:flex-row">
                  <div className="lg:w-2/3">
                    <div className="text-sm text-gray-500">
                      작성 시간: {new Date(entry.created_at).toLocaleTimeString('ko-KR')} / 감정: {entry.emotion}
                    </div>
                    {editId === entry.id ? (
                      <div>
                        <textarea
                          className="w-full border rounded p-2 mb-2"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                        />
                        {editMode === 'manual' && (
                          <input
                            type="text"
                            className="w-full border rounded p-2 mb-2"
                            placeholder="쉼표로 구분된 해시태그 입력"
                            value={editHashtags}
                            onChange={(e) => setEditHashtags(e.target.value)}
                          />
                        )}
                        <div className="space-x-2">
                          <button onClick={() => handleEditSubmit(entry.id)} className="bg-blue-500 text-white px-3 py-1 rounded">수정 완료</button>
                          <button onClick={() => { setEditId(null); setEditMode(''); setEditText(''); setEditHashtags(''); }} className="bg-gray-500 text-white px-3 py-1 rounded">취소</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap">{entry.generated_diary}</p>
                        {entry.hashtags?.length > 0 && (
                          <span className="text-blue-500">
                            {entry.hashtags.map((tag) => `#${tag}`).join(' ')}
                          </span>
                        )}
                        <div className="space-x-2 mt-2">
                          <button onClick={() => handleEdit(entry.id, entry.raw_input, 'gpt')} className="bg-purple-500 text-white px-3 py-1 rounded">GPT 재생성</button>
                          <button onClick={() => handleEdit(entry.id, entry.generated_diary, 'manual', entry.hashtags)} className="bg-yellow-500 text-white px-3 py-1 rounded">직접 수정</button>
                          <button onClick={() => handleDelete(entry.id)} className="bg-red-500 text-white px-3 py-1 rounded">삭제</button>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="lg:w-1/3 mt-4 lg:mt-0">
                    <EmotionChart
                      joy={entry.joy}
                      anger={entry.anger}
                      sadness={entry.sadness}
                      pleasure={entry.pleasure}
                      happiness_score={entry.happiness_score}
                    />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarTab;