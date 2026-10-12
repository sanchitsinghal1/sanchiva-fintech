'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi } from 'lucide-react';
import { cn, maskCard } from '@/lib/utils';

const NETWORK_LABEL = {
  VISA: 'VISA',
  MASTERCARD: 'MC',
  AMEX: 'AMEX',
};

/**
 * VirtualCard — a 3D-flipping premium card face.
 *   - `reveal` flips the card 180° on the Y axis to show the back (CVV).
 *   - `frozen` dims + overlays a frost effect.
 *   - `color` keys into the .card-<color> gradient classes (see globals.css).
 */
export function VirtualCard({ card, reveal = false, frozen = false, className }) {
  return (
    <div className={cn('perspective-1000', className)}>
      <motion.div
        className="relative aspect-[1.586] w-full preserve-3d transition-transform duration-700"
        animate={{ rotateY: reveal ? 180 : 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* --- Front --- */}
        <div
          className={cn(
            'card absolute inset-0 flex flex-col justify-between rounded-2xl p-5 text-white shadow-2xl backface-hidden',
            `card-${card.color}`
          )}
        >
          {frozen && (
            <div className="absolute inset-0 z-10 rounded-2xl bg-blue-100/20 backdrop-blur-md" />
          )}
          <div className="relative z-20 flex items-start justify-between">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 backdrop-blur">
              <span className="text-xs font-bold">S</span>
            </div>
            <Wifi className="h-5 w-5 rotate-90 opacity-90" />
          </div>

          {/* Chip */}
          <div className="relative z-20 mt-2 h-8 w-11 rounded-md bg-gradient-to-br from-yellow-200 to-amber-400 shadow-inner" />

          <div className="relative z-20 font-mono text-base tracking-[0.15em] sm:text-lg">
            {maskCard(card.cardNumber)}
          </div>

          <div className="relative z-20 flex items-end justify-between">
            <div>
              <div className="text-[9px] uppercase tracking-widest opacity-70">Cardholder</div>
              <div className="text-sm font-medium">{card.cardHolder}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-widest opacity-70">Valid thru</div>
              <div className="text-sm font-medium">
                {card.expiryMonth}/{card.expiryYear}
              </div>
            </div>
            <div className="ml-3 text-sm font-bold italic tracking-tight">
              {NETWORK_LABEL[card.network] || card.network}
            </div>
          </div>
        </div>

        {/* --- Back --- */}
        <div
          className={cn(
            'card absolute inset-0 flex flex-col rounded-2xl text-white shadow-2xl backface-hidden rotate-y-180',
            `card-${card.color}`
          )}
        >
          <div className="h-10 w-full bg-black/40" />
          <div className="px-5 pt-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-8 rounded bg-white/80" />
              <div className="grid h-8 w-16 place-items-center rounded bg-white font-mono text-sm font-bold text-black">
                {reveal ? card.__cvv || '•••' : '•••'}
              </div>
            </div>
            <p className="mt-3 text-[10px] leading-snug text-white/70">
              Authorized signature not required if the card is present. For customer service call
              1800-SANCHIVA. This card is the property of Sanchiva Bank.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
