import api from './axiosInstance';

export const generateAnalysis = (data) => api.post('/analysis/generate', data);
export const getAnalysisById  = (id)   => api.get(`/analysis/${id}`);
export const getAdminStats    = ()     => api.get('/admin/stats');
