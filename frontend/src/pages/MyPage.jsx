import React, { useState } from 'react';
import TopRightNav from '../components/TopRightNav';
import CalendarTab from '../components/MyPageTabs/CalendarTab';
import RetrospectTab from '../components/MyPageTabs/RetrospectTab';

function MyPage() {
  const [activeTab, setActiveTab] = useState('calendar');

  return (
    <div className="pt-20 px-6 max-w-6xl mx-auto">
      <TopRightNav />
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">마이페이지</h2>
      </div>

      <div className="mb-4">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 mr-2 rounded ${activeTab === 'calendar' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          📅 캘린더
        </button>
        <button
          onClick={() => setActiveTab('retrospect')}
          className={`px-4 py-2 rounded ${activeTab === 'retrospect' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          📘 회고록
        </button>
      </div>

      <div>
        {activeTab === 'calendar' && <CalendarTab />}
        {activeTab === 'retrospect' && <RetrospectTab />}
      </div>
    </div>
  );
}

export default MyPage;