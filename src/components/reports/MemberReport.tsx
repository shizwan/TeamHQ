'use client';

import React, { useMemo } from 'react';
import type { PerformanceData, Task, Project } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import { calculateTaskDelay } from '@/lib/validation';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

interface MemberReportProps {
  member: PerformanceData;
  tasks: Task[];
  projects?: Project[];
}

const MemberReport = React.memo(function MemberReport({
  member,
  tasks,
  projects = [],
}: MemberReportProps) {
  const memberTasks = useMemo(
    () => tasks.filter((t) => t.assigneeId === member.id),
    [tasks, member.id]
  );

  const { 
    currentItems: currentTasks, 
    currentPage, 
    totalPages, 
    goToPage,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
    startItem,
    endItem
  } = usePagination(memberTasks, 10);

  const projectMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const project of projects) {
      map[project.id] = project.title;
    }
    return map;
  }, [projects]);

  const onTimePercent = Math.round((member.onTimeRate ?? 0) * 100);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
            <p className="text-sm text-slate-500">{member.role} {member.department ? `• ${member.department}` : ''}</p>
          </div>
          <div className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {member.performanceRating}
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-indigo-50 p-4 text-center border border-indigo-100">
            <p className="text-2xl font-bold text-indigo-700">
              {onTimePercent}%
            </p>
            <p className="text-xs font-semibold text-indigo-600">On-Time Delivery Rate</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4 text-center border border-emerald-100">
            <p className="text-2xl font-bold text-emerald-700">
              {member.completedTasks}
            </p>
            <p className="text-xs font-semibold text-emerald-600">Completed Deliverables</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-4 text-center border border-blue-100">
            <p className="text-2xl font-bold text-blue-700">
              {member.activeTasks}
            </p>
            <p className="text-xs font-semibold text-blue-600">Active Deliverables</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-4 text-center border border-rose-100">
            <p className="text-2xl font-bold text-rose-700">{member.slipsLogged}</p>
            <p className="text-xs font-semibold text-rose-600">Slips Logged</p>
          </div>
        </div>

        {/* Manager Talking Points */}
        <div className="mb-8">
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              Manager Executive Talking Points
            </h4>

            {memberTasks.length > 0 ? (
              <ul className="space-y-2 text-sm text-slate-700">
                {(() => {
                  const delayedTasks = memberTasks
                    .map(t => calculateTaskDelay({ dueDate: t.targetDueDate || t.dueDate || '', completedAt: t.completedAt, status: t.status }))
                    .filter(d => d.isDelayed);
                  if (delayedTasks.length > 0) {
                    const totalDelayMs = delayedTasks.reduce((acc, curr) => acc + curr.delayMs, 0);
                    const hours = Math.floor(totalDelayMs / (1000 * 60 * 60));
                    const days = Math.floor(hours / 24);
                    const remainingHours = hours % 24;
                    let str = '';
                    if (days > 0) str += `${days} day${days > 1 ? 's' : ''}`;
                    if (remainingHours > 0) {
                      if (str) str += ', ';
                      str += `${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
                    }
                    if (!str) str = '< 1 hour';
                    return (
                      <li className="flex items-start gap-2 bg-rose-50 border border-rose-100 p-3 rounded-xl text-rose-800 font-medium">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" aria-hidden="true" />
                        This team member has accumulated {str} of delay past target ETA across {delayedTasks.length} deliverable(s).
                      </li>
                    );
                  }
                  return null;
                })()}
                {member.slipsLogged > 0 && (
                  <li className="flex items-start gap-2 bg-amber-50 border border-amber-100 p-3 rounded-xl text-amber-900 font-medium">
                    <span
                      className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500"
                      aria-hidden="true"
                    />
                    {member.slipsLogged} deliverable slip(s) recorded. Review root causes (e.g. Scope Drift, Developer Delay, QA).
                  </li>
                )}
                {member.completedTasks > 0 && (
                  <li className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-emerald-900 font-medium">
                    <span
                      className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                      aria-hidden="true"
                    />
                    Successfully completed {member.completedTasks} deliverable(s) during this tracking cycle.
                  </li>
                )}
              </ul>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-500">
                <span>
                  No deliverables recorded for this period.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Breakdown */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
        <h4 className="mb-4 text-lg font-bold text-slate-800">
          Deliverable Breakdown
        </h4>

        {memberTasks.length === 0 ? (
          <p className="text-sm text-slate-400">No deliverables assigned.</p>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 rounded-xl border border-slate-200">
            <ul className="space-y-2 p-3">
              {currentTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-white shadow-sm border border-slate-100 px-4 py-3"
                >
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-slate-800">
                        {task.deliverableId || 'DLV-000000'}
                      </span>
                      {projectMap[task.projectId] && (
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
                          {projectMap[task.projectId]}
                        </span>
                      )}
                    </div>
                    <span className="truncate text-sm text-slate-900 font-semibold">
                      {task.title}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                    <div className="flex items-center gap-2">
                      {(task.delayHours ?? 0) > 0 && (
                        <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                          +{task.delayHours} hrs delay
                        </span>
                      )}
                      <StatusBadge status={task.status} />
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap mt-0.5">
                      Target: {task.targetDueDate || task.dueDate ? new Date((task.targetDueDate || task.dueDate)!).toLocaleDateString() : '-'} {task.targetDueTime || '10:00 PM'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
                totalItems={totalItems}
                startItem={startItem}
                endItem={endItem}
                className="bg-transparent border-t-0 !px-0 !py-0 shadow-none rounded-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default MemberReport;
