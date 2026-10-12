// /** Sanchiva API client. Relative path + ?XTransformPort=5000 (gateway). 20s timeout. */
// import { toast } from 'sonner';
// const PORT = 5000; const TIMEOUT = 20000;
// async function request(path, opts = {}) {
//   const sep = path.includes('?') ? '&' : '?';
//   const url = `${path}${sep}XTransformPort=${PORT}`;
//   const controller = new AbortController();
//   const timer = setTimeout(() => controller.abort(), opts.timeout ?? TIMEOUT);
//   try {
//     const res = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }, signal: controller.signal, ...opts });
//     const text = await res.text(); let body;
//     try { body = text ? JSON.parse(text) : { ok: false, error: { code: 'EMPTY', message: 'Empty server response' } }; }
//     catch { body = { ok: false, error: { code: 'PARSE', message: 'Invalid server response', raw: text.slice(0, 200) } }; }
//     if (!res.ok || !body.ok) { const err = new Error(body?.error?.message || 'Request failed'); err.code = body?.error?.code || 'REQUEST_FAILED'; err.status = res.status; throw err; }
//     return body.data;
//   } catch (err) {
//     if (err.name === 'AbortError') { const e = new Error('Request timed out. The server took too long to respond.'); e.code = 'TIMEOUT'; e.status = 408; throw e; }
//     throw err;
//   } finally { clearTimeout(timer); }
// }
// export const api = {
//   get: (p, o) => request(p, { method: 'GET', ...o }),
//   post: (p, b, o) => request(p, { method: 'POST', body: JSON.stringify(b), ...o }),
//   put: (p, b) => request(p, { method: 'PUT', body: JSON.stringify(b) }),
//   patch: (p, b) => request(p, { method: 'PATCH', body: JSON.stringify(b) }),
//   delete: (p) => request(p, { method: 'DELETE' }),
//   getPdf: async (p) => { const s = p.includes('?') ? '&' : '?'; const res = await fetch(`${p}${s}XTransformPort=${PORT}`, { credentials: 'include' }); if (!res.ok) throw new Error('Statement download failed'); const blob = await res.blob(); return URL.createObjectURL(blob); },
// };
// export async function withToast(promise, { success, error } = {}) {
//   try { const d = await promise; if (success) toast.success(success); return d; } catch (err) { toast.error(error || err.message); throw err; }
// }




/**
 * Sanchiva API क्लाइंट.
 *
 * डायनामिक बेस URL (प्रोडक्शन फिक्स):
 *   - यदि NEXT_PUBLIC_API_URL सेट है (Vercel पर प्रोडक्शन → Render बैकएंड),
 *     तो हर कॉल सीधे उसी निरपेक्ष URL पर जाएगा (NO XTransformPort — वह
 *     क्वेरी पैरामीटर केवल लोकल सैंडबॉक्स में Caddy गेटवे के लिए मौजूद है)।
 *   - यदि NEXT_PUBLIC_API_URL खाली है (localhost / सैंडबॉक्स प्रीव्यू), तो कॉल
 *     रिलेटिव पाथ + ?XTransformPort=5000 का उपयोग करेंगे ताकि Caddy गेटवे
 *     उन्हें :5000 पर बैकएंड तक रूट कर सके।
 *
 * अपरिवर्तित रखा गया: 20s AbortController टाइमआउट, text→JSON पार्स फॉलबैक,
 * स्ट्रक्चर्ड एरर थ्रोइंग, पूर्ण api वर्ब मैप, getPdf, और withToast।
 */
import { toast } from 'sonner';

const PORT = 5000;
const TIMEOUT = 20000;
// प्रोडक्शन: Vercel में NEXT_PUBLIC_API_URL=https://your-api.onrender.com सेट करें।
// खाली (localhost/सैंडबॉक्स): रिलेटिव + XTransformPort गेटवे पाथ पर फॉलबैक करता है।
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// फाइनल रिक्वेस्ट URL रिज़ॉल्व करें — प्रोडक्शन में निरपेक्ष, डेव में गेटवे-रिलेटिव।
function resolveUrl(path) {
  if (API_BASE) {
    // डिप्लॉयड बैकएंड पर सीधा कॉल। एक सिंगल लीडिंग स्लैश को स्ट्रिप/इन्श्योर करें।
    const p = path.startsWith('/') ? path : '/' + path;
    return `${API_BASE}${p}`;
  }
  // सैंडबॉक्स / localhost — Caddy गेटवे के जरिए रूट करें।
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}XTransformPort=${PORT}`;
}

async function request(path, opts = {}) {
  const url = resolveUrl(path);
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
  getPdf: async (p) => {
    const url = resolveUrl(p);
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Statement download failed');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
};

export async function withToast(promise, { success, error } = {}) {
  try { const d = await promise; if (success) toast.success(success); return d; } catch (err) { toast.error(error || err.message); throw err; }
}