import axios from 'axios';

export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('Refresh token 없음');

  try {
    const res = await axios.post('http://localhost:8000/api/token/refresh/', {
      refresh: refreshToken,
    });

    const newAccessToken = res.data.access;
    localStorage.setItem('access_token', newAccessToken);
    return newAccessToken;
  } catch (err) {
    throw new Error('Refresh token 만료 또는 오류');
  }
};