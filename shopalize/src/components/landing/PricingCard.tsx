import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingCardProps {
  title: string;
  price: string;
  period?: string;
  features: PricingFeature[];
  cta: string;
  popular?: boolean;
  onCtaClick?: () => void;
  className?: string;
}

export function PricingCard({ title, price, period = '/month', features, cta, popular, onCtaClick, className }: PricingCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border p-6 md:p-8 transition-all duration-300',
        popular
          ? 'border-[#8A61E0]/50 bg-[#222222]'
          : 'border-white/[0.06] bg-[#222222] hover:border-[#8A61E0]/30',
        className,
      )}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#8A61E0] text-white text-xs font-semibold">
          Most Popular
        </div>
      )}
      <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-4xl font-bold text-white">{price}</span>
        <span className="text-gray-500 text-sm">{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3">
            <div
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                feature.included
                  ? 'bg-[#8A61E0]/20 text-[#8A61E0]'
                  : 'bg-gray-800 text-gray-600',
              )}
            >
              <Check className="w-3 h-3" />
            </div>
            <span className={cn('text-sm', feature.included ? 'text-gray-300' : 'text-gray-600')}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>
      <button
        onClick={onCtaClick}
        className={cn(
          'w-full py-3 rounded-full text-sm font-semibold transition-all duration-300',
          popular
            ? 'bg-[#8A61E0] text-white hover:bg-[#7B52D1]'
            : 'border border-white/20 text-white hover:bg-white/5',
        )}
      >
        {cta}
      </button>
    </div>
  );
}
