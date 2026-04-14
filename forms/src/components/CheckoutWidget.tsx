import React from 'react';
import { ShoppingBag, ShieldCheck, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckoutWidgetProps {
    amount: number;
    currency: string;
    productName: string;
    onCheckout?: () => void;
    className?: string;
    variant?: 'primary' | 'outline' | 'compact';
}

const CheckoutWidget: React.FC<CheckoutWidgetProps> = ({
    amount,
    currency,
    productName,
    onCheckout,
    className,
    variant = 'primary'
}) => {
    const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount);

    const baseStyles = "relative flex items-center justify-between gap-4 p-4 rounded-2xl transition-all duration-300 group cursor-pointer overflow-hidden border";
    
    const variants = {
        primary: "bg-[#025864] text-white border-transparent hover:bg-[#013a42] shadow-lg shadow-[#025864]/20",
        outline: "bg-white text-[#025864] border-[#025864] hover:bg-slate-50 shadow-sm",
        compact: "bg-white text-slate-900 border-slate-200 hover:border-[#025864] p-3 shadow-none"
    };

    return (
        <div 
            onClick={onCheckout}
            className={cn(baseStyles, variants[variant], className)}
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "p-2.5 rounded-xl transition-colors shrink-0",
                    variant === 'primary' ? "bg-white/10" : "bg-[#025864]/10"
                )}>
                    <ShoppingBag className={cn("w-5 h-5", variant === 'primary' ? "text-white" : "text-[#025864]")} />
                </div>
                <div>
                    <p className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        variant === 'primary' ? "text-white/60" : "text-[#025864]/60"
                    )}>
                        Escrow Protected Checkout
                    </p>
                    <h4 className="text-sm font-bold truncate max-w-[150px]">
                        Pay {formattedAmount}
                    </h4>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex flex-col items-end mr-1">
                    <div className="flex items-center gap-1">
                        <ShieldCheck className={cn("w-3.5 h-3.5", variant === 'primary' ? "text-emerald-400" : "text-emerald-500")} />
                        <span className={cn("text-[9px] font-bold uppercase", variant === 'primary' ? "text-white/80" : "text-slate-500")}>
                            Secure
                        </span>
                    </div>
                </div>
                <ChevronRight className={cn(
                    "w-5 h-5 transition-transform group-hover:translate-x-0.5",
                    variant === 'primary' ? "text-white/40" : "text-slate-300"
                )} />
            </div>

            {/* Subtle glow effect for primary variant */}
            {variant === 'primary' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
            )}
        </div>
    );
};

export default CheckoutWidget;
