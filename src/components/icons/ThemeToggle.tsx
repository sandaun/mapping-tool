import type { Theme } from '@/hooks/useTheme';

interface ThemeToggleIconProps {
  theme?: Theme;
  className?: string;
}

export function ThemeToggleIcon({
  theme = 'light',
  className = '',
}: ThemeToggleIconProps) {
  const isDark = theme === 'dark';

  // Estil compartit per a una animació fluida
  const springConfig = {
    transition:
      'transform 0.5s cubic-bezier(0.5, 1.25, 0.75, 1.25), opacity 0.5s ease',
    transformOrigin: 'center center',
  };

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className={className}>
      <mask id="moon-mask">
        <rect x="0" y="0" width="100%" height="100%" fill="white" />
        <circle
          cx="24"
          cy="10"
          r="6"
          fill="black"
          style={{
            ...springConfig,
            // Move the mask to make the "bite" of the moon
            transform: isDark
              ? 'translateX(-7px) translateY(2px)'
              : 'translateX(0px) translateY(0px)',
          }}
        />
      </mask>

      {/* Central circle (Sun or Moon body) */}
      <circle
        cx="12"
        cy="12"
        r="6"
        mask="url(#moon-mask)"
        fill="currentColor"
        style={{
          ...springConfig,
          // It gets bigger when it's the moon
          transform: isDark ? 'scale(1.75)' : 'scale(1)',
        }}
      />

      {/* Sun rays - Now thinner (strokeWidth 1.5 instead of 2) */}
      <g
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{
          ...springConfig,
          // They hide and rotate when it's dark mode
          opacity: isDark ? 0 : 1,
          transform: isDark
            ? 'rotate(-25deg) scale(0)'
            : 'rotate(0deg) scale(1)',
        }}
      >
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </g>
    </svg>
  );
}
