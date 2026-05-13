import api from './axios';

export const analyticsApi = {
  get: (pollId: string) => api.get(`/polls/${pollId}/analytics`),
};