import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "/api";
    }
    return "/api";
  }
  return "/api";
};

export const BASE_URL = getBaseUrl();

export const SSO_HUB_URL = (() => {
  if (typeof window !== "undefined") {
    return window.location.origin + "/sso.html";
  }
  return "";
})();

export const PRODUCTS = {
  ripplify: "",
  shopalize: "",
  watchtower: "",
  admin: "",
};

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("auth_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("admin_profile");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.message || `API request failed with status ${response.status}`) as Error & Record<string, any>;
    Object.keys(errorData).forEach((key) => { err[key] = errorData[key]; });
    throw err;
  }

  return response.json();
};

export const publicFetch = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers as Record<string, string> || {}) },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  return response.json();
};

// Project-aware fetch: calls /api/admin/{project}/{endpoint}
export const projectFetch = async (projectId: string, endpoint: string, options: RequestInit = {}) => {
  return fetchWithAuth(`/admin/${projectId}/${endpoint}`, options);
};
