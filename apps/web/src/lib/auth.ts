import { apiFetch, setAccessToken } from './api';

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  expiresIn: string;
}

export async function register(input: { email: string; password: string; firstName: string; lastName?: string; organizationName?: string }) {
  const res = await apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(input) });
  setAccessToken(res.accessToken);
  return res;
}

export async function login(input: { email: string; password: string }) {
  const res = await apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) });
  setAccessToken(res.accessToken);
  return res;
}

export async function logout() {
  try { await apiFetch('/auth/logout', { method: 'POST' }); } finally { setAccessToken(null); }
}

export async function me(): Promise<User> {
  return apiFetch<User>('/auth/me');
}

export async function refresh(): Promise<AuthResponse | null> {
  try {
    const res = await apiFetch<AuthResponse>('/auth/refresh', { method: 'POST' });
    setAccessToken(res.accessToken);
    return res;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export async function forgotPassword(email: string) {
  return apiFetch<{ success: boolean }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
}

export async function resetPassword(token: string, password: string) {
  return apiFetch<{ success: boolean }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) });
}

export async function verifyEmail(token: string) {
  return apiFetch<{ success: boolean }>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) });
}
