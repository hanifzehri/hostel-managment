import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
  const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);
  const warning = useCallback((msg, duration) => addToast(msg, 'warning', duration), [addToast]);

  return (
    <NotificationContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let accent = 'bg-blue-500 text-blue-400 border-blue-500/20';
          let Icon = Info;

          if (toast.type === 'success') {
            accent = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            Icon = CheckCircle2;
          } else if (toast.type === 'error') {
            accent = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
            Icon = AlertCircle;
          } else if (toast.type === 'warning') {
            accent = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
            Icon = AlertTriangle;
          }

          return (
            <div
              key={toast.id}
              className="animate-fade-in pointer-events-auto flex items-start p-4 rounded-2xl bg-slate-900/95 text-white border border-slate-700/80 shadow-2xl backdrop-blur-xl transition-all duration-300"
            >
              <div className={`p-2 rounded-xl border mr-3 shrink-0 ${accent}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xs sm:text-sm font-semibold flex-1 leading-snug pt-1 text-slate-100">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useToast = () => useContext(NotificationContext);
