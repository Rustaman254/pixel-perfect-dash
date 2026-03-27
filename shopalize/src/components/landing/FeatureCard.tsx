import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({ icon: Icon, title, description, className }: FeatureCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border border-white/[0.06] bg-[#222222] p-6 md:p-8 transition-all duration-300 hover:border-[#8A61E0]/30',
        className,
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-[#8A61E0]/15 flex items-center justify-center mb-5">
        <Icon className="w-6 h-6 text-[#8A61E0]" />
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
