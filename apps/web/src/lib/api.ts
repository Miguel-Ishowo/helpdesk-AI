export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

let accessToken: string | null = null;
export function setAccessToken(token: string | null) { accessToken = token; }
export function getAccessToken() { return accessToken; }

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.accessToken) {
      setAccessToken(data.accessToken);
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const res = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: 'include' });
  if (res.status === 401 && retry && path !== '/auth/refresh' && path !== '/auth/login') {
    const newToken = await refreshAccessToken();
    if (newToken) return apiFetch<T>(path, init, false);
  }
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = (body && (body.message || body.error)) || `Request failed (${res.status})`;
    throw new ApiError(res.status, Array.isArray(message) ? message.join(', ') : String(message), body);
  }
  return body as T;
}
