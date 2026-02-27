import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  `${window.location.origin}/api/v1`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

function getCookie(name: string): string | null {
  const parts = document.cookie.split(';').map((p) => p.trim());
  const found = parts.find((p) => p.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.split('=').slice(1).join('=')) : null;
}

api.interceptors.request.use((config) => {
  const method = (config.method ?? 'get').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const csrf = getCookie('maxrep_csrf');
    if (csrf) {
      config.headers['x-csrf-token'] = csrf;
    }
  }
  return config;
});

let refreshing = false;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !refreshing) {
      try {
        refreshing = true;
        original._retry = true;
        await api.post('/auth/refresh');
        return api(original);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(error);
  },
);
