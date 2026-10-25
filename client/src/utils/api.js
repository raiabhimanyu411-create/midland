import { readStorage, removeStorage, writeStorage } from './storage.js';

const TOKEN_KEY = 'midland_admin_token';
export const SESSION_EXPIRED_EVENT = 'midland:session-expired';

export const adminToken = {
  get: () => readStorage(TOKEN_KEY),
  set: (token) => writeStorage(TOKEN_KEY, token),
  clear: () => removeStorage(TOKEN_KEY)
};

function handleUnauthorized(response, token) {
  if (response.status === 401 && token) {
    adminToken.clear();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
}

const configuredApiUrl = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE_URL = configuredApiUrl || '/api';

export function apiAssetUrl(assetPath) {
  if (!assetPath || /^(?:https?:|data:|blob:)/i.test(assetPath)) return assetPath;
  return configuredApiUrl && /^https?:/i.test(configuredApiUrl)
    ? new URL(assetPath, configuredApiUrl).toString()
    : assetPath;
}

export async function apiRequest(path, options = {}) {
  const token = adminToken.get();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    handleUnauthorized(response, token);
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

export const api = {
  listTrucks: (query = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return apiRequest(`/trucks${params.toString() ? `?${params.toString()}` : ''}`);
  },
  getTruck: (id) => apiRequest(`/trucks/${id}`),
  getTruckFilters: () => apiRequest('/trucks/filters'),
  listAdminTrucks: () => apiRequest('/trucks/admin/all'),
  duplicateTruck: (id) => apiRequest(`/trucks/${id}/duplicate`, { method: 'POST' }),
  getVehicleLookupStatus: () => apiRequest('/trucks/admin/vehicle-lookup-status'),
  lookupVehicleByRegistration: (registration) => apiRequest('/trucks/admin/lookup-registration', { method: 'POST', body: JSON.stringify({ registration }) }),
  importTrucksCsv: (csv) => apiRequest('/trucks/admin/import.csv', { method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: csv }),
  exportTrucksCsv: async () => {
    const token = adminToken.get();
    const response = await fetch(`${API_BASE_URL}/trucks/admin/export.csv`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      handleUnauthorized(response, token);
      throw new Error(data.message || 'CSV export failed');
    }
    return response.blob();
  },
  createTruck: (payload) => apiRequest('/trucks', { method: 'POST', body: JSON.stringify(payload) }),
  updateTruck: (id, payload) => apiRequest(`/trucks/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTruck: (id) => apiRequest(`/trucks/${id}`, { method: 'DELETE' }),
  createEnquiry: (payload) => apiRequest('/enquiries', { method: 'POST', body: JSON.stringify(payload) }),
  listEnquiries: () => apiRequest('/enquiries'),
  createFinanceQuote: (payload) => apiRequest('/finance-quotes', { method: 'POST', body: JSON.stringify(payload) }),
  listFinanceQuotes: () => apiRequest('/finance-quotes'),
  createPartExchange: (payload) => apiRequest('/part-exchange', { method: 'POST', body: JSON.stringify(payload) }),
  listPartExchange: () => apiRequest('/part-exchange')
  ,createChatLead: (payload) => apiRequest('/chat-leads', { method: 'POST', body: JSON.stringify(payload) })
  ,listChatLeads: (query = {}) => apiRequest(`/chat-leads?${new URLSearchParams(query)}`)
  ,updateChatLead: (id, payload) => apiRequest(`/chat-leads/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
  ,getChatLead: (id) => apiRequest(`/chat-leads/${id}`)
  ,login: (payload) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
  ,logout: () => apiRequest('/auth/logout', { method: 'POST' })
  ,me: () => apiRequest('/auth/me')
  ,updateMyCredentials: (payload) => apiRequest('/auth/credentials', { method: 'PATCH', body: JSON.stringify(payload) })
  ,forgotPassword: (email) => apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })
  ,getDashboard: () => apiRequest('/admin/dashboard')
  ,listUsers: () => apiRequest('/admin/users')
  ,createUser: (payload) => apiRequest('/admin/users', { method: 'POST', body: JSON.stringify(payload) })
  ,updateUser: (id, payload) => apiRequest(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
  ,listAuditLogs: (query = {}) => apiRequest(`/admin/audit-logs?${new URLSearchParams(query)}`)
  ,listNotifications: () => apiRequest('/admin/notifications')
  ,markNotificationRead: (id) => apiRequest(`/admin/notifications/${id}/read`, { method: 'PATCH' })
  ,listBlogs: (query = {}) => apiRequest(`/blogs${Object.keys(query).length ? `?${new URLSearchParams(query)}` : ''}`)
  ,getBlogBySlug: (slug) => apiRequest(`/blogs/${encodeURIComponent(slug)}`)
  ,listAllBlogs: () => apiRequest('/blogs/admin/list')
  ,getBlogById: (id) => apiRequest(`/blogs/admin/${id}`)
  ,createBlog: (payload) => apiRequest('/blogs', { method: 'POST', body: JSON.stringify(payload) })
  ,updateBlog: (id, payload) => apiRequest(`/blogs/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  ,deleteBlog: (id) => apiRequest(`/blogs/${id}`, { method: 'DELETE' })
  ,uploadTruckImage: async (file) => {
    const token = adminToken.get();
    const form = new FormData(); form.append('image', file);
    const response = await fetch(`${API_BASE_URL}/admin/upload`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { handleUnauthorized(response, token); throw new Error(data.message || 'Upload failed'); }
    return data;
  }
};
