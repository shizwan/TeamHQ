'use client';

import React from 'react';
import { STATUS_STYLES } from '@/types';
import type { TaskStatus } from '@/types';

interface StatusBadgeProps {
  status: TaskStatus;
}

const StatusBadge = React.memo(function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      role="status"
      aria-label={`Status: ${status}`}
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
});

export default StatusBadge;
