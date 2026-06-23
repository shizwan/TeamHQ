'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { PerformanceData } from '@/types';
import EmptyState from '@/components/ui/EmptyState';

interface PerformanceBarChartProps {
  data: PerformanceData[];
}

export default function PerformanceBarChart({ data }: PerformanceBarChartProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-800">
        Team Performance (Completed vs Overdue)
      </h3>

      {data.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="h-12 w-12" />}
          title="No performance data"
          description="Add team members and assign tasks to see performance metrics here."
        />
      ) : (
        <div
          className="h-80"
          role="img"
          aria-label="Team performance bar chart comparing completed and overdue tasks"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#64748b' }}
                angle={-35}
                textAnchor="end"
                interval={0}
                height={70}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748b' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#f1f5f9',
                  fontSize: '0.875rem',
                }}
                itemStyle={{ color: '#f1f5f9' }}
                cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
              />
              <Legend
                verticalAlign="top"
                wrapperStyle={{ fontSize: '0.875rem', paddingBottom: '0.5rem' }}
              />
              <Bar
                dataKey="completed"
                name="Completed"
                fill="#00c7e2"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="overdue"
                name="Overdue"
                fill="#6b60ec"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
