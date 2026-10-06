/** Standardised envelope: { ok, data | error } + typed ApiError. */
const ok = (res, data, status = 200) => res.status(status).json({ ok: true, data });
const fail = (res, code, message, status = 400) =>
  res.status(status).json({ ok: false, error: { code, message } });

class ApiError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

module.exports = { ok, fail, ApiError };
