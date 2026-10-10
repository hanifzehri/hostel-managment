import React from 'react';

const EmblemIcon = ({ className = 'w-10 h-10' }) => (
  <svg
    viewBox="0 0 200 200"
    className={`${className} shrink-0 drop-shadow-sm select-none`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="logoShieldNavy" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0F2238" />
        <stop offset="100%" stopColor="#070E17" />
      </linearGradient>
      <linearGradient id="logoRoyalGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="logoGoldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>

    {/* Outer Rounded Shield */}
    <path
      d="M 100 12 L 165 36 C 165 110 100 156 100 188 C 100 156 35 110 35 36 Z"
      fill="url(#logoShieldNavy)"
      stroke="url(#logoGoldBorder)"
      strokeWidth="5"
      strokeLinejoin="round"
    />

    {/* Inner Inset Shield Rim */}
    <path
      d="M 100 24 L 153 44 C 153 104 100 144 100 172 C 100 144 47 104 47 44 Z"
      fill="none"
      stroke="url(#logoRoyalGold)"
      strokeWidth="1.8"
      strokeDasharray="2 1"
      opacity="0.75"
    />

    {/* Royal Crown */}
    <path
      d="M 72 62 L 78 78 L 100 68 L 122 78 L 128 62 L 118 84 L 82 84 Z"
      fill="url(#logoRoyalGold)"
    />
    <circle cx="72" cy="60" r="3" fill="#FDE047" />
    <circle cx="100" cy="66" r="3.5" fill="#FDE047" />
    <circle cx="128" cy="60" r="3" fill="#FDE047" />

    {/* Architectural Hostel Gable */}
    <path
      d="M 100 90 L 132 110 L 132 144 L 68 144 L 68 110 Z"
      fill="#0B192C"
      stroke="url(#logoRoyalGold)"
      strokeWidth="3"
      strokeLinejoin="round"
    />

    {/* Hostel Arch Doorway */}
    <path
      d="M 90 144 V 122 C 90 116 110 116 110 122 V 144 Z"
      fill="url(#logoRoyalGold)"
    />

    {/* Hostel Windows */}
    <rect x="76" y="116" width="8" height="10" rx="1.5" fill="url(#logoRoyalGold)" />
    <rect x="116" y="116" width="8" height="10" rx="1.5" fill="url(#logoRoyalGold)" />

    {/* Subtitle Monogram */}
    <text
      x="100"
      y="162"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontSize="10"
      fontWeight="900"
      letterSpacing="2.5"
      textAnchor="middle"
      fill="#FFFFFF"
    >
      KHUZDAR
    </text>
  </svg>
);

const HostelLogo = ({
  size = 'md', // sm, md, lg, xl, card
  showText = true,
  subtitle = 'Khuzdar, Balochistan',
  variant = 'default', // default, light, dark, card
  className = '',
}) => {
  const sizeMap = {
    sm: {
      icon: 'w-7 h-7',
      title: 'text-sm font-extrabold',
      sub: 'text-[9px]',
    },
    md: {
      icon: 'w-9 h-9',
      title: 'text-base font-extrabold',
      sub: 'text-[10px]',
    },
    lg: {
      icon: 'w-12 h-12',
      title: 'text-lg font-black',
      sub: 'text-xs',
    },
    xl: {
      icon: 'w-16 h-16',
      title: 'text-2xl font-black',
      sub: 'text-xs',
    },
    card: {
      icon: 'w-9 h-9',
      title: 'text-sm font-black',
      sub: 'text-[8px]',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Official Emblem: Royal Shield & Crown */}
      <EmblemIcon className={currentSize.icon} />

      {showText && (
        <div className="min-w-0 leading-tight">
          <h2
            className={`${currentSize.title} tracking-tight font-extrabold truncate ${
              variant === 'light'
                ? 'text-white'
                : variant === 'dark'
                ? 'text-slate-900'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            Royal Hostel Khuzdar
          </h2>
          {subtitle && (
            <p
              className={`${currentSize.sub} uppercase tracking-wider font-bold truncate ${
                variant === 'light'
                  ? 'text-amber-300'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default HostelLogo;

