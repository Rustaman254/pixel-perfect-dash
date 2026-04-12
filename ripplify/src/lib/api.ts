const getBaseUrl = () => {
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (hostname === "localhost" || hostname === "127.0.0.1") {
            return "/api";
        }
    }
    return "http://localhost:3001";
};

export const BASE_URL = getBaseUrl();
export const BACKEND_URL = "http://localhost:3001";

// SSO hub URL - points to the same server
export const SSO_HUB_URL = (() => {
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (hostname === "localhost" || hostname === "127.0.0.1") {
            return "http://localhost:3001/sso.html";
        }
    }
    return "http://localhost:3001/sso.html";
})();

// Product switcher URLs
export const PRODUCTS = {
    ripplify: "http://localhost:8080",
    shopalize: "http://localhost:8081",
    watchtower: "http://localhost:8083",
    admin: "http://localhost:8082",
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
