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
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F172A] flex flex-col">
      {/* Minimal Header */}
      <header className="h-14 px-4 border-b border-[#F1F5F9] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="p-2 rounded-xl hover:bg-[#F8FAFC] text-[#475569] transition"
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>
          <h1 className="text-base font-semibold text-[#0F172A] shrink-0">Quiz</h1>

          {/* Context Document Selector */}
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-3 py-1 text-xs max-w-[260px]">
            <FolderOpen size={13} className="text-[#635BDB] shrink-0" />
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
                className="bg-transparent text-xs font-medium text-[#0F172A] truncate focus:outline-hidden cursor-pointer w-full"
              >
                {workspace.documents.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-[#64748B] truncate">No documents yet</span>
            )}
          </div>
        </div>

        {/* Mode Switch */}
        <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-full p-0.5 text-xs">
          <button
            onClick={() => setQuizTab('active')}
            className={`px-3 py-1 rounded-full font-medium transition ${
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
            className={`px-3 py-1 rounded-full font-medium transition ${
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
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {workspace.documents.length === 0 ? (
          <div className="p-10 text-center bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-2xl text-xs text-[#64748B] space-y-2">
            <p className="font-medium text-[#0F172A]">Your Library has no study materials yet.</p>
            <p>Upload a PDF or paste notes in Library to generate context-based quizzes.</p>
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
              <div className="p-8 text-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-xs text-[#64748B]">
                No quiz questions extracted for this document yet. Try the 1d · 3d · 7d Recall tab!
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
