import { useAppContext } from "@/contexts/AppContext";

// Feature key to friendly name mapping
export const FEATURE_LABELS: Record<string, string> = {
    payment_links: "Payment Links",
    transactions: "Transactions",
    payouts: "Payouts",
    transfers: "Transfers",
    analytics: "Analytics & Statistics",
    customers: "Customers",
    currencies: "Currencies",
    wallets: "Wallets",
    orders: "Orders",
    payment_methods: "Payment Methods",
    referrals: "Referrals",
    developer_docs: "Developer Docs",
};

// Route to feature key mapping
export const ROUTE_FEATURES: Record<string, string> = {
    "/payment-links": "payment_links",
    "/orders": "orders",
    "/payment-methods": "payment_methods",
    "/currencies": "currencies",
    "/analytics": "analytics",
    "/statistics": "analytics",
    "/payouts": "payouts",
    "/transfers": "transfers",
    "/wallets": "wallets",
    "/wallet": "wallets",
    "/customers": "customers",
    "/developer-docs": "developer_docs",
    "/developer/settings": "developer_docs",
};

/**
 * Hook to check if a feature is enabled and get its label
 */
export function useFeature(featureKey: string) {
    const { isFeatureEnabled } = useAppContext();
    const enabled = isFeatureEnabled(featureKey);
    const label = FEATURE_LABELS[featureKey] || featureKey;

    return { enabled, label };
}

/**
 * Hook to get all disabled features
 */
export function useDisabledFeatures() {
    const { featureFlags } = useAppContext();
    const disabled: string[] = [];

    Object.entries(featureFlags).forEach(([key, isEnabled]) => {
        if (!isEnabled) {
            disabled.push(key);
        }
    });

    return disabled;
}
