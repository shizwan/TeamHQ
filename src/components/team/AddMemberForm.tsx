'use client';

import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
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
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        aria-expanded={open}
        aria-controls="add-member-modal"
      >
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        Add Team Member
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Add New Team Member</h3>
              <button
                type="button"
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
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
                  className="text-sm font-medium text-slate-700"
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
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                  aria-required="true"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="member-role"
                  className="text-sm font-medium text-slate-700"
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
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                  aria-required="true"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="member-department"
                  className="text-sm font-medium text-slate-700"
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
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding Member…' : 'Add Member'}
                </button>
              </div>

              {error && (
                <p
                  className="text-sm text-rose-600 font-medium bg-rose-50 p-3 rounded-lg border border-rose-100"
                  role="alert"
                >
                  {error}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
