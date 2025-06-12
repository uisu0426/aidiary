import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const [form, setForm] = useState({
    user_id: '',
    password: '',
    password2: '',
    username: '',
    email: ''
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    
    const koreanRegex = /^[가-힣]{2,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^.{8,}$/;

      // 아이디
    if (form.user_id.length < 6) {
      newErrors.user_id = '아이디는 6자 이상이어야 합니다.';
    } else if (/[\u3131-\u318E\u1100-\u11FF]+/.test(form.user_id) && !koreanRegex.test(form.user_id)) {
      newErrors.user_id = '아이디에 한글을 사용할 경우 정확한 한글 형식을 지켜야 합니다.';
    }

    // 비밀번호
    if (!passwordRegex.test(form.password)) {
      newErrors.password = '비밀번호는 8자 이상이며, 대/소문자, 숫자, 특수문자를 포함해야 합니다.';
    }

    if (form.password !== form.password2) {
      newErrors.password2 = '비밀번호가 일치하지 않습니다.';
   }

    // 이름
    if (form.username.length < 2) {
      newErrors.username = '이름은 두 글자 이상이어야 합니다.';
    } else if (/[\u3131-\u318E\u1100-\u11FF]+/.test(form.username) && !koreanRegex.test(form.username)) {
      newErrors.username = '이름에 한글을 사용할 경우 정확한 한글 형식을 지켜야 합니다.';
    }

    // 이메일
    if (!emailRegex.test(form.email)) {
      newErrors.email = '이메일 형식을 지켜주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await api.post('/users/register/', form);
      alert('가입이 완료되었습니다.');
      navigate('/login');
    } catch (err) {
      if (err.response && err.response.data) {
        setErrors(err.response.data);
      }
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">회원가입</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="input w-full" name="user_id" placeholder="아이디" onChange={handleChange} />
        {errors.user_id && <p className="text-red-500">{errors.user_id}</p>}

        <input className="input w-full" name="password" type="password" placeholder="비밀번호" onChange={handleChange} />
        {errors.password && <p className="text-red-500">{errors.password}</p>}

        <input className="input w-full" name="password2" type="password" placeholder="비밀번호 확인" onChange={handleChange} />
        {errors.password2 && <p className="text-red-500">{errors.password2}</p>}

        <input className="input w-full" name="username" placeholder="이름" onChange={handleChange} />
        {errors.username && <p className="text-red-500">{errors.username}</p>}

        <input className="input w-full" name="email" placeholder="이메일" type="email" onChange={handleChange} />
        {errors.email && <p className="text-red-500">{errors.email}</p>}

        <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded">가입하기</button>
      </form>
    </div>
  );
}

export default RegisterPage;
