/**
 * Sanchiva API client.
 * ----------------------------------------------------------------------------
 * Every request goes through the Caddy gateway with ?XTransformPort=5000
 * so it reaches the Express backend (port 5000). Cookies are sent with
 * credentials so the httpOnly auth cookies round-trip automatically.
 *
 * Returns the parsed `data` field on success; throws a typed error with
 * .code + .message on failure so callers can show toasts.
 */
import { toast } from 'sonner';

const PORT = 5000;

async function request(path, opts = {}) {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${path}${sep}XTransformPort=${PORT}`;
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });

  let body;
  try {
    body = await res.json();
  } catch {
    body = { ok: false, error: { code: 'PARSE', message: 'Invalid server response' } };
  }

  if (!res.ok || !body.ok) {
    const err = new Error(body?.error?.message || 'Request failed');
    err.code = body?.error?.code || 'REQUEST_FAILED';
    err.status = res.status;
    throw err;
  }
  return body.data;
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  // PDF download — returns a blob URL (does NOT parse as JSON)
  getPdf: async (path) => {
    const sep = path.includes('?') ? '&' : '?';
    const url = `${path}${sep}XTransformPort=${PORT}`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Statement download failed');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
};

/** Convenience wrapper that toasts errors — use in event handlers. */
export async function withToast(promise, { success, error } = {}) {
  try {
    const data = await promise;
    if (success) toast.success(success);
    return data;
  } catch (err) {
    toast.error(error || err.message);
    throw err;
  }
}
