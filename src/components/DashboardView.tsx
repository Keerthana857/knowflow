'use client';

import React from 'react';
import { WorkspaceState, Concept } from '../types';
import {
  Flame,
  Award,
  Clock,
  BookOpen,
  GitFork,
  Scale,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ArrowRight,
  Sparkles,
  CalendarCheck,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { ActiveTab } from './Header';

interface DashboardViewProps {
  workspace: WorkspaceState;
  onNavigateTab: (tab: ActiveTab) => void;
  onStartConcept: (conceptId: string) => void;
  onOpenUpload: () => void;
}

export default function DashboardView({
  workspace,
  onNavigateTab,
  onStartConcept,
  onOpenUpload
}: DashboardViewProps) {
  const { concepts, documents, availableTimeBudgetMinutes, learningStreakDays, schedule } = workspace;

  const totalConcepts = concepts.length;
  const completedConcepts = concepts.filter(c => c.userMastery >= 85).length;
  const inProgressConcepts = concepts.filter(c => c.userMastery >= 50 && c.userMastery < 85).length;
  const weakConcepts = concepts.filter(c => c.userMastery < 50 && c.userMastery > 0);
  const remainingConcepts = totalConcepts - completedConcepts;

  const averageMastery = Math.round(
    concepts.reduce((sum, c) => sum + c.userMastery, 0) / Math.max(1, totalConcepts)
  );

  const estimatedMinutesRemaining = concepts
    .filter(c => c.userMastery < 85)
    .reduce((sum, c) => sum + c.estimatedMinutes, 0);

  // Group by Priority Tier with robust fallback based on priorityScore
  const getPriorityTier = (c: Concept): 'high' | 'medium' | 'low' => {
    if (c.priorityTier === 'high' || c.priorityTier === 'medium' || c.priorityTier === 'low') {
      return c.priorityTier;
    }
    if (c.priorityScore >= 80) return 'high';
    if (c.priorityScore >= 50) return 'medium';
    return 'low';
  };

  const highPriority = concepts.filter(c => getPriorityTier(c) === 'high');
  const mediumPriority = concepts.filter(c => getPriorityTier(c) === 'medium');
  const lowPriority = concepts.filter(c => getPriorityTier(c) === 'low');

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-white border border-[#E8ECF2] rounded-2xl p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#635BDB] bg-[#EEEDFC] px-2.5 py-0.5 rounded-full border border-[#DCDAF9]">
                KNOWFLOW Workspace
              </span>
              <span className="text-[11px] font-medium text-[#E6A23C] bg-[#FFFBEB] px-2.5 py-0.5 rounded-full border border-[#FEF3C7] flex items-center gap-1">
                <Flame size={12} className="text-[#E6A23C]" /> {learningStreakDays} Day Streak
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-[#172033] tracking-tight">
              Don&apos;t just consume information.{' '}
              <span className="text-[#635BDB]">Internalize knowledge.</span>
            </h2>

            <p className="text-xs md:text-sm text-[#64748B] leading-relaxed">
              Active workspace: <span className="font-medium text-[#172033]">{workspace.name}</span>.
              Contains {totalConcepts} interconnected topics across {documents.length} research papers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab('learn')}
              className="px-4 py-2 bg-[#635BDB] hover:bg-[#5249C9] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 transition active:scale-[0.98]"
            >
              <BookOpen size={14} />
              <span>Resume Learning</span>
            </button>

            <button
              onClick={() => onNavigateTab('map')}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-[#172033] text-xs font-medium rounded-lg border border-[#E8ECF2] transition flex items-center gap-1.5 shadow-xs"
            >
              <GitFork size={13} className="text-[#64748B]" />
              <span>Explore Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mastery Index */}
        <div className="bg-white border border-[#E8ECF2] rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#64748B]">Mastery Index</span>
            <div className="w-7 h-7 rounded-md bg-[#EEFDF8] text-[#16A37A] flex items-center justify-center border border-[#DCF7ED]">
              <Award size={15} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#172033] mb-1.5">{averageMastery}%</div>
            <div className="w-full h-1 bg-[#F1F5F9] rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full bg-[#16A37A] rounded-full transition-all duration-500"
                style={{ width: `${averageMastery}%` }}
              />
            </div>
            <span className="text-[11px] text-[#64748B]">
              {completedConcepts} of {totalConcepts} topics mastered
            </span>
          </div>
        </div>

        {/* Topic Progress */}
        <div className="bg-white border border-[#E8ECF2] rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#64748B]">Topic Progress</span>
            <div className="w-7 h-7 rounded-md bg-[#EEEDFC] text-[#635BDB] flex items-center justify-center border border-[#DCDAF9]">
              <TrendingUp size={15} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#172033] mb-1.5">
              {completedConcepts} <span className="text-xs font-normal text-[#64748B]">/ {totalConcepts}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
              <span className="text-[#D97706] font-medium">{inProgressConcepts} in progress</span>
              <span>•</span>
              <span>{remainingConcepts} remaining</span>
            </div>
          </div>
        </div>

        {/* Knowledge Gaps */}
        <div className="bg-white border border-[#E8ECF2] rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#64748B]">Knowledge Gaps</span>
            <div className="w-7 h-7 rounded-md bg-[#FEF2F2] text-[#E05252] flex items-center justify-center border border-[#FEE2E2]">
              <AlertTriangle size={15} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#E05252] mb-1.5">
              {weakConcepts.length} <span className="text-xs font-normal text-[#64748B]">alerts</span>
            </div>
            <span className="text-[11px] text-[#64748B]">
              {weakConcepts.length > 0 ? 'Prerequisite repair recommended' : 'No cognitive gaps detected'}
            </span>
          </div>
        </div>

        {/* Time Budget */}
        <div className="bg-white border border-[#E8ECF2] rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#64748B]">Time Budget</span>
            <div className="w-7 h-7 rounded-md bg-[#EEEDFC] text-[#635BDB] flex items-center justify-center border border-[#DCDAF9]">
              <Clock size={15} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#172033] mb-1.5">
              {availableTimeBudgetMinutes}m
            </div>
            <span className="text-[11px] text-[#64748B]">
              ~{estimatedMinutesRemaining}m needed for mastery
            </span>
          </div>
        </div>
      </div>

      {/* Knowledge Gap Alert */}
      {weakConcepts.length > 0 && (
        <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white text-[#E05252] border border-[#FEE2E2] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#B91C1C]">
                Cognitive Gap Detected: {weakConcepts[0].name} ({weakConcepts[0].userMastery}% Mastery)
              </h4>
              <p className="text-xs text-[#7F1D1D]/80 leading-relaxed">
                This weak concept blocks downstream topics. The Contextual Revision Gate is active to prevent cognitive overload.
              </p>
            </div>
          </div>

          <button
            onClick={() => onStartConcept(weakConcepts[0].id)}
            className="px-3.5 py-1.5 bg-[#E05252] hover:bg-[#C94545] text-white text-xs font-medium rounded-lg shadow-xs transition shrink-0 self-start sm:self-auto"
          >
            Repair Prerequisite Gap
          </button>
        </div>
      )}

      {/* Main Dashboard Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Smart Priority Learning Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#E8ECF2] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                  Smart Priority Learning Queue
                </h3>
                <p className="text-xs text-[#64748B]">
                  Topologically sequenced and categorized by importance, difficulty, and weak areas.
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('map')}
                className="text-xs text-[#635BDB] hover:text-[#5249C9] font-medium flex items-center gap-1"
              >
                <span>View Graph</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* High Priority Tier */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#E05252]">
                <span className="w-2 h-2 rounded-full bg-[#E05252]" />
                <span>High Priority ({highPriority.length})</span>
              </div>
              <div className="space-y-2">
                {highPriority.map(concept => (
                  <div
                    key={concept.id}
                    onClick={() => onStartConcept(concept.id)}
                    className="p-3 bg-[#F8FAFC] border border-[#E8ECF2] hover:border-[#635BDB]/50 rounded-xl cursor-pointer transition flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#172033] group-hover:text-[#635BDB] transition-colors truncate">
                          {concept.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-[#FEF2F2] text-[#E05252] border border-[#FEE2E2]">
                          Score {concept.priorityScore}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                        {concept.priorityReason}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-[#64748B]">{concept.estimatedMinutes}m</span>
                      <div className="w-6 h-6 rounded bg-white border border-[#E8ECF2] flex items-center justify-center text-[#64748B] group-hover:text-[#635BDB]">
                        <ArrowRight size={12} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Medium Priority Tier */}
            <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#D97706]">
                <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                <span>Medium Priority ({mediumPriority.length})</span>
              </div>
              <div className="space-y-2">
                {mediumPriority.map(concept => (
                  <div
                    key={concept.id}
                    onClick={() => onStartConcept(concept.id)}
                    className="p-3 bg-[#F8FAFC] border border-[#E8ECF2] hover:border-[#635BDB]/50 rounded-xl cursor-pointer transition flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#172033] group-hover:text-[#635BDB] transition-colors truncate">
                          {concept.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7]">
                          Score {concept.priorityScore}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                        {concept.priorityReason}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-[#64748B]">{concept.estimatedMinutes}m</span>
                      <div className="w-6 h-6 rounded bg-white border border-[#E8ECF2] flex items-center justify-center text-[#64748B] group-hover:text-[#635BDB]">
                        <ArrowRight size={12} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Low Priority Tier */}
            {lowPriority.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Low Priority / Mastered ({lowPriority.length})</span>
                </div>
                <div className="space-y-2">
                  {lowPriority.map(concept => (
                    <div
                      key={concept.id}
                      onClick={() => onStartConcept(concept.id)}
                      className="p-2.5 bg-[#F8FAFC] border border-[#E8ECF2] rounded-xl opacity-80 hover:opacity-100 cursor-pointer transition flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-[#172033] truncate block">
                          {concept.name}
                        </span>
                        <span className="text-[10px] text-[#16A37A] font-semibold">
                          {concept.userMastery}% Mastered
                        </span>
                      </div>
                      <span className="text-xs text-[#64748B]">{concept.estimatedMinutes}m</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Uploaded Materials Catalog */}
          <div className="bg-white border border-[#E8ECF2] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] flex items-center gap-1.5">
                <FileText size={14} className="text-[#635BDB]" />
                Uploaded Study Material & Papers ({documents.length})
              </h3>
              <button
                onClick={onOpenUpload}
                className="text-xs font-semibold text-[#635BDB] hover:text-[#5249C9]"
              >
                + Add Documents
              </button>
            </div>

            <div className="space-y-3">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="p-3.5 bg-[#F8FAFC] border border-[#E8ECF2] rounded-xl space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-[#172033] leading-snug">
                        {doc.title}
                      </h4>
                      <span className="text-[11px] text-[#64748B]">
                        {doc.authors} • {doc.year} • {doc.pageCount} Pages • {doc.fileSize}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#635BDB] bg-[#EEEDFC] px-2 py-0.5 rounded-full border border-[#DCDAF9] shrink-0">
                      Indexed
                    </span>
                  </div>

                  <p className="text-[11px] text-[#475569] italic bg-white p-2 rounded-lg border border-[#E8ECF2]">
                    &ldquo;{doc.keyStance}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Today's Adaptive Schedule & Quick Modules */}
        <div className="space-y-6">
          {/* Today's Adaptive Schedule */}
          <div className="bg-white border border-[#E8ECF2] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] flex items-center gap-1.5">
                <CalendarCheck size={14} className="text-[#635BDB]" />
                Today&apos;s Adaptive Schedule
              </h3>
              <span className="text-[11px] font-medium text-[#635BDB] bg-[#EEEDFC] px-2 py-0.5 rounded-full">
                {availableTimeBudgetMinutes}m Budget
              </span>
            </div>

            <div className="space-y-2">
              {schedule.slice(0, 4).map((item, idx) => (
                <div
                  key={item.conceptId}
                  onClick={() => onStartConcept(item.conceptId)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                    item.status === 'completed'
                      ? 'bg-[#F8FAFC] border-[#E8ECF2] opacity-60'
                      : item.status === 'active'
                      ? 'bg-[#EEEDFC]/40 border-[#635BDB]/40 text-[#172033]'
                      : 'bg-[#F8FAFC] border-[#E8ECF2] hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-white border border-[#E8ECF2] text-[10px] font-bold text-[#64748B] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <span className="font-medium text-[#172033] block truncate">
                        {item.conceptName}
                      </span>
                      <span className="text-[10px] text-[#64748B] capitalize">{item.mode} mode</span>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-[#172033] shrink-0 ml-2">
                    {item.allocatedMinutes}m
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigateTab('plan')}
              className="w-full py-2 bg-[#F8FAFC] hover:bg-slate-100 text-[#172033] border border-[#E8ECF2] rounded-lg text-xs font-medium transition"
            >
              Adjust Available Time Budget
            </button>
          </div>

          {/* Quick Access Tools */}
          <div className="bg-white border border-[#E8ECF2] rounded-2xl p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
              Learning Modules
            </h4>

            <button
              onClick={() => onNavigateTab('map')}
              className="w-full p-3 bg-[#F8FAFC] hover:bg-slate-100 border border-[#E8ECF2] rounded-xl text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#EEEDFC] text-[#635BDB] flex items-center justify-center">
                  <GitFork size={15} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#172033] group-hover:text-[#635BDB] transition-colors">Knowledge Map</div>
                  <div className="text-[10px] text-[#64748B]">Interactive concept relationships</div>
                </div>
              </div>
              <ArrowRight size={13} className="text-[#64748B]" />
            </button>

            <button
              onClick={() => onNavigateTab('evidence')}
              className="w-full p-3 bg-[#F8FAFC] hover:bg-slate-100 border border-[#E8ECF2] rounded-xl text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
                  <Scale size={15} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#172033] group-hover:text-[#D97706] transition-colors">Evidence Matrix</div>
                  <div className="text-[10px] text-[#64748B]">Multi-paper contradiction analysis</div>
                </div>
              </div>
              <ArrowRight size={13} className="text-[#64748B]" />
            </button>

            <button
              onClick={() => onNavigateTab('plan')}
              className="w-full p-3 bg-[#F8FAFC] hover:bg-slate-100 border border-[#E8ECF2] rounded-xl text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#F8FAFC] text-[#64748B] border border-[#E8ECF2] flex items-center justify-center">
                  <Clock size={15} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#172033] transition-colors">Dynamic Replanner</div>
                  <div className="text-[10px] text-[#64748B]">Deadline & Crunch Mode controls</div>
                </div>
              </div>
              <ArrowRight size={13} className="text-[#64748B]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
