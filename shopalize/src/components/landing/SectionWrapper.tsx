import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface SectionWrapperProps {
  children: ReactNode;
  className?: string;
  id?: string;
  fullWidth?: boolean;
}

export function SectionWrapper({ children, className, id, fullWidth }: SectionWrapperProps) {
  return (
    <section id={id} className={cn('relative py-16 md:py-24 px-4', className)}>
      <div className={cn(!fullWidth && 'max-w-7xl mx-auto')}>
        {children}
      </div>
    </section>
  );
}
