'use client';

import React, { useState, useEffect } from 'react';
import { Search, Trash2, Edit2 } from 'lucide-react';
import Link from 'next/link';
import type { PerformanceData } from '@/types';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

interface TeamTableProps {
  performanceData: PerformanceData[];
  onDeleteMember: (id: string, name: string) => void;
  onEditMember: (member: PerformanceData) => void;
}

function getCompletionColor(rate: number): string {
  if (rate > 70) return 'bg-emerald-500';
  if (rate > 40) return 'bg-amber-500';
  return 'bg-rose-500';
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export default function TeamTable({ performanceData, onDeleteMember, onEditMember }: TeamTableProps) {
  const [search, setSearch] = useState('');

  const filtered = performanceData.filter((member) =>
    member.name.toLowerCase().includes(search.toLowerCase()) ||
    member.role.toLowerCase().includes(search.toLowerCase()) ||
    member.department.toLowerCase().includes(search.toLowerCase())
  );

  const { currentItems, currentPage, totalPages, goToPage } = usePagination(filtered, 10);

  // Reset to page 1 when search changes
  useEffect(() => {
    goToPage(1);
  }, [search, goToPage]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search team members…"
          aria-label="Search team members"
          className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm">
            <caption className="sr-only">Team members performance overview</caption>
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  Role / Dept
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  Active Tasks
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  Completion Rate
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    {search
                      ? 'No team members match your search.'
                      : 'No team members yet.'}
                  </td>
                </tr>
              ) : (
                currentItems.map((member) => {
                  const activeTasks = member.inProgress + member.pending;
                  const rate = Math.round(member.completionRate);

                  return (
                    <tr
                      key={member.id}
                      className="transition-colors hover:bg-slate-50/60"
                    >
                      {/* Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link 
                          href={`/dashboard/team/${member.id}`}
                          className="flex items-center gap-3 group"
                        >
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors"
                            aria-hidden="true"
                          >
                            {getInitial(member.name)}
                          </div>
                          <span className="font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {member.name}
                          </span>
                        </Link>
                      </td>

                      {/* Role / Dept */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-slate-700">{member.role}</div>
                        {member.department && (
                          <div className="text-xs text-slate-400">
                            {member.department}
                          </div>
                        )}
                      </td>

                      {/* Active Tasks */}
                      <td className="px-6 py-4 text-center whitespace-nowrap font-medium text-slate-700">
                        {activeTasks}
                      </td>

                      {/* Completion Rate */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-2 w-24 overflow-hidden rounded-full bg-slate-100"
                            role="progressbar"
                            aria-valuenow={rate}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Completion rate: ${rate}%`}
                          >
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${getCompletionColor(rate)}`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-500 tabular-nums">
                            {rate}%
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEditMember(member)}
                            className="inline-flex items-center rounded-md p-1.5 text-slate-400 transition-colors hover:text-indigo-500 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                            aria-label={`Edit member ${member.name}`}
                          >
                            <Edit2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteMember(member.id, member.name)}
                            className="inline-flex items-center rounded-md p-1.5 text-slate-400 transition-colors hover:text-rose-500 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                            aria-label={`Delete member ${member.name}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={goToPage} 
        />
      </div>
    </div>
  );
}
