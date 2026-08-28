'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, User, Printer } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection } from '@/hooks/useFirestore';
import { getTeamCollectionPath, getTasksCollectionPath, getProjectsCollectionPath } from '@/lib/firestorePaths';
import { isOverdue } from '@/lib/validation';
import { calculateTeamPerformance, filterActiveTasks } from '@/lib/trackerEngine';
import type { TeamMember, Task, PerformanceData, Project } from '@/types';
import Header from '@/components/layout/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import MemberReport from '@/components/reports/MemberReport';

export default function IndividualReportPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { user } = useAuth();
  const userId = user?.uid || '';

  const { data: team, loading: teamLoading } = useCollection<TeamMember>(
    userId ? getTeamCollectionPath(userId) : null
  );
  const { data: tasks, loading: tasksLoading } = useCollection<Task>(
    userId ? getTasksCollectionPath(userId) : null
  );
  const { data: projects, loading: projectsLoading } = useCollection<Project>(
    userId ? getProjectsCollectionPath(userId) : null
  );

  const initialMonth = searchParams.get('month') || (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  })();
  const [selectedMonth, setSelectedMonth] = React.useState(initialMonth);

  const activeTasks = useMemo(() => filterActiveTasks(tasks, projects), [tasks, projects]);
  const member = useMemo(() => team.find((m) => m.id === id), [team, id]);
  const memberTasks = useMemo(() => 
    activeTasks.filter((t) => {
      if (t.assigneeId !== id) return false;
      const d = t.startDate || t.targetDueDate || t.dueDate;
      return d ? String(d).startsWith(selectedMonth) : true;
    }), 
  [activeTasks, id, selectedMonth]);

  const performance: PerformanceData | null = useMemo(() => {
    if (!member) return null;
    const res = calculateTeamPerformance([member], memberTasks);
    return res[0] || null;
  }, [member, memberTasks]);

  if (teamLoading || tasksLoading || projectsLoading) {
    return <LoadingSpinner message="Loading report..." />;
  }

  if (!member || !performance) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reports
        </button>
        <EmptyState
          icon={<User className="w-12 h-12" />}
          title="Report Not Found"
          description="The requested team member does not exist or has been deleted."
        />
      </div>
    );
  }

  const formattedMonth = new Date(selectedMonth + '-01T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 no-print bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </button>
        
        <div className="flex items-center gap-4">
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
            Print Report
          </button>
        </div>
      </div>

      <Header
        title={`${member.name} - Monthly Report`}
        description={`Performance review for ${formattedMonth}`}
      />

      <div className="mt-8">
        <MemberReport member={performance} tasks={memberTasks} projects={projects} />
      </div>
    </>
  );
}
