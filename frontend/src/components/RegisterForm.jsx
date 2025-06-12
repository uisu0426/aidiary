import React, { useState } from 'react';
import axios from 'axios';

const RegisterForm = () => {
  const [form, setForm] = useState({
    user_id: '',
    username: '',
    email: '',
    password: '',
    password2: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/users/register/', form);
      alert('회원가입 성공! 로그인 페이지로 이동합니다.');
      // 예: navigate('/login');
    } catch (err) {
      setErrors(err.response?.data || {});
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 border rounded space-y-4">
      <div>
        <label>ID</label>
        <input name="user_id" value={form.user_id} onChange={handleChange} />
        {errors.user_id && <p className="text-red-500 text-sm">{errors.user_id}</p>}
      </div>

      <div>
        <label>이름</label>
        <input name="username" value={form.username} onChange={handleChange} />
      </div>

      <div>
        <label>이메일</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
      </div>

      <div>
        <label>비밀번호</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} />
      </div>

      <div>
        <label>비밀번호 확인</label>
        <input name="password2" type="password" value={form.password2} onChange={handleChange} />
        {errors.password2 && <p className="text-red-500 text-sm">{errors.password2}</p>}
      </div>

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        가입하기
      </button>
    </form>
  );
};

export default RegisterForm;