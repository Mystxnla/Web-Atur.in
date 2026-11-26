import { useAuthStore } from '../../stores/authStore.js';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function req(method, path, body) {
  const token = useAuthStore.getState().accessToken;

  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  // Auto-refresh jika 401
  if (res.status === 401 && !path.includes('/auth/')) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return req(method, path, body); // retry sekali
    }
    useAuthStore.getState().clearAuth();
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    window.location.href = isAdminRoute ? '/admin/login' : '/lacak-pesanan';
    throw new Error('Sesi berakhir.');
  }

  if (!res.ok) {
    const err = new Error(data.error ?? res.statusText);
    err.status = res.status;
    err.fields = data.fields;
    throw err;
  }

  return data;
}

async function tryRefresh() {
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const { accessToken } = await res.json();
    useAuthStore.getState().setAccessToken(accessToken);
    return true;
  } catch {
    return false;
  }
}

export const authApi = {
  register: (data)   => req('POST', '/auth/register', data),
  login:    (data)   => req('POST', '/auth/login', data),
  logout:   ()       => req('POST', '/auth/logout'),
  me:       ()       => req('GET',  '/auth/me'),
  refresh:  ()       => tryRefresh(),
};

export const adminApi = {
  dashboard:        ()                    => req('GET',   '/admin/dashboard'),
  orders:           (params = '')         => req('GET',   `/admin/orders${params}`),
  orderDetail:      (id)                  => req('GET',   `/admin/orders/${id}`),
  updateStatus:     (id, status, catatan) => req('PATCH', `/admin/orders/${id}/status`, { status, catatan }),
  updateDelivery:   (id, data)            => req('PATCH', `/admin/orders/${id}/delivery`, data),
  users:            ()                    => req('GET',   '/admin/users'),
  toggleUser:       (id)                  => req('PATCH', `/admin/users/${id}/toggle`),
  leads:            ()                    => req('GET',   '/admin/leads'),
  createAdmin:      (data)               => req('POST',  '/admin/admins', data),
};
