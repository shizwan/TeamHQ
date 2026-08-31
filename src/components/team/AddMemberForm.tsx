'use client';

import React, { useState } from 'react';
import { UserPlus, X, Loader2 } from 'lucide-react';
import { MAX_NAME_LENGTH, MAX_ROLE_LENGTH, MAX_DEPARTMENT_LENGTH } from '@/types';
import { validateMemberForm, sanitizeString } from '@/lib/validation';

interface AddMemberFormProps {
  onSubmit: (data: { name: string; role: string; department: string }) => Promise<void>;
  loading: boolean;
}

export default function AddMemberForm({ onSubmit, loading }: AddMemberFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      const validationError = validateMemberForm({ name, role, department });
      if (validationError) {
        setError(validationError);
        return;
      }

      await onSubmit({
        name: sanitizeString(name),
        role: sanitizeString(role),
        department: sanitizeString(department),
      });

      setName('');
      setRole('');
      setDepartment('');
      setError(null);
      setOpen(false);
    } catch (err: any) {
      console.error('Add member error:', err);
      setError(err?.message || 'Failed to add team member. Please try again.');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setName('');
    setRole('');
    setDepartment('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 cursor-pointer"
        aria-expanded={open}
        aria-controls="add-member-modal"
      >
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        Add Team Member
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Add New Team Member</h3>
              <button
                type="button"
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              id="add-member-modal"
              onSubmit={handleSubmit}
              className="p-6 space-y-4"
            >
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="member-name"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="member-name"
                  type="text"
                  required
                  maxLength={MAX_NAME_LENGTH}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jane Smith"
                  className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                  aria-required="true"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="member-role"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Role <span className="text-rose-500">*</span>
                </label>
                <input
                  id="member-role"
                  type="text"
                  required
                  maxLength={MAX_ROLE_LENGTH}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Frontend Engineer"
                  className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                  aria-required="true"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="member-department"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Department
                </label>
                <input
                  id="member-department"
                  type="text"
                  maxLength={MAX_DEPARTMENT_LENGTH}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Engineering"
                  className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                />
              </div>

              {error && (
                <p
                  className="text-sm text-rose-600 font-medium bg-rose-50 p-3 rounded-xl border border-rose-100"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Adding Member…' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
