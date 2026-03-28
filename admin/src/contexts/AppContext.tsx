import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchWithAuth, SSO_HUB_URL } from "@/lib/utils";

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  role: string;
  businessName: string;
  profilePictureUrl: string | null;
  isVerified: boolean;
  isDisabled?: boolean;
  isSuspended?: boolean;
  accountStatus?: string;
}

interface AppContextType {
  userProfile: UserProfile | null;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  isAuthenticated: boolean;
  login: (userData: Partial<UserProfile>, token?: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("admin_profile");
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("auth_token"));

  // SSO Sync
  useEffect(() => {
    if (typeof window === "undefined") return;
    const backendOrigin = new URL(SSO_HUB_URL).origin;
    const iframe = document.createElement("iframe");
    iframe.src = SSO_HUB_URL;
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== backendOrigin) return;
      if (event.data.type === "AUTH_STATE") {
        const { token, userProfile: profile } = event.data;
        if (token && !localStorage.getItem("auth_token")) {
          localStorage.setItem("auth_token", token);
          if (profile) {
            localStorage.setItem("admin_profile", JSON.stringify(profile));
            setUserProfile(profile);
          }
          setIsAuthenticated(true);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    iframe.onload = () => {
      iframe.contentWindow?.postMessage({ type: "GET_AUTH" }, backendOrigin);
    };
    return () => {
      window.removeEventListener("message", handleMessage);
      if (iframe.parentNode) document.body.removeChild(iframe);
    };
  }, []);

  // Persist profile
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem("admin_profile", JSON.stringify(userProfile));
    } else {
      localStorage.removeItem("admin_profile");
    }
  }, [userProfile]);

  const login = (userData: any, token?: string) => {
    setIsAuthenticated(true);
    setUserProfile(userData);
    if (token) {
      localStorage.setItem("auth_token", token);
      const backendOrigin = new URL(SSO_HUB_URL).origin;
      const iframe = document.querySelector(`iframe[src="${SSO_HUB_URL}"]`) as HTMLIFrameElement;
      iframe?.contentWindow?.postMessage({ type: "SET_AUTH", token, userProfile: userData }, backendOrigin);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserProfile(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("admin_profile");
    const backendOrigin = new URL(SSO_HUB_URL).origin;
    const iframe = document.querySelector(`iframe[src="${SSO_HUB_URL}"]`) as HTMLIFrameElement;
    iframe?.contentWindow?.postMessage({ type: "CLEAR_AUTH" }, backendOrigin);
  };

  return (
    <AppContext.Provider value={{ userProfile, setUserProfile, isAuthenticated, login, logout }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
