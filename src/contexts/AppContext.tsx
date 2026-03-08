import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/api';

// Common Types
export type LinkType = "reusable" | "one-time";
export type DealStatus = "Active" | "Waiting for payment" | "Funds locked" | "Shipped" | "Completed" | "Disputed" | "Expired" | "Used";
export type UserRole = "seller" | "admin";

export interface PaymentLink {
    id: number;
    userId: number;
    name: string;
    url: string;
    slug: string;
    clicks: number;
    earned: string;
    status: DealStatus;
    price: string;
    currency: string;
    created: string;
    description: string;
    linkType: LinkType;
    expiryDate: string | null;
    expiryLabel: string | null;
    deliveryDays: number | null;
    buyerName: string;
    buyerPhone: string;
    buyerEmail?: string;
    hasPhotos: boolean;
    paymentCount: number;
    totalEarnedValue: number;
}

export interface Transaction {
    id: number;
    userId: number;
    linkId: number | null;
    linkName?: string;
    linkSlug?: string;
    trackingToken?: string;
    buyerName: string;
    buyerEmail: string;
    buyerPhone: string;
    amount: number;
    currency: string;
    status: string;
    transactionId: string;
    type: string;
    createdAt: string;
}

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
    links: PaymentLink[];
    setLinks: React.Dispatch<React.SetStateAction<PaymentLink[]>>;
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    isAuthenticated: boolean;
    setIsAuthenticated: (val: boolean) => void;
    login: (userData: Partial<UserProfile>, token?: string) => void;
    logout: () => void;
    refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [links, setLinks] = useState<PaymentLink[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
        const saved = localStorage.getItem('ripplify_profile');
        return saved ? JSON.parse(saved) : null;
    });
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return !!localStorage.getItem('auth_token');
    });

    const refreshData = async () => {
        if (!isAuthenticated) return;
        try {
            const [linksData, transactionsData] = await Promise.all([
                fetchWithAuth('/links/my'),
                fetchWithAuth('/transactions/my')
            ]);

            const formattedLinks = linksData.map((l: any) => ({
                ...l,
                url: `${window.location.origin}/pay/${l.slug}`,
                earned: `${l.currency} ${l.totalEarnedValue.toLocaleString()}`,
                created: new Date(l.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            }));

            setLinks(formattedLinks);
            setTransactions(transactionsData);
        } catch (error) {
            console.error("Error refreshing data:", error);
        }
    };

    // Socket listeners removed - replaced globally by polling

    useEffect(() => {
        if (isAuthenticated) {
            refreshData();

            // Fallback polling every 10 seconds
            const interval = setInterval(() => {
                refreshData();
            }, 10000);

            return () => clearInterval(interval);
        } else {
            setLinks([]);
            setTransactions([]);
        }
    }, [isAuthenticated]);

    // ... rest of the file

    useEffect(() => {
        if (userProfile) {
            localStorage.setItem('ripplify_profile', JSON.stringify(userProfile));
        } else {
            localStorage.removeItem('ripplify_profile');
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
        setLinks([]);
        setTransactions([]);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('ripplify_profile');
    };

    return (
        <AppContext.Provider value={{
            links, setLinks,
            transactions, setTransactions,
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
