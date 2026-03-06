'use client';

import { createContext, useCallback, useContext, useReducer } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

type Action =
  | { type: 'ADD'; toast: Toast }
  | { type: 'REMOVE'; id: string };

function reducer(state: Toast[], action: Action): Toast[] {
  if (action.type === 'ADD') return [...state, action.toast];
  if (action.type === 'REMOVE') return state.filter((t) => t.id !== action.id);
  return state;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    const newToast: Toast = { id, type, message };
    dispatch({ type: 'ADD', toast: newToast });
    setTimeout(() => dispatch({ type: 'REMOVE', id }), 4000);
  }, []);

  const success = useCallback((message: string) => toast(message, 'success'), [toast]);
  const error = useCallback((message: string) => toast(message, 'error'), [toast]);
  const info = useCallback((message: string) => toast(message, 'info'), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      {/* Toaster */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            toast={t}
            onClose={() => dispatch({ type: 'REMOVE', id: t.id })}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ─── Toast item ───────────────────────────────────────────────────────────────

const STYLES: Record<ToastType, { bg: string; border: string; text: string; icon: React.ElementType }> = {
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: CheckCircle },
  error:   { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-800',     icon: AlertCircle },
  info:    { bg: 'bg-stone-900',  border: 'border-stone-700',   text: 'text-white',       icon: Info },
};

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const { bg, border, text, icon: Icon } = STYLES[toast.type];
  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border shadow-md text-sm max-w-sm
        ${bg} ${border} ${text} animate-in fade-in slide-in-from-bottom-2 duration-200`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={onClose}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity ml-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
