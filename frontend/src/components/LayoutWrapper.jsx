import React from 'react';
import { useLocation } from 'react-router-dom';
import TopRightNav from './TopRightNav';

const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  const hideNavPaths = ['/login', '/register'];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* 상단 고정 네비게이션 */}
      {!hideNavPaths.includes(location.pathname) && (
        <div className="fixed top-0 right-0 left-0 z-50 shadow bg-white px-4 py-2">
          <TopRightNav />
        </div>
      )}

      {/* 본문 컨텐츠 */}
      <main className="pt-20 px-6 max-w-6xl mx-auto">
        {children}
      </main>
    </div>
  );
};

export default LayoutWrapper;
