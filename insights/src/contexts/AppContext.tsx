import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { useSSOSync } from '@/hooks/useSSOSync';
import { UserProfile } from './types';

interface AppContextType {
    userProfile: UserProfile | null;
    setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
    isAuthenticated: boolean;
    setIsAuthenticated: (val: boolean) => void;
    login: (userData: Partial<UserProfile>, token?: string) => void;
    logout: () => void;
    refreshData: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
        try {
            const saved = localStorage.getItem('ripplify_profile');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error("Failed to parse user profile from localStorage", e);
            return null;
        }
    });

    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        try {
            return !!localStorage.getItem('auth_token');
        } catch (e) {
            return false;
        }
    });

    const { setAuth: syncToSSO } = useSSOSync((token, profile) => {
        // Sync FROM SSO Hub on initial load
        if (token && !localStorage.getItem('auth_token')) {
            localStorage.setItem('auth_token', token);
            if (profile) {
                localStorage.setItem('ripplify_profile', JSON.stringify(profile));
                setUserProfile(profile);
            }
            setIsAuthenticated(true);
        }
    });

    const refreshData = async () => {
        if (!isAuthenticated) return;
        try {
            const profileData = await fetchWithAuth('/auth/me');
            if (profileData && profileData.user) {
                setUserProfile(profileData.user);
            } else if (profileData) {
                setUserProfile(profileData);
            }
        } catch (error) {
            console.error("Error refreshing profile data:", error);
            if (String(error).includes('401')) {
                logout();
            }
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            refreshData();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        try {
            if (userProfile) {
                localStorage.setItem('ripplify_profile', JSON.stringify(userProfile));
            } else {
                localStorage.removeItem('ripplify_profile');
            }
        } catch (e) {
            console.error("Failed to sync user profile to localStorage", e);
        }
    }, [userProfile]);

    const login = (userData: any, token?: string) => {
        setIsAuthenticated(true);
        setUserProfile(userData);
        if (token) {
            localStorage.setItem('auth_token', token);
            syncToSSO(token, userData);
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUserProfile(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('ripplify_profile');
        syncToSSO(null, null);
    };

    return (
        <AppContext.Provider value={{
            userProfile, setUserProfile,
            isAuthenticated, setIsAuthenticated,
            login, logout, refreshData
        }}>
            {children}
        </AppContext.Provider>
    );
};
