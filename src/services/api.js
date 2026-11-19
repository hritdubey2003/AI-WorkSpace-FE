import axios from 'axios';
import { API_BASE_URL, STORAGE_KEY_TOKEN } from '../constants';

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEY_TOKEN);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      window.location.href = '/login';
    }
    // Normalize: extract message from new BE shape { success, error: { code, message } }
    // Fall back to old shape { message } for backward compatibility
    const beMessage =
      err.response?.data?.error?.message ||
      err.response?.data?.message;
    const normalized = new Error(beMessage || err.message);
    normalized.response = err.response;
    return Promise.reject(normalized);
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
  searchUsers: (wsId, q) => api.get(`/workspaces/${wsId}/members/search`, { params: { q } }),
  addMember: (wsId, userId, role = 'EDITOR') => api.post(`/workspaces/${wsId}/members`, { userId, role }),
  updateMemberRole: (wsId, userId, role) => api.patch(`/workspaces/${wsId}/members/${userId}`, { role }),
  removeMember: (wsId, userId) => api.delete(`/workspaces/${wsId}/members/${userId}`),
};

export const documentAPI = {
  getByWorkspace: (wsId) => api.get(`/documents/workspace/${wsId}`),
  getSharedWithMe: () => api.get('/documents/shared-with-me'),
  getOne: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.patch(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  shareDoc: (id, email, role = 'EDITOR') => api.post(`/documents/${id}/share`, { email, role }),
  removeCollaborator: (id, userId) => api.delete(`/documents/${id}/share/${userId}`),
  leaveShared: (id) => api.delete(`/documents/${id}/share`),
  getCollaborators: (id) => api.get(`/documents/${id}/collaborators`),
};

export const aiAPI = {
  summarize: (docId) => api.post(`/ai/summarize/${docId}`),
  improve: (docId) => api.post(`/ai/improve/${docId}`),
  generateTasks: (docId) => api.post(`/ai/tasks/${docId}`),
};

export default api;
