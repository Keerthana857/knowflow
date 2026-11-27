'use client';

import React, { useState } from 'react';
import { StudyScheduleItem } from '../types';
import {
  CalendarClock,
  Clock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  SlidersHorizontal
} from 'lucide-react';

interface DynamicPlanViewProps {
  schedule: StudyScheduleItem[];
  availableTimeBudgetMinutes: number;
  crunchModeActive: boolean;
  onUpdateTimeBudget: (minutes: number) => void;
  onOpenConcept: (conceptId: string) => void;
}

export default function DynamicPlanView({
  schedule,
  availableTimeBudgetMinutes,
  crunchModeActive,
  onUpdateTimeBudget,
  onOpenConcept
}: DynamicPlanViewProps) {
  const [customTime, setCustomTime] = useState(availableTimeBudgetMinutes.toString());

  const quickPresets = [30, 45, 90, 120, 240];

  const handleApplyCustomTime = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customTime, 10);
    if (!isNaN(val) && val > 0) {
      onUpdateTimeBudget(val);
    }
  };

  const totalAllocatedMinutes = schedule.reduce((sum, item) => sum + item.allocatedMinutes, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Top Controller Card */}
      <div className="bg-white border border-[#E8ECF2] rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="w-8 h-8 rounded-lg bg-[#EEEDFC] text-[#635BDB] border border-[#D5D1F7] flex items-center justify-center">
                <CalendarClock size={18} />
              </span>
              <h2 className="text-lg font-bold text-[#172033]">
                Dynamic Learning Replanner & Time Budget Control
              </h2>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Real-time schedule synthesis. Compresses mastered concepts, activates Crunch Mode when time is tight, and re-sequences concepts dynamically.
            </p>
          </div>

          {/* Crunch Mode Badge */}
          {crunchModeActive ? (
            <div className="px-3.5 py-2 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] text-[#E05252] text-xs flex items-center gap-2">
              <Flame size={16} className="text-[#E05252] animate-pulse" />
              <div>
                <strong className="block font-bold">Crunch Mode Active</strong>
                <span className="text-[10px] text-[#E05252]">Low-yield details trimmed to fit time budget</span>
              </div>
            </div>
          ) : (
            <div className="px-3.5 py-2 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A37A] text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#16A37A]" />
              <div>
                <strong className="block font-bold">Deep Mastery Mode</strong>
                <span className="text-[10px] text-[#16A37A]">Full theoretical and edge-case coverage</span>
              </div>
            </div>
          )}
        </div>

        {/* Time Budget Controls */}
        <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E8ECF2] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal size={14} className="text-[#635BDB]" />
              Adjust Available Time Budget:
            </span>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              {quickPresets.map(preset => (
                <button
                  key={preset}
                  onClick={() => {
                    setCustomTime(preset.toString());
                    onUpdateTimeBudget(preset);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
                    availableTimeBudgetMinutes === preset
                      ? 'bg-[#635BDB] text-white shadow-xs'
                      : 'bg-white text-[#64748B] hover:text-[#172033] border border-[#E8ECF2]'
                  }`}
                >
                  {preset >= 60 ? `${preset / 60}h` : `${preset}m`}
                </button>
              ))}
            </div>

            {/* Custom Minutes Input */}
            <form onSubmit={handleApplyCustomTime} className="flex items-center gap-1.5">
              <input
                type="number"
                min="10"
                max="600"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="w-20 bg-white border border-[#E8ECF2] rounded-lg px-2.5 py-1 text-xs text-[#172033] focus:outline-none focus:border-[#635BDB]"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-white hover:bg-[#F1F5F9] border border-[#E8ECF2] text-[#172033] text-xs font-semibold rounded-lg transition"
              >
                Apply
              </button>
            </form>
          </div>

          {/* Time Budget Progress Gauge */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-[#64748B]">
              <span>Budget Allocated: <strong className="text-[#172033]">{totalAllocatedMinutes}m</strong></span>
              <span>Available Budget: <strong className="text-[#172033]">{availableTimeBudgetMinutes}m</strong></span>
            </div>
            <div className="h-2 bg-[#E8ECF2] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  crunchModeActive ? 'bg-[#E05252]' : 'bg-[#635BDB]'
                }`}
                style={{
                  width: `${Math.min(100, Math.round((totalAllocatedMinutes / Math.max(1, availableTimeBudgetMinutes)) * 100))}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Adaptive Study Schedule Timeline */}
      <div className="bg-white border border-[#E8ECF2] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8ECF2]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#172033] flex items-center gap-2">
            <Clock size={16} className="text-[#635BDB]" />
            Adaptive Schedule Sequence
          </h3>
          <span className="text-xs text-[#64748B]">
            {schedule.filter(s => s.status !== 'completed').length} Pending Tasks • {schedule.filter(s => s.status === 'completed').length} Mastered
          </span>
        </div>

        <div className="space-y-3">
          {schedule.map(item => {
            const isCompleted = item.status === 'completed';
            const isActive = item.status === 'active';

            return (
              <div
                key={item.conceptId}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'bg-[#F8FAFC]/60 border-[#E8ECF2] opacity-60'
                    : isActive
                    ? 'bg-white border-2 border-[#635BDB] ring-2 ring-[#EEEDFC] shadow-xs'
                    : 'bg-[#F8FAFC] border-[#E8ECF2] hover:bg-white'
                }`}
              >
                {/* Left: Rank + Info */}
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${
                    isCompleted
                      ? 'bg-[#F0FDF4] text-[#16A37A]'
                      : isActive
                      ? 'bg-[#635BDB] text-white'
                      : 'bg-white border border-[#E8ECF2] text-[#64748B]'
                  }`}>
                    {item.priorityRank}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-[#172033]">
                        {item.conceptName}
                      </h4>

                      {/* Mode Badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                        item.mode === 'crunch' ? 'bg-[#FEF2F2] text-[#E05252] border-[#FEE2E2]' :
                        item.mode === 'deep' ? 'bg-[#FAF5FF] text-[#7C3AED] border-[#E9D5FF]' :
                        'bg-[#EEEDFC] text-[#635BDB] border-[#D5D1F7]'
                      }`}>
                        {item.mode} mode
                      </span>

                      {!item.prerequisitesMet && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] flex items-center gap-1">
                          <AlertTriangle size={10} /> Needs Prereq
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#64748B] leading-relaxed">
                      {item.reason}
                    </p>
                  </div>
                </div>

                {/* Right: Time + CTA */}
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E8ECF2]">
                  <span className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                    <Clock size={13} className="text-[#64748B]" />
                    {item.allocatedMinutes}m
                  </span>

                  <button
                    onClick={() => onOpenConcept(item.conceptId)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                      isActive
                        ? 'bg-[#635BDB] hover:bg-[#5249C9] text-white shadow-xs'
                        : 'bg-white hover:bg-[#F8FAFC] border border-[#E8ECF2] text-[#172033]'
                    }`}
                  >
                    <span>{isCompleted ? 'Review' : 'Start'}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
