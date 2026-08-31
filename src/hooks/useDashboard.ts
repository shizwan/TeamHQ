'use client';

import useSWR from 'swr';
import type { TaskMetrics, PerformanceData, ProjectPerformanceData } from '@/types';

export interface DashboardMetricsResponse {
  metrics: TaskMetrics;
  teamPerformance: PerformanceData[];
  projectPerformance: ProjectPerformanceData[];
  topPerformer: string;
  overallOnTimeRate: number;
  activeTasksCount: number;
  activeProjectsCount: number;
  teamMembersCount: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    headers: { 'x-requested-with': 'XMLHttpRequest' },
  });
  if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
  return await res.json();
};

export function useDashboardMetrics() {
  const { data, error, isLoading, mutate } = useSWR<DashboardMetricsResponse>(
    '/api/dashboard/metrics',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    metrics: data?.metrics,
    teamPerformance: data?.teamPerformance || [],
    projectPerformance: data?.projectPerformance || [],
    topPerformer: data?.topPerformer || 'None',
    overallOnTimeRate: data?.overallOnTimeRate || 100,
    activeTasksCount: data?.activeTasksCount || 0,
    activeProjectsCount: data?.activeProjectsCount || 0,
    teamMembersCount: data?.teamMembersCount || 0,
    loading: isLoading,
    error: error ? error.message : null,
    refetch: mutate,
  };
}
