const getBaseUrl = () => {
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (hostname === "localhost" || hostname === "127.0.0.1") {
            return "http://localhost:3002/api";
        }
    }
    return import.meta.env.VITE_API_URL || "https://ripplify.sokostack.xyz/api";
};

export const BASE_URL = getBaseUrl();
export const BACKEND_URL = BASE_URL.replace('/api', '');

// SSO hub URL - points to auth service
export const SSO_HUB_URL = (() => {
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (hostname === "localhost" || hostname === "127.0.0.1") {
            return "http://localhost:3001/sso.html";
        }
    }
    return import.meta.env.VITE_SSO_URL || "https://auth.sokostack.xyz/sso.html";
})();

// Product switcher URLs
export const PRODUCTS = {
    ripplify: import.meta.env.VITE_RIPPLIFY_URL || "https://ripplify.sokostack.xyz",
    shopalize: import.meta.env.VITE_SHOPALIZE_URL || "https://shopalize.sokostack.xyz",
    watchtower: import.meta.env.VITE_WATCHTOWER_URL || "https://watchtower.sokostack.xyz",
    admin: import.meta.env.VITE_ADMIN_URL || "https://admin.sokostack.xyz",
};

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('auth_token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('sokostack_profile');
            // Prevent redirect loop if already on login page
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        const errorData = await response.json().catch(() => ({}));
        const err = new Error(errorData.message || `API request failed with status ${response.status}`) as Error & Record<string, any>;
        // Attach all error response fields so frontend can use them (e.g., redirectTo)
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
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    return response.json();
};
