import React from 'react';

const LoadingSpinner = ({ text = 'Loading hostel records...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-14 h-14 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className="relative flex items-center justify-center">
        <div
          className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-teal-500/20 border-t-teal-600 dark:border-t-teal-400 animate-spin`}
        />
        <div
          className="absolute w-2 h-2 rounded-full bg-teal-500 animate-ping opacity-75"
        />
      </div>
      {text && (
        <p className="mt-4 text-xs sm:text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
