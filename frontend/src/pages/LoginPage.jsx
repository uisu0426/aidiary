import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [form, setForm] = useState({ user_id: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/users/login/', {
        user_id: form.user_id,
        password: form.password
      });

      const { access, refresh, user_id, username, is_staff  } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user_id', user_id);
      localStorage.setItem('username', username);
      localStorage.setItem('is_staff', is_staff.toString()); 
      
      
      if (String(is_staff) === 'true') {
        navigate('/adminpage');  // ✅ 관리자 페이지로 이동
      } else {
        navigate('/home');
      }
    } catch (err) {
      console.error(err.response?.data || err);
      setError("로그인 실패: 아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  const goToRegister = () => {
    navigate('/register');
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">로그인</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="input w-full"
          name="user_id"
          placeholder="아이디"
          onChange={handleChange}
          required
        />
        <input
          className="input w-full"
          name="password"
          type="password"
          placeholder="비밀번호"
          onChange={handleChange}
          required
        />
        {error && <p className="text-red-500">{error}</p>}

        <div className="flex space-x-2">
          <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded">로그인</button>
          <button type="button" onClick={goToRegister} className="bg-gray-500 text-white py-2 px-4 rounded">
            회원가입
          </button>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;