import axios from 'axios';
import Cookies from 'js-cookie';

// Priority: NEXT_PUBLIC_API_URL env var → dev/prod auto-detect
// NEXT_PUBLIC_* vars are baked in at build time by Next.js.
// .env.local  → used during `next dev`   (localhost:8000)
// .env.production → used during `next build` (surgimedsupplies.com/aero-api)
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'production'
    ? 'https://api.myonlinequran.co.uk/'
    : 'http://localhost:8000');

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// ── Module-level: set X-Department-Id synchronously before any component mounts ──
// Reads the active_dept cookie directly (no async, no context required).
// This fires the moment api.js is first imported — before any useEffect runs —
// so the first request from any listing component already carries the header.
if (typeof document !== 'undefined') {
  const match = document.cookie.match(/(?:^|;\s*)active_dept=([^;]+)/);
  if (match) {
    api.defaults.headers.common['X-Department-Id'] = match[1];
  }
}

// ── Request interceptor: token + department header on every request ───────────
// Uses Axios v1.x AxiosHeaders API (.get() / .set()) for reliable header access.
// Falls back to the active_dept cookie in case the default header was cleared
// (e.g. after logout/login cycle before DepartmentContext re-applies it).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  if (!config.headers.get('X-Department-Id')) {
    const match = document.cookie.match(/(?:^|;\s*)active_dept=([^;]+)/);
    if (match) {
      config.headers.set('X-Department-Id', match[1]);
    }
  }

  return config;
});

/**
 * Login — stores the token in both localStorage (for Axios interceptor) AND
 * cookies (for Next.js Edge middleware which cannot read localStorage).
 *
 * Also writes two additional cookies synchronously before returning, so the
 * Edge middleware already sees them on the very first navigation after login:
 *
 *   active_dept  – ID of the user's first department (if any).  Used by the
 *                  middleware to decide whether to show the pending page.
 *   user_roles   – Comma-separated global role names (e.g. "SuperAdmin").
 *                  Used by the middleware to exempt privileged accounts from
 *                  the department requirement.
 */
export const login = async (email, password) => {
  const response = await api.post('api/login', { email, password });
  const { token, user } = response.data;

  localStorage.setItem('token', token);
  Cookies.set('token', token, { expires: 1, sameSite: 'lax' });

  // Write active_dept immediately so Edge middleware doesn't redirect to /pending-assignment/
  const firstDept = user?.departments?.[0];
  if (firstDept) {
    Cookies.set('active_dept', String(firstDept.id), { expires: 7, sameSite: 'lax' });
  } else {
    Cookies.remove('active_dept');
  }

  // Write global roles so middleware can exempt SuperAdmin/admin from the dept check
  const globalRoles = (user?.roles ?? []).map((r) => r.name).join(',');
  if (globalRoles) {
    Cookies.set('user_roles', globalRoles, { expires: 1, sameSite: 'lax' });
  } else {
    Cookies.remove('user_roles');
  }

  return response;
};

export const register = async (name, email, password, password_confirmation) => {
  return api.post('/api/register', { name, email, password, password_confirmation });
};

/**
 * Logout — clears token from all storage layers and resets the department headers.
 */
export const logout = async () => {
  try {
    await api.get('api/logout');
  } finally {
    localStorage.removeItem('token');
    Cookies.remove('token');
    Cookies.remove('active_dept');
    Cookies.remove('user_perms');
    Cookies.remove('user_roles');
    delete api.defaults.headers.common['X-Department-Id'];
  }
};

export default api;
