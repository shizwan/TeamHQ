'use client';

import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
}

const MetricCard = React.memo(function MetricCard({
  label,
  value,
  icon,
  colorClass,
}: MetricCardProps) {
  // Split colorClass like 'text-green-600 bg-green-50' into text and bg parts
  const classes = colorClass.split(' ');
  const textClass = classes.find((c) => c.startsWith('text-')) ?? 'text-slate-800';
  const bgClass = classes.find((c) => c.startsWith('bg-')) ?? 'bg-slate-50';

  return (
    <article className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className={`mt-1 text-3xl font-bold ${textClass}`}>{value}</p>
      </div>
      <div className={`rounded-lg p-3 ${bgClass}`} aria-hidden="true">
        {icon}
      </div>
    </article>
  );
});

export default MetricCard;
