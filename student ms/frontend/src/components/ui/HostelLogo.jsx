import React from 'react';

const HostelLogo = ({
  size = 'md', // sm, md, lg, xl
  showText = true,
  subtitle = 'Khuzdar, Balochistan',
  variant = 'default', // default, light, dark, card
  className = '',
}) => {
  const sizeMap = {
    sm: {
      badge: 'w-8 h-8 text-xs rounded-lg',
      rh: 'text-xs font-black tracking-tighter',
      title: 'text-sm font-extrabold',
      sub: 'text-[9px]',
    },
    md: {
      badge: 'w-10 h-10 text-sm rounded-xl',
      rh: 'text-sm font-black tracking-tighter',
      title: 'text-base font-extrabold',
      sub: 'text-[10px]',
    },
    lg: {
      badge: 'w-12 h-12 text-base rounded-2xl',
      rh: 'text-base font-black tracking-tight',
      title: 'text-lg font-black',
      sub: 'text-xs',
    },
    xl: {
      badge: 'w-16 h-16 text-xl rounded-2xl',
      rh: 'text-xl font-black tracking-tight',
      title: 'text-2xl font-black',
      sub: 'text-xs',
    },
    card: {
      badge: 'w-10 h-10 text-sm rounded-xl',
      rh: 'text-sm font-black tracking-tighter',
      title: 'text-sm font-black',
      sub: 'text-[8px]',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Emblem Badge: RH */}
      <div
        className={`${currentSize.badge} relative flex items-center justify-center font-black shadow-md shrink-0 bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-indigo-950 border border-amber-300/60 ring-2 ring-indigo-950/20`}
      >
        <span className={`${currentSize.rh} font-serif tracking-widest`}>RH</span>
      </div>

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
              className={`${currentSize.sub} uppercase tracking-wider font-semibold truncate ${
                variant === 'light'
                  ? 'text-amber-300/90'
                  : 'text-indigo-600 dark:text-amber-400'
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
