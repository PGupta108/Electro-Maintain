// ─── API HELPER ───────────────────────────────────────────────────────────────
// Wraps fetch with auth token, base URL, and error handling

const BASE = import.meta.env.VITE_API_URL || '/api';

export async function api(path, options = {}) {
  const token = localStorage.getItem('em_token');
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.errors?.[0]?.msg || 'Request failed');
  return data;
}

export const get  = (path)        => api(path);
export const post = (path, body)  => api(path, { method: 'POST',  body: JSON.stringify(body) });
export const patch= (path, body)  => api(path, { method: 'PATCH', body: JSON.stringify(body) });
export const del  = (path)        => api(path, { method: 'DELETE' });
