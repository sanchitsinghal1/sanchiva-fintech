import { cn } from '@/lib/utils';

export function SanchivaLogo({ className, withWordmark = true, size = 'md' }) {
  const sizes = {
    sm: { box: 'h-7 w-7', text: 'text-lg' },
    md: { box: 'h-9 w-9', text: 'text-xl' },
    lg: { box: 'h-12 w-12', text: 'text-2xl' },
  };
  const s = sizes[size];
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'relative grid place-items-center rounded-xl bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground shadow-lg shadow-primary/30',
          s.box
        )}
      >
        {/* abstract "S" monogram — a flowing stroke evoking motion/money */}
        <svg viewBox="0 0 24 24" fill="none" className="h-2/3 w-2/3">
          <path
            d="M16.5 7.5C16.5 5.3 14.5 4 12 4S7.5 5.3 7.5 7.5c0 4.5 9 3 9 7.5 0 2.2-2 3.5-4.5 3.5S7 17.7 7 15.5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent shadow-[0_0_8px] shadow-accent" />
      </div>
      {withWordmark && (
        <span className={cn('font-bold tracking-tight', s.text)}>
          Sanchiva
        </span>
      )}
    </div>
  );
}
