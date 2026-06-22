'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import type { ToastType } from '@/types';

interface ToastStyleConfig {
  icon: React.ElementType;
  containerClass: string;
  iconClass: string;
}

const TOAST_STYLES: Record<ToastType, ToastStyleConfig> = {
  success: {
    icon: CheckCircle2,
    containerClass: 'border-emerald-200 bg-emerald-50',
    iconClass: 'text-emerald-500',
  },
  error: {
    icon: AlertCircle,
    containerClass: 'border-rose-200 bg-rose-50',
    iconClass: 'text-rose-500',
  },
  info: {
    icon: Info,
    containerClass: 'border-blue-200 bg-blue-50',
    iconClass: 'text-blue-500',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'border-amber-200 bg-amber-50',
    iconClass: 'text-amber-500',
  },
};

export default function Toast() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.type];
        const Icon = style.icon;

        return (
          <div
            key={toast.id}
            role="alert"
            aria-live="assertive"
            className={`toast-enter min-w-[320px] max-w-[420px] rounded-xl border p-4 shadow-lg transition-all ${style.containerClass}`}
          >
            <div className="flex items-start gap-3">
              <Icon
                className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconClass}`}
                aria-hidden="true"
              />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {toast.title}
                </p>
                {toast.description && (
                  <p className="mt-1 text-sm text-slate-600">
                    {toast.description}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/60 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
