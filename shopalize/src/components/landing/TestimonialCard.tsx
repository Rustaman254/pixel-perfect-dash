import { cn } from '@/lib/utils'
import { Play } from 'lucide-react'

interface TestimonialCardProps {
  name: string;
  role: string;
  quote: string;
  thumbnail?: string;
  className?: string;
}

export function TestimonialCard({ name, role, quote, thumbnail, className }: TestimonialCardProps) {
  return (
    <div
      className={cn(
        'group relative rounded-2xl overflow-hidden border border-white/[0.06] bg-[#222222] transition-all duration-300 hover:border-[#8A61E0]/30',
        className,
      )}
    >
      <div className="relative aspect-video bg-[#0A0E21] flex items-center justify-center overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={name}
            className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-[#0A0E21]" />
        )}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
        <button className="relative z-10 w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors group-hover:scale-110 transform duration-300">
          <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
        </button>
      </div>
      <div className="p-5">
        <p className="text-gray-300 text-sm leading-relaxed mb-4 line-clamp-3">"{quote}"</p>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#8A61E0] flex items-center justify-center text-white text-xs font-bold">
            {name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="text-white text-sm font-medium">{name}</p>
            <p className="text-gray-500 text-xs">{role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
