const AUTH_API = import.meta.env.VITE_AUTH_API ?? 'http://localhost:8531';

export interface User {
  username: string;
  email: string;
  role: string;
  sessionId: string;
}

const STORAGE_KEY = 'b5k-auth-user';

export function getCurrentUser(): User | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

export function getSessionToken(): string | null {
  return getCurrentUser()?.sessionId ?? null;
}

export async function login(username: string, password: string): Promise<User> {
  const resp = await fetch(`${AUTH_API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(err.detail || 'Login failed');
  }
  const data = await resp.json();
  const user: User = { username: data.username, email: data.email, role: data.role, sessionId: data.sessionId };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('auth-changed', { detail: user }));
  return user;
}

export async function register(email: string, username: string, password: string): Promise<User> {
  const resp = await fetch(`${AUTH_API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: 'Registration failed' }));
    throw new Error(err.detail || 'Registration failed');
  }
  const data = await resp.json();
  const user: User = { username: data.username, email: data.email, role: data.role, sessionId: data.sessionId };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('auth-changed', { detail: user }));
  return user;
}

export async function logout(): Promise<void> {
  const token = getSessionToken();
  if (token) {
    try {
      await fetch(`${AUTH_API}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch { /* best effort */ }
  }
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('auth-changed', { detail: null }));
}
