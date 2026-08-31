'use client';

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import type { Task, TaskMetrics } from '@/types';
import { PIE_COLORS } from '@/types';
import { calculateGlobalTaskMetrics } from '@/lib/trackerEngine';
import EmptyState from '@/components/ui/EmptyState';

interface TaskPieChartProps {
  metrics?: TaskMetrics;
  tasks?: Task[];
}

interface PieEntry {
  name: string;
  value: number;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  'Completed': PIE_COLORS['Completed'] || '#10b981',
  'In Progress': PIE_COLORS['In Progress'] || '#3b82f6',
  'Carried Forward': PIE_COLORS['Carried Forward'] || '#f59e0b',
  'Blocked': PIE_COLORS['Blocked'] || '#ef4444',
  'Cancelled': PIE_COLORS['Cancelled'] || '#64748b',
  'Pending': PIE_COLORS['Pending'] || '#94a3b8',
};

export default function TaskPieChart({ metrics: metricsProp, tasks }: TaskPieChartProps) {
  const metrics: TaskMetrics = metricsProp || (tasks ? calculateGlobalTaskMetrics(tasks) : {
    total: 0,
    completed: 0,
    inProgress: 0,
    carriedForward: 0,
    blocked: 0,
    cancelled: 0,
    overdue: 0,
    pending: 0,
  });

  const rawData: PieEntry[] = [
    { name: 'Completed', value: metrics.completed },
    { name: 'In Progress', value: metrics.inProgress },
    { name: 'Carried Forward', value: metrics.carriedForward },
    { name: 'Blocked', value: metrics.blocked },
    { name: 'Cancelled', value: metrics.cancelled },
  ].filter((entry) => entry.value > 0);

  if (metrics.pending > 0) {
    rawData.push({ name: 'Pending', value: metrics.pending });
  }

  const allZero = rawData.length === 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-indigo-600" />
          Deliverables Status Distribution
        </h3>
        <span className="text-xs font-semibold text-slate-400">Total: {metrics.total} Deliverables</span>
      </div>

      {allZero ? (
        <EmptyState
          icon={<PieChartIcon className="h-12 w-12 text-slate-400" />}
          title="No deliverables yet"
          description="Create deliverables to see their status distribution here."
        />
      ) : (
        <div className="h-80 w-full" role="img" aria-label="Deliverable status distribution pie chart">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rawData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={105}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {rawData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLOR_MAP[entry.name] ?? '#94a3b8'}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '0.75rem',
                  color: '#f8fafc',
                  fontSize: '0.875rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                }}
                itemStyle={{ color: '#f8fafc', padding: '2px 0' }}
                formatter={(value: any, name: any) => [
                  `${value} (${Math.round((Number(value) / (metrics.total || 1)) * 100)}%)`,
                  name,
                ]}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: '0.8125rem', color: '#475569', paddingTop: '1rem' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
