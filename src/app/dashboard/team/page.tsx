'use client';

import React, { useMemo, useCallback } from 'react';
import { Users, Briefcase, Award, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection, useAddDoc, useDeleteDoc, useUpdateDoc } from '@/hooks/useFirestore';
import { getTeamCollectionPath, getTasksCollectionPath, getProjectsCollectionPath } from '@/lib/firestorePaths';
import { useToast } from '@/contexts/ToastContext';
import { sanitizeString } from '@/lib/validation';
import { calculateTeamPerformance, filterActiveTasks } from '@/lib/trackerEngine';
import type { TeamMember, Task, Project, PerformanceData, NewMemberForm } from '@/types';
import Header from '@/components/layout/Header';
import TeamTable from '@/components/team/TeamTable';
import AddMemberForm from '@/components/team/AddMemberForm';
import EditMemberModal from '@/components/team/EditMemberModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import MetricCard from '@/components/dashboard/MetricCard';
import PerformanceBarChart from '@/components/dashboard/PerformanceBarChart';

export default function TeamPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const userId = user?.uid || 'admin-user';

  const teamPath = getTeamCollectionPath(userId);
  const tasksPath = getTasksCollectionPath(userId);
  const projectsPath = getProjectsCollectionPath(userId);

  const { data: team, loading: teamLoading, refetch: refetchTeam } = useCollection<TeamMember>(teamPath);
  const { data: tasks, loading: tasksLoading } = useCollection<Task>(tasksPath);
  const { data: projects, loading: projectsLoading } = useCollection<Project>(projectsPath);
  
  const { addDocument, loading: addingMember } = useAddDoc(teamPath);
  const { deleteDocument, loading: deletingMember } = useDeleteDoc(teamPath);
  const { updateDocument, loading: updatingMember } = useUpdateDoc(teamPath);

  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);
  const [editTarget, setEditTarget] = React.useState<PerformanceData | null>(null);

  const activeTasks = useMemo(() => filterActiveTasks(tasks, projects), [tasks, projects]);

  const performanceData: PerformanceData[] = useMemo(() => {
    return calculateTeamPerformance(team, activeTasks);
  }, [team, activeTasks]);

  // Derived Metrics
  const totalTeamWorkload = useMemo(() => {
    return performanceData.reduce((acc, curr) => acc + curr.activeTasks, 0);
  }, [performanceData]);

  const topPerformer = useMemo(() => {
    const active = performanceData.filter((m) => m.performanceRating === '🟢 Top Performer');
    if (active.length === 0) return 'None';
    return active[0].name;
  }, [performanceData]);

  const actionRequiredCount = useMemo(() => {
    return performanceData.filter((m) => m.performanceRating === '🔴 Action Required').length;
  }, [performanceData]);

  const handleAddMember = useCallback(
    async (data: NewMemberForm) => {
      const result = await addDocument({
        userId,
        name: sanitizeString(data.name),
        role: sanitizeString(data.role),
        department: sanitizeString(data.department || ''),
        status: 'Active',
        manager: 'Shizwan',
        createdAt: new Date().toISOString(),
      });

      if (result) {
        addToast('success', 'Member added', `${sanitizeString(data.name)} has been added to the team.`);
        refetchTeam();
      } else {
        addToast('error', 'Failed to add member', 'Please try again.');
      }
    },
    [addDocument, addToast, refetchTeam, userId]
  );

  const handleEditMember = useCallback(
    async (id: string, data: { name: string; role: string; department: string }) => {
      const result = await updateDocument(id, data);
      if (result) {
        addToast('success', 'Member updated', `${sanitizeString(data.name)}'s details have been updated.`);
        refetchTeam();
      } else {
        addToast('error', 'Failed to update member', 'Please try again.');
      }
    },
    [updateDocument, addToast, refetchTeam]
  );

  const handleDeleteMember = useCallback(async () => {
    if (!deleteTarget) return;

    const success = await deleteDocument(deleteTarget.id);
    if (success) {
      addToast('success', 'Member removed', `${deleteTarget.name} has been removed.`);
      refetchTeam();
    } else {
      addToast('error', 'Failed to remove member', 'Please try again.');
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteDocument, addToast, refetchTeam]);

  const handleRequestDelete = useCallback((id: string, name: string) => {
    setDeleteTarget({ id, name });
  }, []);

  if (teamLoading || tasksLoading || projectsLoading) {
    return <LoadingSpinner message="Loading team performance dashboard..." />;
  }

  const orphanedTaskCount = deleteTarget
    ? tasks.filter((t) => t.assigneeId === deleteTarget.id).length
    : 0;

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <Header
          title="Team Roster & Performance Matrix"
          description="Manage dev team roster, track on-time delivery rates, and review slip causes."
        />
        <AddMemberForm onSubmit={handleAddMember} loading={addingMember} />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard
          label="Total Team Members"
          value={team.length}
          icon={<Users className="h-6 w-6 text-indigo-600" />}
          colorClass="text-indigo-600 bg-indigo-50"
        />
        <MetricCard
          label="Active Workload"
          value={`${totalTeamWorkload} Tasks`}
          icon={<Briefcase className="h-6 w-6 text-blue-600" />}
          colorClass="text-blue-600 bg-blue-50"
        />
        <MetricCard
          label="Top Performer"
          value={topPerformer}
          icon={<Award className="h-6 w-6 text-emerald-600" />}
          colorClass="text-emerald-600 bg-emerald-50"
        />
        <MetricCard
          label="Action Required"
          value={`${actionRequiredCount} Members`}
          icon={<AlertTriangle className="h-6 w-6 text-rose-600" />}
          colorClass="text-rose-600 bg-rose-50"
        />
      </div>

      {/* Analytics Chart */}
      <div className="mb-8">
        <PerformanceBarChart data={performanceData} />
      </div>

      {/* Team Table */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Team Performance Matrix</h2>
        <TeamTable performanceData={performanceData} onDeleteMember={handleRequestDelete} onEditMember={setEditTarget} />
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Remove ${deleteTarget?.name}?`}
        description={
          orphanedTaskCount > 0
            ? `This member has ${orphanedTaskCount} deliverable(s) assigned. This action cannot be undone.`
            : 'This action cannot be undone.'
        }
        confirmLabel="Remove Member"
        variant="danger"
        onConfirm={handleDeleteMember}
        onCancel={() => setDeleteTarget(null)}
        loading={deletingMember}
      />

      <EditMemberModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        member={editTarget ? team.find(m => m.id === editTarget.id) || null : null}
        onSubmit={handleEditMember}
        loading={updatingMember}
      />
    </>
  );
}
