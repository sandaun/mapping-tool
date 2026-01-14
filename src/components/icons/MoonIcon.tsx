interface MoonIconProps {
  active?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function MoonIcon({
  active = false,
  className = '',
  style,
}: MoonIconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 512 512"
      className={className}
      style={style}
    >
      <defs>
        <linearGradient id="moonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path
        fill={active ? 'url(#moonGradient)' : 'currentColor'}
        d="M283.211 512c78.962 0 151.079-35.925 198.857-94.792 7.068-8.708-.639-21.43-11.562-19.35-124.203 23.654-238.262-71.576-238.262-196.954 0-72.222 38.662-138.635 101.498-174.394 9.686-5.512 7.25-20.197-3.756-22.23A258.156 258.156 0 0 0 283.211 0c-141.309 0-256 114.511-256 256 0 141.309 114.511 256 256 256z"
      />
    </svg>
  );
}
