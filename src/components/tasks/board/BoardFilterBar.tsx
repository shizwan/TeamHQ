'use client';

import React, { useState, useMemo } from 'react';
import { Filter, SortAsc, X, Users } from 'lucide-react';
import type { TeamMember } from '@/types';
import { LABEL_PRESETS } from '@/types';

interface BoardFilterBarProps {
  team: TeamMember[];
  totalTasks: number;
  activeLabels: string[];
  onLabelsChange: (labels: string[]) => void;
  activeMember: string;
  onMemberChange: (memberId: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export default function BoardFilterBar({
  team,
  totalTasks,
  activeLabels,
  onLabelsChange,
  activeMember,
  onMemberChange,
  sortBy,
  onSortChange,
}: BoardFilterBarProps) {
  const [labelDropdownOpen, setLabelDropdownOpen] = useState(false);
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const hasFilters = activeLabels.length > 0 || activeMember !== '';

  const toggleLabel = (label: string) => {
    if (activeLabels.includes(label)) {
      onLabelsChange(activeLabels.filter((l) => l !== label));
    } else {
      onLabelsChange([...activeLabels, label]);
    }
  };

  const clearFilters = () => {
    onLabelsChange([]);
    onMemberChange('');
  };

  const sortOptions = [
    { value: 'dueDate', label: 'Due Date' },
    { value: 'name', label: 'Alphabetical' },
    { value: 'newest', label: 'Newest First' },
  ];

  const currentSortLabel = sortOptions.find((o) => o.value === sortBy)?.label || 'Due Date';

  return (
    <div className="flex items-center gap-3 mb-4 flex-wrap">
      {/* Task count */}
      <div className="text-sm font-medium text-slate-500">
        {totalTasks} task{totalTasks !== 1 ? 's' : ''}
      </div>

      <div className="h-5 w-px bg-slate-200" />

      {/* Label Filter */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setLabelDropdownOpen(!labelDropdownOpen);
            setMemberDropdownOpen(false);
            setSortDropdownOpen(false);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeLabels.length > 0
              ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Labels
          {activeLabels.length > 0 && (
            <span className="bg-indigo-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {activeLabels.length}
            </span>
          )}
        </button>

        {labelDropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setLabelDropdownOpen(false)} />
            <div className="absolute top-full left-0 mt-1 z-50 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-2 animate-in fade-in slide-in-from-top-1">
              <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Filter by Label
              </div>
              {LABEL_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => toggleLabel(preset.name)}
                  className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className={`w-3 h-3 rounded-sm ${preset.color}`} />
                  <span className="flex-1 text-left">{preset.name}</span>
                  {activeLabels.includes(preset.name) && (
                    <span className="text-indigo-600 font-bold text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Member Filter */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setMemberDropdownOpen(!memberDropdownOpen);
            setLabelDropdownOpen(false);
            setSortDropdownOpen(false);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeMember
              ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Member
        </button>

        {memberDropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMemberDropdownOpen(false)} />
            <div className="absolute top-full left-0 mt-1 z-50 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-2 animate-in fade-in slide-in-from-top-1">
              <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Filter by Member
              </div>
              <button
                type="button"
                onClick={() => { onMemberChange(''); setMemberDropdownOpen(false); }}
                className={`flex items-center gap-2.5 w-full px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors ${
                  !activeMember ? 'text-indigo-600 font-semibold' : 'text-slate-700'
                }`}
              >
                All Members
              </button>
              {team.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => { onMemberChange(member.id); setMemberDropdownOpen(false); }}
                  className={`flex items-center gap-2.5 w-full px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors ${
                    activeMember === member.id ? 'text-indigo-600 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-[8px] font-bold text-white">
                    {member.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  {member.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Sort */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setSortDropdownOpen(!sortDropdownOpen);
            setLabelDropdownOpen(false);
            setMemberDropdownOpen(false);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors"
        >
          <SortAsc className="w-3.5 h-3.5" />
          {currentSortLabel}
        </button>

        {sortDropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setSortDropdownOpen(false)} />
            <div className="absolute top-full left-0 mt-1 z-50 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-2 animate-in fade-in slide-in-from-top-1">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onSortChange(opt.value); setSortDropdownOpen(false); }}
                  className={`flex items-center w-full px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors ${
                    sortBy === opt.value ? 'text-indigo-600 font-semibold' : 'text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
}
