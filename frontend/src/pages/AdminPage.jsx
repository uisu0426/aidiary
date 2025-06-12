import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/list/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      alert('사용자 목록을 불러오지 못했습니다.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/users/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch {
      alert('삭제 실패');
    }
  };

  const toggleActive = async (id, isActive) => {
    try {
      await api.put(`/users/${id}/`, { is_active: !isActive }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch {
      alert('수정 실패');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('is_staff');
    alert('로그아웃 되었습니다.');
    navigate('/login');
  };

  const goToHome = () => {
    navigate('/home');
  };

  const filteredUsers = users.filter(u =>
    u.user_id.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">관리자 페이지 - 사용자 관리</h2>
        <div className="space-x-2">
          <button onClick={goToHome} className="bg-green-500 text-white px-4 py-2 rounded">홈으로</button>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">로그아웃</button>
        </div>
      </div>

      <input
        type="text"
        placeholder="아이디 또는 이메일 검색"
        className="border px-3 py-1 mb-4 w-full"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2">ID</th>
            <th className="border p-2">이름</th>
            <th className="border p-2">이메일</th>
            <th className="border p-2">상태</th>
            <th className="border p-2">기능</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user.id}>
              <td className="border p-2">{user.user_id}</td>
              <td className="border p-2">{user.username}</td>
              <td className="border p-2">{user.email}</td>
              <td className="border p-2">{user.is_active ? '활성' : '비활성'}</td>
              <td className="border p-2 space-x-2">
                <button
                  onClick={() => toggleActive(user.id, user.is_active)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                >
                  {user.is_active ? '비활성화' : '활성화'}
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPage;