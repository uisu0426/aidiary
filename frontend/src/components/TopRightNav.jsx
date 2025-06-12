import React from 'react';
import { useNavigate } from 'react-router-dom';

function TopRightNav() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    alert('로그아웃 되었습니다.');
    navigate('/login');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-end space-x-4">
        <button onClick={() => navigate('/mypage')} className="bg-gray-600 text-white px-4 py-2 rounded">마이페이지</button>
        <button onClick={() => navigate('/home')} className="bg-green-500 text-white px-4 py-2 rounded">일기작성탭</button>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">로그아웃</button>
      </div>
    </div>
  );
}

export default TopRightNav;