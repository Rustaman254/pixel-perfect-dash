const getBaseUrl = () => {
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (hostname === "localhost" || hostname === "127.0.0.1") {
            return "/api";
        }
        return "/api"; // Production needs /api prefix
    }
    return "/api";
};

const API_PREFIX = (() => {
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (hostname === "localhost" || hostname === "127.0.0.1") {
            return ""; // Vite proxy handles /api prefix
        }
        return "/api"; // Production needs /api prefix for nginx routing
    }
    return "/api";
})();

export const BASE_URL = getBaseUrl();
export const BACKEND_URL = "";

// SSO hub URL - points to the same server
export const SSO_HUB_URL = (() => {
    if (typeof window !== "undefined") {
        return window.location.origin + "/sso.html";
    }
    return "";
})();

// Product switcher URLs
export const PRODUCTS = {
    ripplify: "",
    shopalize: "",
    watchtower: "",
    admin: "",
};

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('auth_token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    const response = await fetch(`${API_PREFIX}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('ripplify_profile');
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
    const response = await fetch(`${API_PREFIX}${endpoint}`, {
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
