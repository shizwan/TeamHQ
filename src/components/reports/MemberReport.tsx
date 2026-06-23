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

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-800">{member.name}</h3>
        <p className="text-sm text-slate-500">{member.role}</p>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg bg-indigo-50 p-3 text-center border border-indigo-100">
          <p className={`text-2xl font-bold ${member.efficiencyScore >= 80 ? 'text-emerald-600' : member.efficiencyScore >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
            {member.efficiencyScore}
          </p>
          <p className="text-xs font-medium text-indigo-600">Efficiency Score</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-3 text-center border border-emerald-100">
          <p className="text-2xl font-bold text-emerald-600">
            {member.onTimeCompleted}
          </p>
          <p className="text-xs font-medium text-emerald-600">On-Time</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-3 text-center border border-amber-100">
          <p className="text-2xl font-bold text-amber-600">
            {member.lateCompleted}
          </p>
          <p className="text-xs font-medium text-amber-600">Late</p>
        </div>
        <div className="rounded-lg bg-rose-50 p-3 text-center border border-rose-100">
          <p className="text-2xl font-bold text-rose-600">{member.overdue}</p>
          <p className="text-xs font-medium text-rose-600">Overdue</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Manager Talking Points */}
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Manager Talking Points
          </h4>

          {member.total > 0 ? (
            <ul className="space-y-2 text-sm text-slate-700">
              {(() => {
                const delayedTasks = memberTasks.map(t => calculateTaskDelay(t)).filter(d => d.isDelayed);
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
                    <li className="flex items-start gap-2 bg-rose-50 border border-rose-100 p-2 rounded-lg text-rose-800 font-medium">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" aria-hidden="true" />
                      This teammate has caused a total accumulated delay of {str} across {delayedTasks.length} task{delayedTasks.length !== 1 ? 's' : ''}.
                    </li>
                  );
                }
                return null;
              })()}
              {member.overdue > 0 && (
                <li className="flex items-start gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500"
                    aria-hidden="true"
                  />
                  {member.overdue} task{member.overdue > 1 ? 's' : ''} currently overdue —
                  discuss blockers and reprioritize deadlines immediately.
                </li>
              )}
              {member.lateCompleted > 0 && (
                <li className="flex items-start gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                    aria-hidden="true"
                  />
                  Completed {member.lateCompleted} task{member.lateCompleted > 1 ? 's' : ''} past the deadline. Review time estimation accuracy and potential bottlenecks.
                </li>
              )}
              {member.onTimeCompleted > 0 && (
                <li className="flex items-start gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                    aria-hidden="true"
                  />
                  Successfully delivered {member.onTimeCompleted} task{member.onTimeCompleted > 1 ? 's' : ''} on schedule.
                </li>
              )}
              <li className="flex items-start gap-2">
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${member.efficiencyScore >= 80 ? 'bg-emerald-500' : member.efficiencyScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  aria-hidden="true"
                />
                Overall Efficiency Score is {member.efficiencyScore}. 
                {member.efficiencyScore >= 80 ? ' Excellent performance, consider stretch goals.' : member.efficiencyScore >= 50 ? ' Needs moderate improvement in delivery timing.' : ' Critical: Immediate intervention required to redistribute workload or provide support.'}
              </li>
            </ul>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-500">
              <span>
                No tasks assigned for this period.
              </span>
            </div>
          )}
        </div>

        {/* Right: Task Breakdown */}
        <div className="flex flex-col">
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Task Breakdown
          </h4>

          {memberTasks.length === 0 ? (
            <p className="text-sm text-slate-400">No tasks assigned.</p>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 rounded-xl border border-slate-200">
              <ul className="space-y-2 p-3">
                {currentTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white shadow-sm border border-slate-100 px-3 py-2"
                  >
                    <div className="flex flex-col min-w-0">
                      {projectMap[task.projectId] && (
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">
                          {projectMap[task.projectId]}
                        </span>
                      )}
                      <span className="truncate text-sm text-slate-700 font-medium">
                        {task.title}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const delay = calculateTaskDelay(task);
                          if (delay.isDelayed) {
                            return (
                              <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                                + {delay.delayString}
                              </span>
                            );
                          }
                          return null;
                        })()}
                        <StatusBadge status={task.status} />
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap mt-0.5">
                        {new Date(task.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
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
    </div>
  );
});

export default MemberReport;
