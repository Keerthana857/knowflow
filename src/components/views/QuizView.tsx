'use client';

import React, { useState } from 'react';
import { WorkspaceState, SpacedQuestion } from '../../types';
import {
  Menu,
  CheckCircle2,
  Lightbulb,
  Volume2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  RotateCcw,
  FolderOpen
} from 'lucide-react';

interface QuizViewProps {
  workspace: WorkspaceState;
  onOpenSidebar: () => void;
  onSelectContext: (folderId: string | null, documentId: string | null) => void;
  onUpdateMastery: (conceptId: string, newScore: number) => void;
}

export default function QuizView({
  workspace,
  onOpenSidebar,
  onSelectContext,
  onUpdateMastery
}: QuizViewProps) {
  const [quizTab, setQuizTab] = useState<'active' | 'spaced'>('active');

  const activeDoc =
    workspace.documents.find(d => d.id === workspace.activeDocumentId) ||
    workspace.documents[0];

  // Filter concepts belonging strictly to the selected document (or folder)
  const docConcepts = workspace.concepts.filter(c => c.sourceDocumentId === activeDoc?.id);
  const scopedConcepts =
    docConcepts.length > 0 ? docConcepts : workspace.concepts.slice(0, 3);

  // Flatten assessment questions from scoped concepts
  const scopedQuestions = scopedConcepts.flatMap(c =>
    (c.assessment || []).map(q => ({
      ...q,
      conceptId: c.id,
      conceptName: c.name
    }))
  );

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checkedState, setCheckedState] = useState<
    Record<string, 'correct' | 'hint' | 'revealed'>
  >({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Spaced Recall Pack (Stage 5) loaded dynamically for the active document
  const [spacedItems, setSpacedItems] = useState<SpacedQuestion[]>([]);
  const [isLoadingSpaced, setIsLoadingSpaced] = useState(false);
  const [revealedSpaced, setRevealedSpaced] = useState<Record<string, boolean>>({});

  const handleCheckQuestion = (qId: string, correctId: string | undefined, conceptId: string) => {
    const chosen = answers[qId];
    if (!chosen) return;

    if (chosen === correctId) {
      setCheckedState(prev => ({ ...prev, [qId]: 'correct' }));
      onUpdateMastery(conceptId, 90);
    } else {
      // Hint-only guardrail first (never spoil the answer on first try!)
      setCheckedState(prev => ({
        ...prev,
        [qId]: prev[qId] === 'hint' ? 'revealed' : 'hint'
      }));
    }
  };

  const loadSpacedRecall = async () => {
    setIsLoadingSpaced(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 5,
          message: `Generate spaced recall pack for ${activeDoc?.title || 'this material'}`,
          folderId: activeDoc?.folderId,
          documentId: activeDoc?.id,
          documents: workspace.documents,
          concepts: workspace.concepts,
          creditSaverMode: workspace.creditSaverMode ?? true
        })
      });
      const data = await res.json();
      if (res.ok && data.tutorData?.spacedQuestions) {
        setSpacedItems(data.tutorData.spacedQuestions);
      }
    } catch (err) {
      console.error('Failed to load spaced recall:', err);
    } finally {
      setIsLoadingSpaced(false);
    }
  };

  const handleSpeak = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = workspace.audioSpeed || 1.0;
    window.speechSynthesis.speak(u);
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  };

  const correctCount = scopedQuestions.filter(q => checkedState[q.id] === 'correct').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F7FF] via-[#FFFFFF] to-[#F3FAFF] text-[#0F172A] flex flex-col">
      {/* Minimal Header */}
      <header className="h-16 px-5 border-b border-[#E6EAF5]/80 bg-white/80 backdrop-blur-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="p-2.5 rounded-full hover:bg-[#EEF2FF] text-[#475569] transition"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <span className="text-lg font-bold bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent tracking-tight shrink-0">
            KNOWFLOW
          </span>

          {/* Context Document Selector */}
          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-3.5 py-1.5 text-sm max-w-[260px]">
            <FolderOpen size={15} className="text-[#635BDB] shrink-0" />
            {workspace.documents.length > 0 ? (
              <select
                value={activeDoc?.id || ''}
                onChange={(e) => {
                  const doc = workspace.documents.find(d => d.id === e.target.value);
                  onSelectContext(doc?.folderId || null, doc?.id || null);
                  setAnswers({});
                  setCheckedState({});
                  setSpacedItems([]);
                }}
                className="bg-transparent text-sm font-medium text-[#0F172A] truncate focus:outline-hidden cursor-pointer w-full"
              >
                {workspace.documents.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-[#64748B] truncate">No documents yet</span>
            )}
          </div>
        </div>

        {/* Mode Switch */}
        <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-full p-1 text-sm">
          <button
            onClick={() => setQuizTab('active')}
            className={`px-4 py-1 rounded-full font-medium transition ${
              quizTab === 'active'
                ? 'bg-white text-[#635BDB] shadow-2xs border border-[#E2E8F0]'
                : 'text-[#64748B]'
            }`}
          >
            Hint Check
          </button>
          <button
            onClick={() => {
              setQuizTab('spaced');
              if (spacedItems.length === 0) loadSpacedRecall();
            }}
            className={`px-4 py-1 rounded-full font-medium transition ${
              quizTab === 'spaced'
                ? 'bg-white text-[#635BDB] shadow-2xs border border-[#E2E8F0]'
                : 'text-[#64748B]'
            }`}
          >
            1d · 3d · 7d Recall
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-5 py-8 sm:py-10 space-y-6">
        <div className="animate-fade-up space-y-1.5">
          <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">
            Check Your Understanding
          </h1>
          <p className="text-sm text-[#64748B]">
            Active recall with hints first, plus 1-day, 3-day, and 7-day application prompts.
          </p>
        </div>

        {workspace.documents.length === 0 ? (
          <div className="animate-fade-up-delay py-16 px-6 text-center bg-[#F8FAFC] border-2 border-dashed border-[#CBD5E1] rounded-3xl text-sm text-[#64748B] space-y-2">
            <p className="text-base font-semibold text-[#0F172A]">Your Library has no study materials yet.</p>
            <p>Upload a PDF or paste notes in Library to unlock tailored quizzes.</p>
          </div>
        ) : quizTab === 'active' ? (
          <>
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span>
                Scoped to: <strong className="text-[#0F172A]">{activeDoc?.title}</strong>
              </span>
              <span>
                Score: <strong className="text-[#16A37A]">{correctCount}</strong> / {scopedQuestions.length}
              </span>
            </div>

            {scopedQuestions.length === 0 ? (
              <div className="bg-white/90 border border-[#E6EAF5] rounded-3xl p-8 text-center space-y-4 shadow-xs">
                <div className="space-y-1">
                  <p className="text-base font-semibold text-[#0F172A]">
                    Ready to quiz on {activeDoc?.title}
                  </p>
                  <p className="text-sm text-[#64748B]">
                    Generate mixed recall & application questions directly from your saved material.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setQuizTab('spaced');
                    if (spacedItems.length === 0) loadSpacedRecall();
                  }}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-[#635BDB] to-[#7C6FF6] text-white text-sm font-semibold shadow-sm transition inline-flex items-center gap-2"
                >
                  <Sparkles size={15} />
                  <span>Generate Context Quiz</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {scopedQuestions.map((q, idx) => {
                  const state = checkedState[q.id];
                  const chosen = answers[q.id];

                  return (
                    <div
                      key={q.id}
                      className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-3 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#635BDB]">
                          {q.level} · {q.conceptName}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSpeak(q.question)}
                            className="p-1.5 rounded-lg hover:bg-[#F8FAFC] text-[#64748B]"
                            title="Listen"
                          >
                            <Volume2 size={14} />
                          </button>
                          <button
                            onClick={() => handleCopy(q.id, q.question)}
                            className="p-1.5 rounded-lg hover:bg-[#F8FAFC] text-[#64748B]"
                            title="Copy question"
                          >
                            {copiedId === q.id ? (
                              <Check size={14} className="text-[#16A37A]" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      <h3 className="text-sm font-semibold text-[#0F172A]">
                        {idx + 1}. {q.question}
                      </h3>

                      {q.options && q.options.length > 0 ? (
                        <div className="space-y-2">
                          {q.options.map(opt => {
                            const isSelected = chosen === opt.id;
                            let cls = 'border-[#E2E8F0] hover:bg-[#F8FAFC]';
                            if (isSelected) cls = 'border-[#635BDB] bg-[#EEF2FF]/50 text-[#312E81] font-medium';
                            if (state === 'correct' && opt.id === q.correctOptionId) {
                              cls = 'border-[#16A37A] bg-[#F0FDF4] text-[#14532D] font-medium';
                            } else if (state === 'revealed' && opt.id === q.correctOptionId) {
                              cls = 'border-[#16A37A] bg-[#F0FDF4] text-[#14532D]';
                            }

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  if (state === 'correct' || state === 'revealed') return;
                                  setAnswers(prev => ({ ...prev, [q.id]: opt.id }));
                                }}
                                className={`w-full text-left p-3 rounded-xl border text-xs transition ${cls}`}
                              >
                                {opt.text}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <textarea
                          rows={2}
                          value={chosen || ''}
                          onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="Write your short answer..."
                          className="w-full text-xs p-3 rounded-xl border border-[#E2E8F0] focus:border-[#635BDB] focus:outline-hidden"
                        />
                      )}

                      {/* Hint or Verified Feedback */}
                      {state === 'hint' && (
                        <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FEF3C7] text-xs text-[#78350F] flex items-start gap-2">
                          <Lightbulb size={14} className="text-[#D97706] shrink-0 mt-0.5" />
                          <div>
                            <strong>Hint:</strong>{' '}
                            {q.hint || 'Think about the cause-and-effect described in the material and try another option.'}
                          </div>
                        </div>
                      )}

                      {(state === 'correct' || state === 'revealed') && (
                        <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#14532D] flex items-start gap-2">
                          <CheckCircle2 size={14} className="text-[#16A37A] shrink-0 mt-0.5" />
                          <span>{q.rubricExplanation}</span>
                        </div>
                      )}

                      {state !== 'correct' && state !== 'revealed' && (
                        <div className="flex justify-end">
                          <button
                            onClick={() =>
                              q.type === 'mcq'
                                ? handleCheckQuestion(q.id, q.correctOptionId, q.conceptId)
                                : setCheckedState(prev => ({ ...prev, [q.id]: 'revealed' }))
                            }
                            disabled={!chosen}
                            className="px-4 py-1.5 rounded-full bg-[#635BDB] hover:bg-[#5249C9] disabled:opacity-40 text-white text-xs font-medium transition"
                          >
                            {state === 'hint' ? 'Try Again / Reveal' : 'Check Answer'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* Spaced & Interleaved Recall (1d / 3d / 7d) */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748B]">
                Mixed application prompts for <strong className="text-[#0F172A]">{activeDoc?.title}</strong>
              </span>
              <button
                onClick={loadSpacedRecall}
                disabled={isLoadingSpaced}
                className="text-xs font-medium text-[#635BDB] hover:underline flex items-center gap-1"
              >
                <RotateCcw size={12} />
                <span>Refresh Pack</span>
              </button>
            </div>

            {isLoadingSpaced ? (
              <div className="p-8 text-center text-xs text-[#64748B] flex items-center justify-center gap-2">
                <Sparkles size={14} className="text-[#635BDB] animate-spin" />
                <span>Generating mixed spaced recall questions...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {spacedItems.map((sq, idx) => {
                  const isOpen = !!revealedSpaced[sq.id];
                  return (
                    <div
                      key={sq.id}
                      className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#635BDB]">
                          {sq.daySchedule} · {sq.topic}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSpeak(sq.question)}
                            className="p-1.5 rounded-lg hover:bg-[#F8FAFC] text-[#64748B]"
                            title="Listen"
                          >
                            <Volume2 size={14} />
                          </button>
                          <button
                            onClick={() => handleCopy(sq.id, `${sq.question}\nAnswer: ${sq.answer}`)}
                            className="p-1.5 rounded-lg hover:bg-[#F8FAFC] text-[#64748B]"
                            title="Copy"
                          >
                            {copiedId === sq.id ? (
                              <Check size={14} className="text-[#16A37A]" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              setRevealedSpaced(prev => ({ ...prev, [sq.id]: !prev[sq.id] }))
                            }
                            className="px-2.5 py-1 rounded-full border border-[#E2E8F0] text-[11px] font-medium text-[#635BDB] flex items-center gap-1"
                          >
                            {isOpen ? <EyeOff size={12} /> : <Eye size={12} />}
                            <span>{isOpen ? 'Hide' : 'Answer'}</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-sm font-medium text-[#0F172A]">
                        {idx + 1}. {sq.question}
                      </p>

                      {isOpen && (
                        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#334155]">
                          {sq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
