import api from './axiosInstance';

export const uploadResume   = (formData) =>
  api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getResumeHistory = (page = 1, limit = 10) =>
  api.get(`/resume/history?page=${page}&limit=${limit}`);

export const getResumeById  = (id) => api.get(`/resume/${id}`);
