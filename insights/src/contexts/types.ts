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
