import React from 'react';

const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'teal', // teal, emerald, amber, rose, sky, purple, navy, indigo
  trend,
  onClick,
}) => {
  const colorMap = {
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/60',
    navy: 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 border-slate-800 dark:border-slate-700',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200/80 dark:border-slate-700',
  };

  // Safe mapping for legacy color props
  const resolvedColor = colorMap[color] || (['teal', 'emerald', 'sky'].includes(color) ? colorMap.teal : colorMap.slate);

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-2xl hover:border-teal-500/40 dark:hover:border-teal-500/40 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
          {title}
        </p>
        <div className={`p-3 rounded-2xl border transition-transform duration-300 group-hover:scale-105 ${resolvedColor}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
        {trend && (
          <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200/50 dark:border-teal-800/50 px-2.5 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      {subtext && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">{subtext}</p>
      )}
    </div>
  );
};

export default StatCard;
