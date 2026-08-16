const rawBaseUrl = import.meta.env.VITE_API_URL;

// If in production and no VITE_API_URL is configured, use current origin or prompt
export const API_BASE_URL = rawBaseUrl
  ? rawBaseUrl.replace(/\/+$/, '')
  : (import.meta.env.DEV ? 'http://localhost:8000' : '');

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

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${cleanEndpoint}`;

  try {
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
      const errorMsg = data?.detail || data?.message || response.statusText || `Request failed (${response.status})`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err: any) {
    // If backend is unreachable or returning HTML (e.g. 404 rewrite)
    if (err.message && err.message.includes('Unexpected token')) {
      throw new Error('Backend API not reachable. Please check VITE_API_URL configuration in Vercel settings.');
    }
    throw err;
  }
}
