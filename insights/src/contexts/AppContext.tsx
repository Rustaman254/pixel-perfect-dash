import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/api';

// Common Types
export type LinkType = "reusable" | "one-time" | "donation";
export type DealStatus = "Active" | "Waiting for payment" | "Funds locked" | "Shipped" | "Completed" | "Disputed" | "Expired" | "Used";
export type UserRole = "seller" | "admin";

export interface UserProfile {
    id: number;
    businessName: string;
    fullName: string;
    email: string;
    phone: string;
    website: string;
    description: string;
    country: string;
    currency: string;
    profilePictureUrl: string | null;
    role: UserRole;
    location: string;
    payoutMethod: string;
    payoutDetails: string;
    isVerified: boolean;
}

interface AppContextType {
    userProfile: UserProfile | null;
    setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
    isAuthenticated: boolean;
    setIsAuthenticated: (val: boolean) => void;
    login: (userData: Partial<UserProfile>, token?: string) => void;
    logout: () => void;
    refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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
            // If fetching me fails with auth error, logout
            if (String(error).includes('401') || String(error).includes('Unauthorized')) {
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
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUserProfile(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('ripplify_profile');
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

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
