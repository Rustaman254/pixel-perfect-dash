import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useSSOSync } from '@/hooks/useSSOSync';
import { fetchWithAuth, BASE_URL } from '@/lib/api';

interface UserProfile {
  id: number;
  email: string;
  role: string;
  fullName: string;
  [key: string]: any;
}

interface AuthContextType {
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { setAuth: syncToSSO } = useSSOSync((syncedToken, syncedProfile) => {
    if (syncedToken && syncedProfile && !localStorage.getItem('auth_token')) {
      localStorage.setItem('auth_token', syncedToken);
      localStorage.setItem('sokostack_profile', JSON.stringify(syncedProfile));
      setToken(syncedToken);
      setUserProfile(syncedProfile);
      setIsAuthenticated(true);
    }
  });

  // Check for existing auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedProfile = localStorage.getItem('sokostack_profile');

    if (storedToken && storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);
        setToken(storedToken);
        setUserProfile(profile);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('sokostack_profile');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Login failed');
    }

    const data = await res.json();
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('sokostack_profile', JSON.stringify(data.user));
    setToken(data.token);
    setUserProfile(data.user);
    setIsAuthenticated(true);
    syncToSSO(data.token, data.user);
  };

  const register = async (regData: { email: string; password: string; fullName: string }) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Registration failed');
    }

    const data = await res.json();
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('sokostack_profile', JSON.stringify(data.user));
    setToken(data.token);
    setUserProfile(data.user);
    setIsAuthenticated(true);
    syncToSSO(data.token, data.user);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('sokostack_profile');
    setToken(null);
    setUserProfile(null);
    setIsAuthenticated(false);
    syncToSSO(null, null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userProfile, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
