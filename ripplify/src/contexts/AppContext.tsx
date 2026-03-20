import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { useSSOSync } from '@/hooks/useSSOSync';

// Common Types
export type LinkType = "reusable" | "one-time" | "donation";
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
    createdAt: string;
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
    category: "product" | "service";
    shippingFee: number;
    minDonation: number;
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

export interface Payout {
    id: number;
    userId: number;
    amount: number;
    currency: string;
    method: string;
    details: string;
    status: string;
    createdAt: string;
}

export interface Wallet {
    id: number;
    userId: number;
    currency_code: string;
    network: string;
    balance: number;
    locked_balance: number;
    address: string | null;
    createdAt: string;
    updatedAt: string;
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
    payouts: Payout[];
    setPayouts: React.Dispatch<React.SetStateAction<Payout[]>>;
    wallets: Wallet[];
    setWallets: React.Dispatch<React.SetStateAction<Wallet[]>>;
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
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
        const saved = localStorage.getItem('ripplify_profile');
        return saved ? JSON.parse(saved) : null;
    });
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return !!localStorage.getItem('auth_token');
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
            const [linksData, transactionsData, payoutsData, walletsData, profileData] = await Promise.all([
                fetchWithAuth('/links/my'),
                fetchWithAuth('/transactions/my'),
                fetchWithAuth('/payouts'),
                fetchWithAuth('/wallets').catch(() => []),
                fetchWithAuth('/auth/me').catch(() => null)
            ]);

            const formattedLinks = linksData.map((l: any) => ({
                ...l,
                url: `${window.location.origin}/pay/${l.slug}`,
                earned: `${l.currency} ${l.totalEarnedValue.toLocaleString()}`,
                created: new Date(l.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            }));

            setLinks(formattedLinks);
            setTransactions(transactionsData);
            setPayouts(payoutsData);
            setWallets(walletsData);
            if (profileData && profileData.user) {
                setUserProfile(profileData.user);
            } else if (profileData) {
                setUserProfile(profileData);
            }
        } catch (error) {
            console.error("Error refreshing data:", error);
            if (String(error).includes('401')) {
                logout();
            }
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            refreshData();

            const interval = setInterval(() => {
                refreshData();
            }, 10000);

            return () => clearInterval(interval);
        } else {
            setLinks([]);
            setTransactions([]);
            setPayouts([]);
            setWallets([]);
        }
    }, [isAuthenticated]);

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
            syncToSSO(token, userData);
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUserProfile(null);
        setLinks([]);
        setTransactions([]);
        setPayouts([]);
        setWallets([]);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('ripplify_profile');
        syncToSSO(null, null);
    };

    return (
        <AppContext.Provider value={{
            links, setLinks,
            transactions, setTransactions,
            payouts, setPayouts,
            wallets, setWallets,
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
