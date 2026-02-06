'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/** Minimum time (ms) a loading must last before showing the overlay */
const SHOW_DELAY_MS = 300;

type LoadingOverlayProps = {
  /** Whether the overlay is visible */
  visible: boolean;
  /** Optional message to display */
  message?: string;
  /** Additional class names */
  className?: string;
};

/**
 * Full-screen loading overlay with animated spinner.
 * Only renders after a short delay to avoid flash on fast loads.
 * Uses CSS animations for smooth transitions (no external dependencies).
 */
export function LoadingOverlay({
  visible,
  message = 'Loading...',
  className,
}: LoadingOverlayProps) {
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (visible) {
      timerRef.current = setTimeout(() => setShow(true), SHOW_DELAY_MS);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      // Defer to avoid synchronous setState in effect body
      queueMicrotask(() => setShow(false));
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible]);

  if (!show) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-background/80 backdrop-blur-sm',
        'animate-in fade-in-0 duration-200',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Modern spinner with gradient */}
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-muted-foreground/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
