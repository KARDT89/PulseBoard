import api from './axios';

export const authApi = {
  register: (body: { name: string; email: string; password: string }) =>
    api.post('/auth/register', body),

  login: (body: { email: string; password: string }) =>
    api.post('/auth/login', body),

  logout: () => api.post('/auth/logout'),

  getMe: () => api.get('/auth/getMe'),

  refresh: () => api.post('/auth/refresh'),
};