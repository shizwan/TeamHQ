'use client';

import React, { useMemo } from 'react';
import { Printer } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection } from '@/hooks/useFirestore';
import { getTeamCollectionPath, getTasksCollectionPath } from '@/lib/firestorePaths';
import { isOverdue, calculatePerformanceData } from '@/lib/validation';
import type { TeamMember, Task, PerformanceData } from '@/types';
import Header from '@/components/layout/Header';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

export default function ReportsPage() {
  const { user } = useAuth();
  const userId = user?.uid || '';

  const { data: team, loading: teamLoading } = useCollection<TeamMember>(
    userId ? getTeamCollectionPath(userId) : null
  );
  const { data: tasks, loading: tasksLoading } = useCollection<Task>(
    userId ? getTasksCollectionPath(userId) : null
  );

  const [selectedMonth, setSelectedMonth] = React.useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => t.dueDate.startsWith(selectedMonth));
  }, [tasks, selectedMonth]);

  const performanceData: PerformanceData[] = useMemo(() => {
    return calculatePerformanceData(team, filteredTasks);
  }, [team, filteredTasks]);

  const { 
    currentItems: currentMembers, 
    currentPage, 
    totalPages, 
    goToPage,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
    startItem,
    endItem
  } = usePagination(performanceData, 10);

  // Reset to page 1 when month changes
  React.useEffect(() => {
    goToPage(1);
  }, [selectedMonth, goToPage]);

  if (teamLoading || tasksLoading) {
    return <LoadingSpinner message="Loading reports..." />;
  }

  return (
    <>
      <Header
        title="Monthly Reports"
        description="End-of-month manager review talking points and statistics."
      />

      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200 no-print">
        <div className="flex items-center gap-3">
          <label htmlFor="month-select" className="text-sm font-medium text-slate-700">
            Review Period:
          </label>
          <input
            id="month-select"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
          />
        </div>
        <button
          onClick={() => window.print()}
          className="bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          aria-label="Print report"
        >
          <Printer className="w-4 h-4" />
          Export / Print
        </button>
      </div>

      {performanceData.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No team members"
          description="Add team members to generate performance reports."
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentMembers.map((member) => (
              <Link 
                key={member.id} 
                href={`/dashboard/reports/${member.id}?month=${selectedMonth}`}
                className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all group block"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{member.name}</h3>
                    <p className="text-sm text-slate-500">{member.role}</p>
                  </div>
                  <div className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Efficiency Score</p>
                    <p className={`text-lg font-bold ${member.total === 0 ? 'text-slate-400' : member.efficiencyScore >= 80 ? 'text-emerald-600' : member.efficiencyScore >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {member.total === 0 ? '-' : `${member.efficiencyScore}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Overdue Tasks</p>
                    <p className={`text-lg font-bold ${member.overdue > 0 ? 'text-rose-600' : member.total === 0 ? 'text-slate-400' : 'text-emerald-600'}`}>
                      {member.total === 0 ? '-' : member.overdue}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={totalItems}
            startItem={startItem}
            endItem={endItem}
            className="rounded-xl shadow-sm border border-slate-200"
          />
        </div>
      )}
    </>
  );
}
