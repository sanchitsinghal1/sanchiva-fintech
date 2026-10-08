/** Sanchiva API client. Relative path + ?XTransformPort=5000 (gateway). 20s timeout. */
import { toast } from 'sonner';
const PORT = 5000; const TIMEOUT = 20000;
async function request(path, opts = {}) {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${path}${sep}XTransformPort=${PORT}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeout ?? TIMEOUT);
  try {
    const res = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }, signal: controller.signal, ...opts });
    const text = await res.text(); let body;
    try { body = text ? JSON.parse(text) : { ok: false, error: { code: 'EMPTY', message: 'Empty server response' } }; }
    catch { body = { ok: false, error: { code: 'PARSE', message: 'Invalid server response', raw: text.slice(0, 200) } }; }
    if (!res.ok || !body.ok) { const err = new Error(body?.error?.message || 'Request failed'); err.code = body?.error?.code || 'REQUEST_FAILED'; err.status = res.status; throw err; }
    return body.data;
  } catch (err) {
    if (err.name === 'AbortError') { const e = new Error('Request timed out. The server took too long to respond.'); e.code = 'TIMEOUT'; e.status = 408; throw e; }
    throw err;
  } finally { clearTimeout(timer); }
}
export const api = {
  get: (p, o) => request(p, { method: 'GET', ...o }),
  post: (p, b, o) => request(p, { method: 'POST', body: JSON.stringify(b), ...o }),
  put: (p, b) => request(p, { method: 'PUT', body: JSON.stringify(b) }),
  patch: (p, b) => request(p, { method: 'PATCH', body: JSON.stringify(b) }),
  delete: (p) => request(p, { method: 'DELETE' }),
  getPdf: async (p) => { const s = p.includes('?') ? '&' : '?'; const res = await fetch(`${p}${s}XTransformPort=${PORT}`, { credentials: 'include' }); if (!res.ok) throw new Error('Statement download failed'); const blob = await res.blob(); return URL.createObjectURL(blob); },
};
export async function withToast(promise, { success, error } = {}) {
  try { const d = await promise; if (success) toast.success(success); return d; } catch (err) { toast.error(error || err.message); throw err; }
}
