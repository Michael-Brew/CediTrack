const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('ceditrack_auth_token') || 'demo-token';
  const customUserId = localStorage.getItem('ceditrack_user_id');

  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (customUserId) {
    headers.set('X-User-Id', customUserId);
  }

  // Set default Content-Type to application/json if body is not FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null as any;
  }

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.detail || data?.message || response.statusText || 'An error occurred';
    throw new Error(errorMsg);
  }

  return data;
}
