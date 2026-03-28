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
  isDisabled?: boolean;
  isSuspended?: boolean;
  accountStatus?: 'active' | 'disabled' | 'suspended' | 'unverified';
  suspendReason?: string;
  transactionLimit?: number;
  kycStatus?: string;
  kybStatus?: string;
}
