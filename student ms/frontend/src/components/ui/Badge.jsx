import React from 'react';

const Badge = ({ children, variant = 'neutral', size = 'md', className = '' }) => {
  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
    info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
    teal: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
    navy: 'bg-slate-900 text-white border-slate-700 dark:bg-slate-800 dark:text-teal-200 dark:border-slate-600',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1 font-medium',
  };

  // Helper mapping for automatic string detection
  let chosenVariant = variant;
  const lower = String(children || '').toLowerCase();
  if (['active', 'paid', 'approved', 'available', 'resolved', 'present', 'good'].includes(lower)) {
    chosenVariant = 'success';
  } else if (['pending', 'partial', 'in progress', 'late', 'fair', 'double'].includes(lower)) {
    chosenVariant = 'warning';
  } else if (['inactive', 'overdue', 'rejected', 'suspended', 'absent', 'occupied', 'damaged', 'cancelled'].includes(lower)) {
    chosenVariant = 'danger';
  } else if (['checked out', 'maintenance', 'leave', 'triple', 'single'].includes(lower)) {
    chosenVariant = 'purple';
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-colors ${sizeStyles[size]} ${variantStyles[chosenVariant] || variantStyles.neutral} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {children}
    </span>
  );
};

export default Badge;
