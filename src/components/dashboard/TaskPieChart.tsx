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
import type { TaskMetrics } from '@/types';
import { PIE_COLORS } from '@/types';
import EmptyState from '@/components/ui/EmptyState';

interface TaskPieChartProps {
  metrics: TaskMetrics;
}

interface PieEntry {
  name: string;
  value: number;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  'In Progress': PIE_COLORS['In Progress'],
  'Completed': PIE_COLORS['Completed'],
  'Overdue': PIE_COLORS['Overdue'],
  'Pending': PIE_COLORS['Pending'],
};

export default function TaskPieChart({ metrics }: TaskPieChartProps) {
  const rawData: PieEntry[] = [
    { name: 'In Progress', value: metrics.inProgress },
    { name: 'Completed', value: metrics.completed },
    { name: 'Overdue', value: metrics.overdue },
    { name: 'Pending', value: metrics.pending },
  ];

  const pieData = rawData.filter((entry) => entry.value > 0);
  const allZero = pieData.length === 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-800">
        Task Distribution
      </h3>

      {allZero ? (
        <EmptyState
          icon={<PieChartIcon className="h-12 w-12" />}
          title="No tasks yet"
          description="Create tasks to see their status distribution here."
        />
      ) : (
        <div className="h-80" role="img" aria-label="Task status distribution pie chart">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
                nameKey="name"
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLOR_MAP[entry.name] ?? '#94a3b8'}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#f1f5f9',
                  fontSize: '0.875rem',
                }}
                itemStyle={{ color: '#f1f5f9' }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: '0.875rem', color: '#64748b' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
