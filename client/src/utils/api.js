import { removeStorage } from './storage.js';

export const SESSION_EXPIRED_EVENT = 'midland:session-expired';

// The admin session is an httpOnly cookie set by the server, so scripts never see the token.
// Remove the token older versions kept in localStorage.
removeStorage('midland_admin_token');

function handleUnauthorized(response, path) {
  if (response.status === 401 && path !== '/auth/login') {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
}

// Readable messages when the server (or a proxy in front of it) answers without JSON.
function statusMessage(status, fallback) {
  if (status === 413) return 'This file or form is too large for the server. Use a smaller photo or shorter text.';
  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 429) return 'Too many requests. Please wait a minute and try again.';
  if (status >= 500) return 'The server had a problem. Please try again in a moment.';
  return fallback;
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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    handleUnauthorized(response, path);
    throw new Error(data.message || statusMessage(response.status, 'The request could not be completed. Please try again.'));
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
    const response = await fetch(`${API_BASE_URL}/trucks/admin/export.csv`, { credentials: 'include' });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      handleUnauthorized(response, '/trucks/admin/export.csv');
      throw new Error(data.message || 'CSV export failed');
    }
    return response.blob();
  },
  createTruck: (payload) => apiRequest('/trucks', { method: 'POST', body: JSON.stringify(payload) }),
  updateTruck: (id, payload) => apiRequest(`/trucks/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTruck: (id) => apiRequest(`/trucks/${id}`, { method: 'DELETE' }),
  createEnquiry: (payload) => apiRequest('/enquiries', { method: 'POST', body: JSON.stringify(payload) }),
  listEnquiries: () => apiRequest('/enquiries'),
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
    const form = new FormData(); form.append('image', file);
    const response = await fetch(`${API_BASE_URL}/admin/upload`, { method: 'POST', credentials: 'include', body: form });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { handleUnauthorized(response, '/admin/upload'); throw new Error(data.message || statusMessage(response.status, 'Upload failed. Please try again.')); }
    return data;
  }
};
