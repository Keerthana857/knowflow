'use client';

import React from 'react';
import {
  Brain,
  LayoutDashboard,
  GitFork,
  BookOpen,
  Scale,
  CalendarClock,
  Upload,
  RotateCcw,
  Clock
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'map' | 'learn' | 'evidence' | 'plan';

interface HeaderProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  availableTimeBudgetMinutes: number;
  onOpenUploadModal: () => void;
  onResetBenchmark: () => void;
  workspaceTitle: string;
}

export default function Header({
  activeTab,
  onChangeTab,
  availableTimeBudgetMinutes,
  onOpenUploadModal,
  onResetBenchmark,
  workspaceTitle,
}: HeaderProps) {
  const tabs = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map' as ActiveTab, label: 'Knowledge Map', icon: GitFork },
    { id: 'learn' as ActiveTab, label: 'Learning Session', icon: BookOpen },
    { id: 'evidence' as ActiveTab, label: 'Evidence Matrix', icon: Scale },
    { id: 'plan' as ActiveTab, label: 'Dynamic Plan', icon: CalendarClock },
  ];

  return (
    <header className="bg-white border-b border-[#E8ECF2] sticky top-0 z-40 shadow-xs">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9]">
        {/* Logo and Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#635BDB] text-white flex items-center justify-center shadow-xs shrink-0">
            <Brain size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#172033] tracking-tight">
                KNOWFLOW
              </span>
              <span className="text-[10px] font-semibold text-[#635BDB] bg-[#EEEDFC] px-2 py-0.5 rounded-full border border-[#DCDAF9]">
                Rapid Knowledge Internalization
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] line-clamp-1 max-w-md hidden sm:block">
              {workspaceTitle}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Time Budget Pill */}
          <button
            onClick={() => onChangeTab('plan')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F8FAFC] border border-[#E8ECF2] text-xs font-medium text-[#172033] hover:border-[#635BDB] transition shadow-xs"
            title="Adjust available learning time budget"
          >
            <Clock size={12} className="text-[#635BDB]" />
            <span>Budget: <strong className="font-semibold">{availableTimeBudgetMinutes}m</strong></span>
          </button>

          {/* Upload PDFs Button */}
          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#635BDB] hover:bg-[#5249C9] text-white text-xs font-semibold shadow-xs transition active:scale-[0.98]"
          >
            <Upload size={13} />
            <span>Upload PDF</span>
          </button>

          {/* Reset Demo Benchmark Button */}
          <button
            onClick={onResetBenchmark}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-[#64748B] hover:text-[#172033] text-xs font-medium border border-[#E8ECF2] transition shadow-xs"
            title="Reset to Default 3-Paper Benchmark"
          >
            <RotateCcw size={12} />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Horizontal Navigation */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex gap-1 overflow-x-auto scrollbar-none py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[#EEEDFC] text-[#635BDB] font-semibold'
                  : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-50'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-[#635BDB]' : 'text-[#64748B]'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
