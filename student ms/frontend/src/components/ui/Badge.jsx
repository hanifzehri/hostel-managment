import React from 'react';

const Badge = ({ children, variant = 'neutral', size = 'md', className = '' }) => {
  const variantStyles = {
    teal: 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800',
    navy: 'bg-slate-900 text-white border-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
    outline: 'bg-transparent text-slate-600 border-slate-300 dark:text-slate-400 dark:border-slate-700',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1 font-medium',
  };

  // Safe mapping to our 4-color palette
  let chosenVariant = variantStyles[variant] ? variant : (['success', 'teal', 'info'].includes(variant) ? 'teal' : 'neutral');
  const lower = String(children || '').toLowerCase();
  if (['active', 'paid', 'approved', 'available', 'resolved', 'present', 'good', 'success', 'primary'].includes(lower)) {
    chosenVariant = 'teal';
  } else if (['admin', 'superadmin', 'owner', 'manager', 'full'].includes(lower)) {
    chosenVariant = 'navy';
  } else if (['pending', 'partial', 'in progress', 'late', 'fair', 'inactive', 'overdue', 'rejected', 'suspended', 'absent', 'occupied', 'damaged', 'cancelled'].includes(lower)) {
    chosenVariant = 'neutral';
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-colors ${sizeStyles[size]} ${variantStyles[chosenVariant]} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {children}
    </span>
  );
};

export default Badge;
