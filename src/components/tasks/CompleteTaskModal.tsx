'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle2, Clock, Calendar, AlertTriangle, Loader2, Check } from 'lucide-react';
import type { Task, SlipCause } from '@/types';
import { SLIP_CAUSES, TIME_SLOTS } from '@/types';
import { 
  calculateDelayHours, 
  calculateOnTimeStatus, 
  formatTimeString, 
  time12To24, 
  time24To12, 
  parseDateWithTime 
} from '@/lib/trackerEngine';

export interface CompletionData {
  status: 'Completed';
  completedDate: string;
  completedTime: string;
  completedAt: string;
  slipCause?: SlipCause;
}

interface CompleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onConfirm: (taskId: string, completionData: CompletionData) => Promise<void>;
  loading?: boolean;
}

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function CompleteTaskModal({
  isOpen,
  onClose,
  task,
  onConfirm,
  loading = false,
}: CompleteTaskModalProps) {
  const [completedDate, setCompletedDate] = useState('');
  const [completedTime, setCompletedTime] = useState('10:00 PM');
  const [slipCause, setSlipCause] = useState<SlipCause>('N/A');
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (task && isOpen) {
      setError(null);
      
      // Determine initial date
      if (task.completedDate) {
        try {
          const d = new Date(task.completedDate);
          if (!isNaN(d.getTime())) {
            setCompletedDate(getLocalDateString(d));
          } else {
            setCompletedDate(getLocalDateString());
          }
        } catch {
          setCompletedDate(getLocalDateString());
        }
      } else {
        setCompletedDate(getLocalDateString());
      }

      // Determine initial time
      if (task.completedTime) {
        setCompletedTime(task.completedTime);
      } else {
        setCompletedTime(formatTimeString(new Date()));
      }

      // Determine initial slip cause
      setSlipCause((task.slipCause as SlipCause) || 'N/A');
    }
  }, [task, isOpen]);

  // Derived target due date & time
  const targetDueDateStr = useMemo(() => {
    if (!task) return null;
    const due = task.targetDueDate || task.dueDate;
    if (!due) return null;
    try {
      const d = new Date(due);
      return !isNaN(d.getTime()) ? getLocalDateString(d) : null;
    } catch {
      return null;
    }
  }, [task]);

  const targetDueTimeStr = task?.targetDueTime || '10:00 PM';

  // Live delay & SLA calculation
  const { delayHours, onTimeStatus, isLate } = useMemo(() => {
    if (!task || !completedDate) {
      return { delayHours: 0, onTimeStatus: 'Pending' as const, isLate: false };
    }
    const due = task.targetDueDate || task.dueDate;
    const hrs = calculateDelayHours(due, task.targetDueTime || '10:00 PM', completedDate, completedTime, 'Completed');
    const status = calculateOnTimeStatus('Completed', due, task.targetDueTime || '10:00 PM', completedDate, completedTime);
    return {
      delayHours: hrs,
      onTimeStatus: status,
      isLate: hrs > 0,
    };
  }, [task, completedDate, completedTime]);

  if (!isOpen || !task) return null;

  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // "HH:mm"
    if (val) {
      setCompletedTime(time24To12(val));
    }
  };

  const handleSetToday = () => {
    setCompletedDate(getLocalDateString(new Date()));
  };

  const handleSetYesterday = () => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    setCompletedDate(getLocalDateString(y));
  };

  const handleSetTargetDate = () => {
    if (targetDueDateStr) {
      setCompletedDate(targetDueDateStr);
    }
  };

  const handleSetCurrentTime = () => {
    setCompletedTime(formatTimeString(new Date()));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!completedDate) {
      setError('Please select a completion date.');
      return;
    }

    if (!completedTime) {
      setError('Please select a completion time.');
      return;
    }

    const calculatedCompletedAt = parseDateWithTime(completedDate, completedTime) || new Date();

    try {
      await onConfirm(task.id, {
        status: 'Completed',
        completedDate,
        completedTime,
        completedAt: calculatedCompletedAt.toISOString(),
        slipCause: isLate ? slipCause : (slipCause || 'N/A'),
      });
      onClose();
    } catch (err: any) {
      console.error('Error completing task:', err);
      setError(err?.message || 'Failed to complete task. Please try again.');
    }
  };

  const time24Value = time12To24(completedTime);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-deliverable-title"
    >
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="complete-deliverable-title" className="text-lg font-bold text-slate-900">
                Complete Deliverable
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Record the precise completion date and time for SLA accuracy.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Task Info Summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200/60">
                {task.deliverableId || 'Deliverable'}
              </span>
              <span className="text-xs text-slate-400 font-medium">Target ETA:</span>
              <span className="text-xs font-semibold text-slate-700">
                {targetDueDateStr ? new Date(targetDueDateStr + 'T00:00:00').toLocaleDateString() : 'None'} at {targetDueTimeStr}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900 line-clamp-2">
              {task.title}
            </p>
          </div>

          {/* Date & Time Input Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Completion Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  Completion Date <span className="text-rose-500">*</span>
                </span>
              </label>
              <input
                type="date"
                required
                value={completedDate}
                onChange={(e) => setCompletedDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
              
              {/* Date Quick Buttons */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSetToday}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={handleSetYesterday}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Yesterday
                </button>
                {targetDueDateStr && (
                  <button
                    type="button"
                    onClick={handleSetTargetDate}
                    className="px-2 py-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Target Date
                  </button>
                )}
              </div>
            </div>

            {/* Completion Time */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Completion Time <span className="text-rose-500">*</span>
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  required
                  value={time24Value}
                  onChange={handleTimeInputChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
                <span className="shrink-0 px-2.5 py-2 bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl">
                  {completedTime}
                </span>
              </div>

              {/* Time Quick Presets */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSetCurrentTime}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Now
                </button>
                <button
                  type="button"
                  onClick={() => setCompletedTime(targetDueTimeStr)}
                  className="px-2 py-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                >
                  {targetDueTimeStr}
                </button>
                {['05:00 PM', '10:00 PM'].filter((t) => t !== targetDueTimeStr).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCompletedTime(preset)}
                    className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                      completedTime === preset ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time SLA & Delay Status Preview Card */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isLate
                ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isLate ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {isLate ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-75">
                    Calculated SLA Performance
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                      isLate ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'
                    }`}
                  >
                    {isLate ? `Delayed (+${delayHours} hrs)` : '🟢 On-Time (0 hrs)'}
                  </span>
                </div>
                <p className="text-xs font-medium mt-1">
                  {isLate
                    ? `Completion is ${delayHours} hour${delayHours !== 1 ? 's' : ''} past the target ETA (${targetDueTimeStr}). Delay metrics will be logged.`
                    : `Completion is on or before the target deadline. Recorded as 100% On-Time.`}
                </p>
              </div>
            </div>
          </div>

          {/* Slip Cause Selector (Shown always, but highlighted when delayed) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Slip Cause / Accountability
              </label>
              {isLate && (
                <span className="text-[11px] font-bold text-rose-600">
                  Required for delayed tasks
                </span>
              )}
            </div>
            <select
              value={slipCause}
              onChange={(e) => setSlipCause(e.target.value as SlipCause)}
              className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 cursor-pointer ${
                isLate && slipCause === 'N/A'
                  ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20'
              }`}
            >
              {SLIP_CAUSES.map((cause) => (
                <option key={cause} value={cause}>
                  {cause} {cause === 'N/A' && '(No Delay / None)'}
                </option>
              ))}
            </select>
            {isLate && slipCause === 'N/A' && (
              <p className="text-xs text-rose-600 font-medium mt-1">
                Tip: Categorize the cause (e.g. Scope Drift, Dependency, Developer) to help team analytics.
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm & Complete
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
