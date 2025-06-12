import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import EmotionChart from "../components/EmotionChart";
import TopRightNav from '../components/TopRightNav';

function HomePage() {
  const [inputText, setInputText] = useState('');
  const [diary, setDiary] = useState('');
  const [loading, setLoading] = useState(false);
  const [emotionData, setEmotionData] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('access_token');

  const handleLogout = () => {
    localStorage.clear();
    alert('로그아웃 되었습니다.');
    navigate('/login');
  };

  const goToMyPage = () => navigate('/mypage');
  const goToCalendar = () => navigate('/calendar');

  const generateDiary = async () => {
    if (!inputText.trim()) return alert('입력 내용을 작성해주세요.');
    if (!token) {
      alert('로그인이 필요합니다.');
      return navigate('/login');
    }

    try {
      setLoading(true);
      const res = await api.post(
        '/diary/generate/',
        { input: inputText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDiary(res.data.generated_diary);
      setEmotionData(res.data);
    } catch (err) {
      console.error(err);
      alert('일기 생성 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
        <div className="pt-20 px-6 max-w-6xl mx-auto">
            <TopRightNav />

      <h2 className="text-2xl font-bold mb-4">일기 생성기</h2>
      <textarea
        className="w-full p-2 border rounded mb-2"
        rows={3}
        placeholder="오늘 하루를 한 문장 또는 단어로 표현해보세요"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />
      <button
        onClick={generateDiary}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        disabled={loading}
      >
        {loading ? '생성 중...' : '일기 생성'}
      </button>

      {diary && (
        <div className="border p-4 rounded shadow bg-gray-50 space-y-4">
          <h3 className="font-semibold mb-2">📝 생성된 일기</h3>
            <p className="whitespace-pre-wrap">{diary}</p>

            {emotionData && (
              <div className="mt-4">
                <EmotionChart
                  joy={emotionData.joy}
                  anger={emotionData.anger}
                  sadness={emotionData.sadness}
                  pleasure={emotionData.pleasure}
                  happiness_score={emotionData.happiness_score}
                  />
              </div>
            )}  
        </div>
      )}
    </div>
  );
}

export default HomePage;