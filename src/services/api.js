import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err.response?.data || err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const workspaceAPI = {
  getAll: () => api.get('/workspaces'),
  getOne: (id) => api.get(`/workspaces/${id}`),
  create: (data) => api.post('/workspaces', data),
  delete: (id) => api.delete(`/workspaces/${id}`),
  addMember: (wsId, email) => api.post(`/workspaces/${wsId}/members`, { email }),
  removeMember: (wsId, userId) => api.delete(`/workspaces/${wsId}/members/${userId}`),
};

export const documentAPI = {
  getByWorkspace: (wsId) => api.get(`/documents/workspace/${wsId}`),
  getOne: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.patch(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  shareDoc: (id, email) => api.post(`/documents/${id}/share`, { email }),
  removeCollaborator: (id, userId) => api.delete(`/documents/${id}/share/${userId}`),
  getCollaborators: (id) => api.get(`/documents/${id}/collaborators`),
};

export const aiAPI = {
  summarize: (docId) => api.post(`/ai/summarize/${docId}`),
  improve: (docId) => api.post(`/ai/improve/${docId}`),
  generateTasks: (docId) => api.post(`/ai/tasks/${docId}`),
};

export default api;