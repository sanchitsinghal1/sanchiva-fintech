'use client';
import { cn } from '@/lib/utils';

// Controlled slider built on a range input — styled to match Sanchiva.
export function Slider({ value, onValueChange, min = 0, max = 100, step = 1, className }) {
  const pct = ((Number(value) - min) / (max - min)) * 100;
  return (
    <div className={cn('relative flex h-5 items-center', className)}>
      <div className="absolute h-2 w-full rounded-full bg-muted" />
      <div
        className="absolute h-2 rounded-full bg-primary"
        style={{ width: `${pct}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onValueChange?.([Number(e.target.value)])}
        className="relative w-full cursor-pointer appearance-none bg-transparent
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary
          [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2
          [&::-moz-range-thumb]:border-primary"
      />
    </div>
  );
}
