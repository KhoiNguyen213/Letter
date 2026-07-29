export const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '');
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

  // 15 seconds request timeout limit
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('API_TIMEOUT');
    }
    throw err;
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
