import axios from 'axios'

let API_BASE = import.meta.env.VITE_API_URL || 'https://skill-barter-system.onrender.com/api/v1'
if (API_BASE && !API_BASE.endsWith('/api/v1')) {
  API_BASE = API_BASE.replace(/\/+$/, '') + '/api/v1'
}
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sb_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401 responses, clear session and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sb_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (username, password) => {
    const form = new URLSearchParams()
    form.append('username', username)
    form.append('password', password)
    return api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
}

// ── Users ────────────────────────────────────────────────────────────────────
export const userAPI = {
  me: () => api.get('/users/me'),
  mySkills: () => api.get('/users/me/skills'),
  addSkill: (data) => api.post('/users/me/skills', data),
  deleteSkill: (skillId) => api.delete(`/users/me/skills/${skillId}`),
  getUser: (userId) => api.get(`/users/${userId}`),
}

// ── Skills ───────────────────────────────────────────────────────────────────
export const skillsAPI = {
  list: (q) => api.get('/skills/', { params: q ? { q } : {} }),
  search: (q, lat, lng, radius) =>
    api.get('/skills/search', { params: { q, lat, lng, radius } }),
}

// ── Barter Requests ───────────────────────────────────────────────────────────
export const requestsAPI = {
  create: (data) => api.post('/requests/', data),
  list: () => api.get('/requests/'),
  get: (id) => api.get(`/requests/${id}`),
  updateStatus: (id, status) => api.patch(`/requests/${id}/status`, { status }),
}

// ── Sessions ──────────────────────────────────────────────────────────────────
export const sessionsAPI = {
  create: (data) => api.post('/sessions/', data),
  get: (id) => api.get(`/sessions/${id}`),
  complete: (id) => api.post(`/sessions/${id}/complete`),
  review: (id, data) => api.post(`/sessions/${id}/reviews`, data),
}

// ── Matches ───────────────────────────────────────────────────────────────────
export const matchesAPI = {
  recommendations: (limit = 10, maxDistanceKm = 20) =>
    api.get('/matches/recommendations', { params: { limit, max_distance_km: maxDistanceKm } }),
}
