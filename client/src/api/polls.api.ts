import api from './axios';

export type CreatePollPayload = {
  title: string;
  description?: string;
  isAnonymous: boolean;
  expiresAt: string;
  questions: {
    text: string;
    isMandatory: boolean;
    options: string[];
  }[];
};

export const pollsApi = {
  create: (body: CreatePollPayload) => api.post('/polls', body),

  getMyPolls: () => api.get('/polls/my'),

  getById: (pollId: string) => api.get(`/polls/${pollId}`),

  respond: (pollId: string, body: { answers: { questionId: string; optionId: string }[] }) =>
    api.post(`/polls/${pollId}/respond`, body),

  publish: (pollId: string) => api.patch(`/polls/${pollId}/publish`),
};