'use client';

import React, { useState } from 'react';
import { Concept, CognitiveDepthMode, WorkspaceState } from '../types';
import UnderstandingDetector from './UnderstandingDetector';
import {
  Layers,
  Zap,
  BookOpen,
  Microscope,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Send,
  Lightbulb,
  Award,
  RefreshCw,
  X
} from 'lucide-react';

interface LearningSessionProps {
  concept: Concept;
  allConcepts: Concept[];
  onConceptCompleted: (updatedWs: WorkspaceState) => void;
  onNextTopic: (nextConceptId: string) => void;
  onBackToMap: () => void;
}

export default function LearningSession({
  concept,
  allConcepts,
  onConceptCompleted,
  onNextTopic,
  onBackToMap
}: LearningSessionProps) {
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [depthMode, setDepthMode] = useState<CognitiveDepthMode>('normal');
  const [activeTab, setActiveTab] = useState<'content' | 'examples' | 'quiz'>('content');

  // "Ask AI about this concept" drawer/state
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: `Hello! I am your KNOWFLOW tutor for "${concept.name}". Ask me anything about the intuition, formulas, or hardware trade-offs.`
    }
  ]);

  const chunks = concept.chunks || [];
  const currentChunk = chunks[currentChunkIndex] || {
    id: 'placeholder',
    index: 1,
    title: 'Core Concept Principle',
    coreIdea: concept.summary,
    simple: { intuition: concept.summary, analogy: 'Intuitive grounding', plainEnglish: concept.summary },
    normal: { mechanics: 'Mechanics breakdown', keyFormulas: '', structuredExplanation: 'Detailed breakdown' },
    deep: { formalDefinition: '', edgeCases: '', researchNuance: '' },
    keyTakeaway: 'Master the core trade-off before moving downstream.'
  };

  const progressPercent = Math.round(((currentChunkIndex + 1) / Math.max(1, chunks.length)) * 100);

  // Find next concept in topological priority queue
  const currentIndex = allConcepts.findIndex(c => c.id === concept.id);
  const nextConcept = allConcepts[currentIndex + 1] || allConcepts[0];

  const handleAskAi = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiQuery.trim() || isAiLoading) return;

    const query = aiQuery.trim();
    setAiQuery('');
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptId: concept.id,
          message: query
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', text: `Regarding ${concept.name}: Remember that ${concept.chunks[0]?.coreIdea || concept.summary}` }
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: `Regarding ${concept.name}: The primary trade-off to keep in mind is: "${concept.chunks[0]?.keyTakeaway}"` }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Navigation */}
      <div className="bg-white border border-[#E8ECF2] rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            onClick={onBackToMap}
            className="text-[11px] font-semibold text-[#64748B] hover:text-[#172033] flex items-center gap-1 mb-1.5 transition"
          >
            <ArrowLeft size={12} /> Back to Knowledge Map
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
              concept.priorityTier === 'high' ? 'bg-[#FEF2F2] text-[#E05252] border-[#FEE2E2]' :
              concept.priorityTier === 'medium' ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]' :
              'bg-[#F8FAFC] text-[#64748B] border-[#E8ECF2]'
            }`}>
              {concept.priorityTier} Priority
            </span>
            <h2 className="text-lg font-bold text-[#172033]">{concept.name}</h2>
          </div>
          <span className="text-[11px] text-[#64748B] block mt-1">
            Source: {concept.sourceSection}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Ask AI Button */}
          <button
            onClick={() => setIsAiOpen(true)}
            className="px-3.5 py-2 bg-[#EEEDFC] hover:bg-[#E0DEFA] border border-[#D5D1F7] text-[#635BDB] rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <MessageSquare size={13} />
            <span>Ask AI Tutor</span>
          </button>

          {/* Next Topic Button */}
          {nextConcept && nextConcept.id !== concept.id && (
            <button
              onClick={() => onNextTopic(nextConcept.id)}
              className="px-3.5 py-2 bg-white hover:bg-[#F8FAFC] text-[#172033] text-xs font-semibold rounded-xl border border-[#E8ECF2] flex items-center gap-1 shadow-xs transition"
            >
              <span>Next Topic</span>
              <ArrowRight size={13} className="text-[#64748B]" />
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation: Core Content, Real-World Examples, Active Quiz */}
      <div className="flex items-center gap-2 border-b border-[#E8ECF2] pb-3">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'content'
              ? 'bg-[#635BDB] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#172033] bg-white border border-[#E8ECF2]'
          }`}
        >
          <BookOpen size={13} />
          <span>Chunked Learning</span>
        </button>

        <button
          onClick={() => setActiveTab('examples')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'examples'
              ? 'bg-[#635BDB] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#172033] bg-white border border-[#E8ECF2]'
          }`}
        >
          <Lightbulb size={13} />
          <span>Real-World Examples ({concept.examples?.length || 1})</span>
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'quiz'
              ? 'bg-[#16A37A] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#172033] bg-white border border-[#E8ECF2]'
          }`}
        >
          <Award size={13} />
          <span>Understanding Quiz ({concept.userMastery}% Mastery)</span>
        </button>
      </div>

      {/* TAB 1: Chunked Learning Content */}
      {activeTab === 'content' && (
        <div className="space-y-5">
          {/* 3-Way Depth Switcher */}
          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#E8ECF2] shadow-xs">
            <span className="text-xs font-bold text-[#172033] ml-2">Explanation Depth:</span>
            <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-lg border border-[#E8ECF2]">
              <button
                onClick={() => setDepthMode('simple')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                  depthMode === 'simple'
                    ? 'bg-white text-[#0284C7] border border-[#BAE6FD] shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                <Zap size={12} className={depthMode === 'simple' ? 'text-[#0284C7]' : ''} /> Simple Mode
              </button>
              <button
                onClick={() => setDepthMode('normal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                  depthMode === 'normal'
                    ? 'bg-[#635BDB] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                <Layers size={12} /> Normal Mode
              </button>
              <button
                onClick={() => setDepthMode('deep')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                  depthMode === 'deep'
                    ? 'bg-[#7C3AED] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                <Microscope size={12} /> Deep Mode
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[#64748B] px-1 font-medium">
              <span>Learning Chunk {currentChunkIndex + 1} of {chunks.length}</span>
              <span className="text-[#172033] font-bold">{progressPercent}%</span>
            </div>
            <div className="h-1.5 bg-[#E8ECF2] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#635BDB] to-[#8B5CF6] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 1-Idea Micro-Chunk Card */}
          <div className="bg-white border border-[#E8ECF2] rounded-2xl p-7 shadow-xs space-y-6">
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#EEEDFC] flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#EEEDFC] text-[#635BDB] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#635BDB] uppercase tracking-wider mb-0.5">
                  Core Principle
                </div>
                <p className="text-base font-bold text-[#172033] leading-snug">
                  {currentChunk.coreIdea}
                </p>
              </div>
            </div>

            {/* Depth Body */}
            {depthMode === 'simple' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-4 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD]">
                  <div className="text-xs font-bold text-[#0369A1] uppercase tracking-wide mb-1">Analogy</div>
                  <p className="text-sm text-[#0C4A6E] italic">&ldquo;{currentChunk.simple.analogy}&rdquo;</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Plain English Intuition</h4>
                  <p className="text-sm text-[#172033] leading-relaxed font-medium">{currentChunk.simple.intuition}</p>
                  <p className="text-xs text-[#64748B] leading-relaxed">{currentChunk.simple.plainEnglish}</p>
                </div>
              </div>
            )}

            {depthMode === 'normal' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Structural Mechanics</h4>
                  <p className="text-sm text-[#172033] leading-relaxed font-medium">{currentChunk.normal.mechanics}</p>
                </div>
                {currentChunk.normal.keyFormulas && (
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E8ECF2] font-mono text-xs text-[#635BDB]">
                    <span className="text-[10px] text-[#64748B] block uppercase font-bold mb-1 font-sans">Key Formula</span>
                    {currentChunk.normal.keyFormulas}
                  </div>
                )}
                <p className="text-xs text-[#64748B] leading-relaxed">{currentChunk.normal.structuredExplanation}</p>
              </div>
            )}

            {depthMode === 'deep' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-4 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] font-mono text-xs text-[#6B21A8]">
                  <div className="text-xs font-bold text-[#7C3AED] uppercase tracking-wide mb-1 font-sans">Formal Definition</div>
                  {currentChunk.deep.formalDefinition}
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Boundary Conditions & Edge Cases</h4>
                  <p className="text-sm text-[#172033] leading-relaxed font-medium">{currentChunk.deep.edgeCases}</p>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E8ECF2] text-xs text-[#64748B]">
                  <strong className="text-[#172033]">Research Nuance: </strong>
                  {currentChunk.deep.researchNuance}
                </div>
              </div>
            )}

            {/* Takeaway */}
            <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center gap-2.5 text-xs text-[#166534] font-medium">
              <CheckCircle2 size={16} className="text-[#16A37A] shrink-0" />
              <span><strong className="text-[#14532D]">Takeaway: </strong>{currentChunk.keyTakeaway}</span>
            </div>

            {/* Chunk Nav Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E8ECF2]">
              <button
                onClick={() => setCurrentChunkIndex(c => Math.max(0, c - 1))}
                disabled={currentChunkIndex === 0}
                className="px-4 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] disabled:opacity-40 text-[#172033] text-xs font-semibold rounded-xl border border-[#E8ECF2] flex items-center gap-1.5 transition"
              >
                <ArrowLeft size={14} /> Previous
              </button>

              {currentChunkIndex < chunks.length - 1 ? (
                <button
                  onClick={() => setCurrentChunkIndex(c => Math.min(chunks.length - 1, c + 1))}
                  className="px-5 py-2.5 bg-[#635BDB] hover:bg-[#5249C9] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition"
                >
                  <span>Next Chunk</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('quiz')}
                  className="px-6 py-2.5 bg-[#16A37A] hover:bg-[#138865] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition"
                >
                  <Award size={15} />
                  <span>Take Understanding Quiz</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Real-World Examples Section */}
      {activeTab === 'examples' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {(concept.examples && concept.examples.length > 0 ? concept.examples : [
            {
              title: `Production Deployment Scenario: ${concept.name}`,
              scenario: `Operating an enterprise LLM service processing long-document workloads under strict memory and latency budgets.`,
              breakdown: `Applying ${concept.name} prevents sudden GPU memory exhaustion and bounds information loss.`
            }
          ]).map((ex, idx) => (
            <div key={idx} className="bg-white border border-[#E8ECF2] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] flex items-center justify-center font-bold text-xs">
                  {idx + 1}
                </span>
                <h3 className="text-base font-bold text-[#172033]">{ex.title}</h3>
              </div>

              <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E8ECF2] space-y-1.5">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Concrete Real-World Scenario</span>
                <p className="text-xs text-[#172033] leading-relaxed font-medium">{ex.scenario}</p>
              </div>

              <div className="p-4 bg-[#EEEDFC] border border-[#D5D1F7] rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-[#635BDB] uppercase tracking-wider">Architectural Breakdown & Solution</span>
                <p className="text-xs text-[#172033] leading-relaxed font-medium">{ex.breakdown}</p>
              </div>
            </div>
          ))}

          <button
            onClick={() => setActiveTab('quiz')}
            className="w-full py-3 bg-[#16A37A] hover:bg-[#138865] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
          >
            <span>Ready to Test Understanding</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* TAB 3: Quiz Section (Active Verification) */}
      {activeTab === 'quiz' && (
        <UnderstandingDetector
          concept={concept}
          onEvaluationComplete={(updatedWs) => {
            onConceptCompleted(updatedWs);
          }}
          onBackToChunks={() => setActiveTab('content')}
        />
      )}

      {/* "Ask AI About This Concept" Slide-out Drawer */}
      {isAiOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white border-l border-[#E8ECF2] h-full flex flex-col p-5 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E8ECF2] mb-4">
              <div className="flex items-center gap-2 text-[#635BDB]">
                <Sparkles size={18} />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                  Ask AI Concept Tutor
                </h4>
              </div>
              <button
                onClick={() => setIsAiOpen(false)}
                className="text-[#64748B] hover:text-[#172033] p-1 rounded-md"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs mb-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#635BDB] text-white ml-6 font-medium shadow-xs'
                      : 'bg-[#F8FAFC] border border-[#E8ECF2] text-[#172033] mr-4'
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {isAiLoading && (
                <div className="p-3 bg-[#F8FAFC] border border-[#E8ECF2] rounded-xl text-[#64748B] flex items-center gap-2">
                  <RefreshCw size={13} className="animate-spin text-[#635BDB]" />
                  <span>Consulting knowledge model...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleAskAi} className="flex gap-2 pt-3 border-t border-[#E8ECF2]">
              <input
                type="text"
                placeholder="Ask about formulas, derivations, or analogies..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                className="flex-1 bg-[#F8FAFC] border border-[#E8ECF2] rounded-xl px-3 py-2 text-xs text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#635BDB] focus:bg-white"
              />
              <button
                type="submit"
                disabled={!aiQuery.trim() || isAiLoading}
                className="px-3.5 py-2 bg-[#635BDB] hover:bg-[#5249C9] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center transition shadow-xs"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
