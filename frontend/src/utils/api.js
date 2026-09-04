export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SERVER_BASE = API_BASE ? API_BASE.replace('/api', '') : '';

export const getAuthToken = () => localStorage.getItem('letters_token');

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('letters_token', token);
  } else {
    localStorage.removeItem('letters_token');
  }
};

export const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 60 seconds request timeout limit (to accommodate Render free tier cold starts)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `API error: ${response.status}`);
      error.status = response.status;
      
      // Determine error code
      if (response.status === 401) {
        error.code = 'AUTH_FAILED';
      } else if (response.status === 503) {
        error.code = 'DATABASE_UNAVAILABLE';
      } else if (response.status === 403 && errorData.message && errorData.message.includes('CORS')) {
        error.code = 'CORS_ERROR';
      } else {
        error.code = 'INTERNAL_SERVER_ERROR';
      }
      throw error;
    }

    return response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.status) {
      throw err;
    }
    if (err.name === 'AbortError') {
      const error = new Error('Request timeout');
      error.code = 'API_TIMEOUT';
      error.status = 408;
      throw error;
    }
    const error = new Error('Unable to connect to the server');
    error.code = 'SERVER_OFFLINE';
    error.status = 503;
    error.originalError = err;
    throw error;
  }
};

export const uploadFile = async (file, title = '', artist = '', duration = 0) => {
  const formData = new FormData();
  formData.append('file', file);
  if (title) formData.append('title', title);
  if (artist) formData.append('artist', artist);
  if (duration) formData.append('duration', duration);

  return apiFetch('/upload', {
    method: 'POST',
    body: formData,
  });
};
