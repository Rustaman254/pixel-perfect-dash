const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:3007/api";
    }
  }
  return import.meta.env.VITE_API_URL || "https://ripplify.sokostack.xyz/api";
};

export const BASE_URL = getBaseUrl();
export const BACKEND_URL = BASE_URL.replace('/api', '');

export const SSO_HUB_URL = (() => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:3001/sso.html";
    }
  }
  return import.meta.env.VITE_SSO_URL || "https://auth.sokostack.xyz/sso.html";
})();

export const PRODUCTS = {
  ripplify: import.meta.env.VITE_RIPPLIFY_URL || "https://ripplify.sokostack.xyz",
  shopalize: import.meta.env.VITE_SHOPALIZE_URL || "https://shopalize.sokostack.xyz",
  watchtower: import.meta.env.VITE_WATCHTOWER_URL || "https://watchtower.sokostack.xyz",
  admin: import.meta.env.VITE_ADMIN_URL || "https://admin.sokostack.xyz",
};

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('ripplify_profile');
      localStorage.removeItem('admin_profile');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.message || `API request failed with status ${response.status}`) as Error & Record<string, any>;
    Object.keys(errorData).forEach(key => { err[key] = errorData[key]; });
    throw err;
  }

  return response.json();
};

export const publicFetch = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }

  return response.json();
};
