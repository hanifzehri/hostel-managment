import React from 'react';

const Badge = ({ children, variant = 'neutral', size = 'md', className = '' }) => {
  const variantStyles = {
    available:
      'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    success:
      'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    partial:
      'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    warning:
      'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    full:
      'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    danger:
      'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    primary:
      'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    cyan:
      'bg-cyan-50 text-cyan-700 border-cyan-300 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
    navy:
      'bg-slate-900 text-white border-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700',
    neutral:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
    outline:
      'bg-transparent text-slate-600 border-slate-300 dark:text-slate-400 dark:border-slate-700',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-bold',
    md: 'text-xs px-2.5 py-1 font-bold',
    lg: 'text-sm px-3 py-1.5 font-bold',
  };

  // Automatic semantic mapping based on status text
  let chosenVariant = variantStyles[variant] ? variant : 'neutral';
  const textStr = String(children || '').trim().toLowerCase();

  if (['available', 'active', 'paid', 'approved', 'resolved', 'present', 'success', 'good'].includes(textStr)) {
    chosenVariant = 'available';
  } else if (['partially occupied', 'partial', 'pending', 'warning', 'in progress', 'late'].includes(textStr)) {
    chosenVariant = 'partial';
  } else if (['full', 'overdue', 'rejected', 'error', 'danger', 'inactive', 'suspended', 'absent', 'damaged', 'cancelled'].includes(textStr)) {
    chosenVariant = 'full';
  } else if (['admin', 'superadmin', 'manager'].includes(textStr)) {
    chosenVariant = 'navy';
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs transition-colors ${sizeStyles[size]} ${variantStyles[chosenVariant]} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-80"></span>
      {children}
    </span>
  );
};

export default Badge;
