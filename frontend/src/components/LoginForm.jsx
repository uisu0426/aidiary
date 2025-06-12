import React, { useState } from 'react';
import axios from 'axios';

const LoginForm = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/users/login/', form);
      localStorage.setItem('access', res.data.access);
      localStorage.setItem('refresh', res.data.refresh);
      alert('로그인 성공!');
      // 예: navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || '로그인에 실패했습니다.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 border rounded space-y-4">
      <div>
        <label>ID 또는 이메일</label>
        <input name="username" value={form.username} onChange={handleChange} />
      </div>

      <div>
        <label>비밀번호</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
        로그인
      </button>
    </form>
  );
};

export default LoginForm;