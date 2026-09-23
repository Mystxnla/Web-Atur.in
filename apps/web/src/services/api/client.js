const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(method, path, body, opts = {}) {
  const url = `${BASE}${path}`;
  const isFormData = body instanceof FormData;
  const res = await fetch(url, {
    method,
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    signal: opts.signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error ?? res.statusText, res.status, data.code);
  }
  return data;
}

export const api = {
  get: (path, opts) => request('GET', path, null, opts),
  post: (path, body, opts) => request('POST', path, body, opts),
  patch: (path, body, opts) => request('PATCH', path, body, opts),
};
