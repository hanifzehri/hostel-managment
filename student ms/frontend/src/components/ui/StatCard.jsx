import React from 'react';

const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'blue', // blue, cyan, green, amber, red, navy, slate
  trend,
  onClick,
}) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/60',
    cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400 border-cyan-200/80 dark:border-cyan-800/60',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60',
    red: 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 border-red-200/80 dark:border-red-800/60',
    navy: 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 border-slate-800 dark:border-slate-700',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200/80 dark:border-slate-700',
  };

  const resolvedColor = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-2xl hover:border-blue-500/40 dark:hover:border-blue-500/40 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
          {title}
        </p>
        <div className={`p-3 rounded-2xl border transition-transform duration-200 group-hover:scale-105 ${resolvedColor}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
        {trend && (
          <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 px-2.5 py-1 rounded-full">
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
