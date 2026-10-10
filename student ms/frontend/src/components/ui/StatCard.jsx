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
    teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200/40 dark:border-teal-800/50',
    navy: 'bg-slate-900/10 text-slate-800 dark:text-teal-200 border-slate-700/40 dark:border-slate-700/50',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/40 dark:border-indigo-800/50',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/40 dark:border-emerald-800/50',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/40 dark:border-amber-800/50',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/40 dark:border-rose-800/50',
    sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200/40 dark:border-sky-800/50',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200/40 dark:border-purple-800/50',
  };

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-2xl hover:border-slate-300 dark:hover:border-slate-700 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
          {title}
        </p>
        <div className={`p-3 rounded-2xl border transition-transform duration-300 group-hover:scale-110 ${colorMap[color] || colorMap.teal}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
        {trend && (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/50 px-2.5 py-1 rounded-full">
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
