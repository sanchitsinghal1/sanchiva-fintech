import { cn, initials, GRADIENTS } from '@/lib/utils';

export function Avatar({ name, color, className, size = 'md' }) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
    xl: 'h-20 w-20 text-2xl',
  };
  const grad = GRADIENTS[color] || GRADIENTS.emerald;
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-md',
        grad,
        sizes[size],
        className
      )}
    >
      {initials(name) || 'S'}
    </div>
  );
}
