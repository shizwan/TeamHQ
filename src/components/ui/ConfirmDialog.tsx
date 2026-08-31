'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, Trash2, Loader2, Archive, ArchiveRestore, CheckCircle2, ArrowRightLeft } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'archive' | 'unarchive' | 'success' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const VARIANT_CONFIG = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    confirmBg:
      'bg-rose-600 hover:bg-rose-700 focus-visible:outline-rose-600',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    confirmBg:
      'bg-amber-600 hover:bg-amber-700 focus-visible:outline-amber-600',
  },
  archive: {
    icon: Archive,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    confirmBg:
      'bg-indigo-600 hover:bg-indigo-700 focus-visible:outline-indigo-600',
  },
  unarchive: {
    icon: ArchiveRestore,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    confirmBg:
      'bg-indigo-600 hover:bg-indigo-700 focus-visible:outline-indigo-600',
  },
  success: {
    icon: CheckCircle2,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    confirmBg:
      'bg-emerald-600 hover:bg-emerald-700 focus-visible:outline-emerald-600',
  },
  info: {
    icon: ArrowRightLeft,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    confirmBg:
      'bg-blue-600 hover:bg-blue-700 focus-visible:outline-blue-600',
  },
} as const;

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.danger;
  const Icon = config.icon;

  // Focus the cancel button when the dialog opens
  useEffect(() => {
    if (open) {
      cancelButtonRef.current?.focus();
    }
  }, [open]);

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onCancel();
      }
    },
    [onCancel, loading],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  // Click outside to close
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (
        !loading &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        onCancel();
      }
    },
    [onCancel, loading],
  );

  if (!open) return null;

  return (
    <div
      className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      aria-hidden="true"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="dialog-content mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        {/* Icon */}
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${config.iconBg}`}
        >
          <Icon className={`h-6 w-6 ${config.iconColor}`} />
        </div>

        {/* Content */}
        <div className="mt-4 text-center">
          <h2
            id="confirm-dialog-title"
            className="text-lg font-semibold text-slate-900"
          >
            {title}
          </h2>
          <p
            id="confirm-dialog-description"
            className="mt-2 text-sm text-slate-500"
          >
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${config.confirmBg}`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
