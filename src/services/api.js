import axios from 'axios';

const TOKEN_KEY = 'farahbooking_token';
const REFRESH_TOKEN_KEY = 'farahbooking_refresh_token';
const USER_KEY = 'farahbooking_user';

const API_URL = import.meta.env.VITE_API_URL || '/api';
// Origine du backend (sans le /api final), utilisee pour prefixer les chemins
// relatifs /uploads/... renvoyes par l'API (images, icones). En dev, le proxy
// Vite gere deja /uploads en local -> reste vide, chemins inchanges.
const BACKEND_ORIGIN = API_URL.replace(/\/api\/?$/, '');

// A appliquer sur tout chemin relatif venant de l'API (imageUrl, iconUrl...)
// avant de le passer a un <img src>. Renvoie tel quel les URLs deja absolues
// (http(s)://...) et les valeurs vides/nulles.
export function getMediaUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${BACKEND_ORIGIN}${path}`;
}

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Reecrit recursivement tout chemin /uploads/... trouve dans une reponse API
// en URL absolue vers le backend, pour que <img src={x.imageUrl}> fonctionne
// partout dans l'app sans devoir toucher chaque composant individuellement
// (frontend et backend sont sur des domaines separes en production).
function rewriteMediaUrls(value) {
  if (typeof value === 'string') {
    return value.startsWith('/uploads/') ? getMediaUrl(value) : value;
  }
  if (Array.isArray(value)) {
    return value.map(rewriteMediaUrls);
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      value[key] = rewriteMediaUrls(value[key]);
    }
    return value;
  }
  return value;
}

api.interceptors.response.use((response) => {
  if (BACKEND_ORIGIN) {
    response.data = rewriteMediaUrls(response.data);
  }
  return response;
});

function clearSessionAndRedirect() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = '/login';
}

// Le token d'acces expire au bout d'1h (CLAUDE.md - securite). Sur un 401,
// on tente un renouvellement silencieux via le refresh token avant de
// rejouer la requete d'origine ; sinon la session est vraiment terminee.
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute = originalRequest?.url?.startsWith('/auth/');

    if (error.response?.status !== 401 || originalRequest._retry || isAuthRoute) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      clearSessionAndRedirect();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise =
        refreshPromise ||
        axios.post('/api/auth/refresh-token', { refreshToken }).finally(() => {
          refreshPromise = null;
        });
      const { data } = await refreshPromise;

      localStorage.setItem(TOKEN_KEY, data.token);
      originalRequest.headers.Authorization = `Bearer ${data.token}`;
      return api(originalRequest);
    } catch (refreshError) {
      clearSessionAndRedirect();
      return Promise.reject(error);
    }
  }
);

export default api;
