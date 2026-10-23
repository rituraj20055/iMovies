import axios from 'axios'

/**
 * Normalizes backend base URL.
 * Automatically ensures full origin URLs (like https://imovies-backend-7ev8.onrender.com)
 * include the required /api prefix without double-prefixing.
 */
const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '/api';
  if (!url || typeof url !== 'string') return '/api';
  url = url.trim().replace(/\/+$/, '');
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (!url.endsWith('/api')) {
      url = `${url}/api`;
    }
  } else if (url !== '' && !url.startsWith('/api') && url !== '/') {
    url = `/api/${url.replace(/^\/+/, '')}`;
  } else if (!url) {
    url = '/api';
  }
  return url;
};

const API_BASE_URL = getBaseUrl();

/**
 * Configured Axios instance for all iMovies API calls.
 * - Automatically attaches role-appropriate auth tokens from localStorage.
 * - Respects explicitly provided authorization headers.
 * - Cleans up expired credentials on 401/403.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ─── Request Interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Prevent double "/api/api/..." if endpoint was passed with leading "/api"
    if (config.url && config.url.startsWith('/api/')) {
      config.url = config.url.replace(/^\/api/, '');
    } else if (config.url === '/api') {
      config.url = '/';
    }

    // Do not overwrite if caller explicitly supplied authorization
    if (config.headers['Authorization'] || config.headers['auth-token']) {
      return config;
    }

    const userToken  = localStorage.getItem('userToken');
    const adminToken = localStorage.getItem('adminToken');

    const url = config.url || '';
    const method = (config.method || 'get').toLowerCase();
    const isAdminEndpoint =
      url.startsWith('/admin') ||
      url.startsWith('admin') ||
      url.includes('/admin/') ||
      url === '/auth/admin/validate' ||
      url.includes('/admin') ||
      (Boolean(adminToken) && (method === 'delete' || method === 'post' || method === 'put') && (url.includes('/movie') || url.includes('/theatre') || url.includes('/shows')));

    const token = isAdminEndpoint
      ? (adminToken || userToken)
      : (userToken || adminToken);

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['auth-token']    = token;
    }

    return config;
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor ────────────────────────────────────────────────────
// On 401/403 remove stale tokens so the next route guard redirects to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      const url = error.config?.url || '';
      const isAdminEndpoint = url.includes('/admin');

      if (isAdminEndpoint) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('adminName');
      } else {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
      }
    }
    return Promise.reject(error);
  }
)

export default api
