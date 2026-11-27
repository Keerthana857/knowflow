'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  WorkspaceState,
  ChatMessage,
  TutorStage,
  TutorResponsePayload
} from '../../types';
import { ActiveSection } from '../Sidebar';
import VisualFlowCard from '../VisualFlowCard';
import {
  Plus,
  Mic,
  MicOff,
  Send,
  Volume2,
  Square,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  FileText,
  Sparkles,
  Lightbulb,
  Zap,
  GitMerge,
  CheckCircle2,
  Eye,
  EyeOff,
  Upload,
  ClipboardPaste,
  Menu,
  AtSign,
  X
} from 'lucide-react';

interface AskAIViewProps {
  workspace: WorkspaceState;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  activeStage: TutorStage;
  setActiveStage: React.Dispatch<React.SetStateAction<TutorStage>>;
  onOpenSidebar: () => void;
  onSelectContext: (folderId: string | null, documentId: string | null) => void;
  onOpenUpload: () => void;
  onPasteNotes: (title: string, text: string, folderId: string) => Promise<void>;
  onNavigateSection: (section: ActiveSection) => void;
  onChatSaved?: (msgs: ChatMessage[], stage: TutorStage) => void;
}

const STAGES: Array<{ id: TutorStage; title: string; sub: string }> = [
  { id: 1, title: '1. Story Hook', sub: 'Causal Analogy' },
  { id: 2, title: '2. Scaffolding', sub: 'Simple → Detailed' },
  { id: 3, title: '3. Worked Example', sub: 'Example & Why' },
  { id: 4, title: '4. Teach-Back', sub: 'Explain & Hints' },
  { id: 5, title: '5. Spaced Recall', sub: '1d → 3d → 7d' }
];

export default function AskAIView({
  workspace,
  messages,
  setMessages,
  activeStage,
  setActiveStage,
  onOpenSidebar,
  onSelectContext,
  onOpenUpload,
  onPasteNotes,
  onNavigateSection,
  onChatSaved
}: AskAIViewProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tutorMode, setTutorMode] = useState<'5-stage' | 'quick'>('5-stage');
  const [showStageMap, setShowStageMap] = useState(true);

  // Audio TTS & Voice STT state
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // @ mention picker for calling Library folders/files in chat
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Attach / Paste popover
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [isPasting, setIsPasting] = useState(false);

  // Revealed answers & hints in Stage 5 / Check questions
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [revealedLayer, setRevealedLayer] = useState<Record<string, 1 | 2 | 3>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const activeDoc =
    workspace.documents.find(d => d.id === workspace.activeDocumentId) ||
    workspace.documents[0];
  const activeFolder =
    workspace.folders.find(f => f.id === workspace.activeFolderId) ||
    workspace.folders[0];

  const handleSpeak = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = workspace.audioSpeed || 1.0;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = async (msgId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const toggleVoiceInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const rec = new SpeechRec();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
      }
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    setIsListening(true);
    rec.start();
  };

  const handleStopOrEnd = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    }
  };

  const handleEndSession = () => {
    handleStopOrEnd();
    setMessages([]);
    setActiveStage(1);
  };

  const sendToTutor = async (promptText: string, stageToRun: TutorStage) => {
    if (isLoading) return;
    const cleanPrompt = promptText.trim();

    if (cleanPrompt) {
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: cleanPrompt,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMsg]);
    }

    setInput('');
    setActiveStage(stageToRun);
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: cleanPrompt || `Teach Stage ${stageToRun}`,
          stage: stageToRun,
          folderId: workspace.activeFolderId,
          documentId: workspace.activeDocumentId,
          conceptId: workspace.activeConceptId,
          documents: workspace.documents,
          concepts: workspace.concepts,
          creditSaverMode: workspace.creditSaverMode ?? true
        })
      });

      const data = await res.json();
      if (res.ok && data.tutorData) {
        const aiMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.tutorData.narrative || data.reply || '',
          timestamp: new Date().toISOString(),
          tutorData: data.tutorData
        };
        setMessages(prev => {
          const next = [...prev, aiMsg];
          onChatSaved?.(next, stageToRun);
          return next;
        });
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Ask AI error:', err);
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleStageChange = (nextStage: TutorStage) => {
    setActiveStage(nextStage);
    sendToTutor('', nextStage);
  };

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteText.trim()) return;
    setIsPasting(true);
    try {
      await onPasteNotes(
        pasteTitle.trim() || `Notes (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        pasteText.trim(),
        workspace.activeFolderId || workspace.folders[0]?.id || 'folder-my-notes'
      );
      setShowPasteModal(false);
      setPasteTitle('');
      setPasteText('');
      // Immediately start Stage 1 Story Hook grounded in the newly pasted notes
      await sendToTutor('Start with the Story Hook for my pasted notes.', 1);
    } finally {
      setIsPasting(false);
    }
  };

  const buildCopyText = (t?: TutorResponsePayload, fallback?: string) => {
    if (!t) return fallback || '';
    const parts = [t.headline, t.narrative];
    if (t.storyBeats) parts.push(t.storyBeats.map(b => `${b.step}. ${b.title}: ${b.text}`).join('\n'));
    if (t.layers) {
      parts.push('Core Ideas:\n' + t.layers.skeleton.map(s => `- ${s}`).join('\n'));
      parts.push(`Mechanism: ${t.layers.mechanism}`);
      if (t.layers.formula) parts.push(`Formula: ${t.layers.formula}`);
    }
    if (t.workedExample) {
      parts.push(t.workedExample.title + '\n' + t.workedExample.steps.join('\n'));
    }
    if (t.spacedQuestions) {
      parts.push(t.spacedQuestions.map(q => `[${q.daySchedule}] ${q.question}`).join('\n'));
    }
    return parts.filter(Boolean).join('\n\n');
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#F5F7FF] via-[#FFFFFF] to-[#F3FAFF] text-[#0F172A]">
      {/* Minimal ChatGPT-style Top Bar */}
      <header className="shrink-0 h-16 px-5 border-b border-[#E6EAF5]/80 flex items-center justify-between gap-3 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="p-2.5 rounded-xl hover:bg-[#F8FAFC] text-[#475569] transition"
            title="Open sidebar (or drag from left)"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>

          {/* Clean Mode Pill */}
          <div className="hidden sm:flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-full p-1 text-sm">
            <button
              onClick={() => {
                setTutorMode('5-stage');
                setShowStageMap(true);
              }}
              className={`px-3.5 py-1 rounded-full font-medium transition ${
                tutorMode === '5-stage'
                  ? 'bg-white text-[#635BDB] shadow-2xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              5-Stage Tutor
            </button>
            <button
              onClick={() => {
                setTutorMode('quick');
                setShowStageMap(false);
              }}
              className={`px-3.5 py-1 rounded-full font-medium transition ${
                tutorMode === 'quick'
                  ? 'bg-white text-[#635BDB] shadow-2xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Visual Ask
            </button>
          </div>

          {/* Active Folder/Document Context Picker */}
          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-3.5 py-1.5 text-sm max-w-[280px] sm:max-w-xs">
            <FolderOpen size={15} className="text-[#635BDB] shrink-0" />
            {workspace.documents.length > 0 ? (
              <select
                value={activeDoc?.id || ''}
                onChange={(e) => {
                  const doc = workspace.documents.find(d => d.id === e.target.value);
                  onSelectContext(doc?.folderId || null, doc?.id || null);
                }}
                className="bg-transparent text-sm font-medium text-[#0F172A] truncate focus:outline-hidden cursor-pointer w-full"
                title="Select context document from Library"
              >
                {workspace.documents.map(doc => {
                  const folder = workspace.folders.find(f => f.id === doc.folderId);
                  return (
                    <option key={doc.id} value={doc.id}>
                      {folder ? `${folder.name} / ` : ''}
                      {doc.title}
                    </option>
                  );
                })}
              </select>
            ) : (
              <span className="text-sm text-[#64748B] truncate">No document yet</span>
            )}
          </div>
        </div>

        {/* Right Stage Stepper */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => activeStage > 1 && handleStageChange((activeStage - 1) as TutorStage)}
            disabled={activeStage === 1 || isLoading}
            className="px-3.5 py-1.5 rounded-full border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-35 transition flex items-center gap-1"
          >
            <ChevronLeft size={15} />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <span className="text-sm font-semibold text-[#475569] px-1.5 tabular-nums">
            {activeStage} / 5
          </span>

          <button
            onClick={() => activeStage < 5 && handleStageChange((activeStage + 1) as TutorStage)}
            disabled={activeStage === 5 || isLoading}
            className="px-4 py-1.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-medium disabled:opacity-35 transition flex items-center gap-1"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={15} />
          </button>

          {messages.length > 0 && (
            <button
              onClick={handleEndSession}
              className="px-3.5 py-1.5 rounded-full border border-[#FEE2E2] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] text-sm font-medium transition"
              title="End current chat session"
            >
              End
            </button>
          )}
        </div>
      </header>

      {/* Main Centered Stream */}
      <div className="flex-1 overflow-y-auto px-5 py-7">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Interactive 5-Stage Connected Flow Map */}
          {showStageMap && (
            <div className="animate-fade-up bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl p-5 sm:p-6">
              {/* Top Row: Stages 1 -> 2 -> 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-center">
                {STAGES.slice(0, 3).map((st, idx) => {
                  const isActive = activeStage === st.id;
                  return (
                    <div key={st.id} className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleStageChange(st.id)}
                        className={`flex-1 px-4 py-3.5 rounded-2xl border text-center transition ${
                          isActive
                            ? 'bg-[#EEF2FF] border-[#635BDB] text-[#312E81] shadow-xs'
                            : 'bg-white border-[#E2E8F0] text-[#334155] hover:border-[#CBD5E1]'
                        }`}
                      >
                        <div className="text-sm font-semibold">{st.title}</div>
                        <div className="text-xs text-[#64748B] italic mt-0.5">{st.sub}</div>
                      </button>
                      {idx < 2 && (
                        <ChevronRight
                          size={16}
                          className="hidden sm:block text-[#94A3B8] shrink-0"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Middle loop connector */}
              <div className="hidden sm:flex items-center justify-between px-12 py-2 text-xs text-[#64748B]">
                <div className="w-1/3" />
                <div className="flex items-center gap-1 bg-white border border-[#E2E8F0] px-3 py-0.5 rounded-full text-xs font-medium text-[#635BDB]">
                  <span>↑ Weak spots</span>
                </div>
                <div className="w-1/3 flex justify-center text-[#94A3B8]">↓</div>
              </div>

              {/* Bottom Row: Stage 5 <- Stage 4 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2 sm:mt-0 sm:px-12 items-center">
                <button
                  onClick={() => handleStageChange(5)}
                  className={`px-4 py-3.5 rounded-2xl border text-center transition order-2 sm:order-1 ${
                    activeStage === 5
                      ? 'bg-[#EEF2FF] border-[#635BDB] text-[#312E81] shadow-xs'
                      : 'bg-white border-[#E2E8F0] text-[#334155] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="text-sm font-semibold">{STAGES[4].title}</div>
                  <div className="text-xs text-[#64748B] italic mt-0.5">{STAGES[4].sub}</div>
                </button>

                <div className="flex items-center gap-2.5 order-1 sm:order-2">
                  <ChevronLeft
                    size={16}
                    className="hidden sm:block text-[#94A3B8] shrink-0"
                  />
                  <button
                    onClick={() => handleStageChange(4)}
                    className={`flex-1 px-4 py-3.5 rounded-2xl border text-center transition ${
                      activeStage === 4
                        ? 'bg-[#EEF2FF] border-[#635BDB] text-[#312E81] shadow-xs'
                        : 'bg-white border-[#E2E8F0] text-[#334155] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="text-sm font-semibold">{STAGES[3].title}</div>
                    <div className="text-xs text-[#64748B] italic mt-0.5">{STAGES[3].sub}</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty Welcome State (Fade-in hero title + big inviting buttons) */}
          {messages.length === 0 && !isLoading && (
            <div className="py-10 text-center space-y-6">
              <div className="animate-fade-up-delay space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
                  What do you want to master today?
                </h1>
                <p className="text-sm sm:text-base text-[#64748B] max-w-xl mx-auto">
                  {activeDoc ? (
                    <>
                      Active context: <span className="font-semibold text-[#0F172A]">{activeDoc.title}</span>
                    </>
                  ) : (
                    'Upload a PDF, paste study notes, or ask any topic below to start the 5-stage flow.'
                  )}
                </p>
              </div>

              <div className="animate-fade-up-slow flex flex-wrap items-center justify-center gap-3">
                {activeDoc && (
                  <button
                    onClick={() => sendToTutor(`Start learning "${activeDoc.title}" with a Story Hook`, 1)}
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-[#635BDB] to-[#7C6FF6] hover:from-[#544BC9] hover:to-[#6B5CE8] text-white text-sm font-semibold transition flex items-center gap-2 shadow-sm"
                  >
                    <Sparkles size={16} />
                    <span>Start 1. Story Hook</span>
                  </button>
                )}

                <button
                  onClick={() => setShowPasteModal(true)}
                  className="px-5 py-3 rounded-full bg-white hover:bg-[#F5F7FF] border border-[#E2E8F0] text-[#0F172A] text-sm font-semibold transition flex items-center gap-2 shadow-2xs"
                >
                  <ClipboardPaste size={16} className="text-[#635BDB]" />
                  <span>Paste Notes</span>
                </button>

                <button
                  onClick={onOpenUpload}
                  className="px-5 py-3 rounded-full bg-white hover:bg-[#F5F7FF] border border-[#E2E8F0] text-[#0F172A] text-sm font-semibold transition flex items-center gap-2 shadow-2xs"
                >
                  <Upload size={16} className="text-[#635BDB]" />
                  <span>Upload PDF</span>
                </button>

                <button
                  onClick={() => onNavigateSection('library')}
                  className="px-5 py-3 rounded-full bg-white hover:bg-[#F5F7FF] border border-[#E2E8F0] text-[#0F172A] text-sm font-semibold transition flex items-center gap-2 shadow-2xs"
                >
                  <FolderOpen size={16} className="text-[#635BDB]" />
                  <span>Open Library</span>
                </button>
              </div>
            </div>
          )}

          {/* Chat Messages & Visual Tutor Cards */}
          {messages.map((msg) => {
            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="bg-[#F1F5F9] text-[#0F172A] px-4 py-2.5 rounded-2xl rounded-br-xs text-sm max-w-[82%]">
                    {msg.content}
                  </div>
                </div>
              );
            }

            const t = msg.tutorData;
            const fullText = buildCopyText(t, msg.content);
            const activeLayer = revealedLayer[msg.id] || 1;

            return (
              <div key={msg.id} className="space-y-3">
                <div className="bg-white/95 border border-[#E6EAF5] rounded-3xl p-6 shadow-sm space-y-4">
                  {/* Card Header + Audio & Copy icons */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {t && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#635BDB]">
                          Stage {t.stage} · {t.stageTitle}
                        </span>
                      )}
                      <h3 className="text-base font-semibold text-[#0F172A] mt-0.5">
                        {t?.headline || 'Tutor Response'}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleSpeak(msg.id, fullText)}
                        className={`p-1.5 rounded-lg border transition ${
                          speakingMsgId === msg.id
                            ? 'bg-[#EEF2FF] border-[#635BDB] text-[#635BDB]'
                            : 'border-transparent hover:bg-[#F8FAFC] text-[#64748B]'
                        }`}
                        title={speakingMsgId === msg.id ? 'Stop audio' : 'Listen (0 credits)'}
                      >
                        {speakingMsgId === msg.id ? <Square size={14} /> : <Volume2 size={14} />}
                      </button>

                      <button
                        onClick={() => handleCopy(msg.id, fullText)}
                        className="p-1.5 rounded-lg hover:bg-[#F8FAFC] text-[#64748B] transition"
                        title="Copy"
                      >
                        {copiedMsgId === msg.id ? (
                          <Check size={14} className="text-[#16A37A]" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Grok API Key / Credit Warning if fallback used */}
                  {t?.aiError && (
                    <div className="px-4 py-2.5 rounded-2xl bg-[#FFFBEB] border border-[#FEF3C7] text-xs text-[#92400E]">
                      <strong>Grok Notice:</strong> {t.aiError}
                    </div>
                  )}

                  {/* Narrative */}
                  {t?.narrative && (
                    <p className="text-sm text-[#334155] leading-relaxed">{t.narrative}</p>
                  )}

                  {/* Stage 1 Visual Story Beats */}
                  {t?.storyBeats && t.storyBeats.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {t.storyBeats.map((beat) => (
                        <div
                          key={beat.step}
                          className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-2.5"
                        >
                          <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#635BDB] text-xs font-bold flex items-center justify-center shrink-0">
                            {beat.step}
                          </span>
                          <div className="space-y-0.5">
                            <div className="text-xs font-semibold text-[#0F172A]">
                              {beat.title}
                            </div>
                            <p className="text-xs text-[#475569] leading-snug">{beat.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Visual Flow Graph */}
                  {t?.graph && <VisualFlowCard graph={t.graph} />}

                  {/* Stage 2 Progressive Layers (Zoom-In Scaffolding) */}
                  {t?.layers && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { num: 1 as const, label: 'Layer 1: Skeleton' },
                          { num: 2 as const, label: 'Layer 2: Mechanism' },
                          { num: 3 as const, label: 'Layer 3: Nuance & Traps' }
                        ].map((tab) => (
                          <button
                            key={tab.num}
                            onClick={() =>
                              setRevealedLayer(prev => ({ ...prev, [msg.id]: tab.num }))
                            }
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                              activeLayer === tab.num
                                ? 'bg-[#EEF2FF] border-[#635BDB] text-[#635BDB]'
                                : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {activeLayer === 1 && (
                        <ul className="space-y-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
                          {t.layers.skeleton.map((item, idx) => (
                            <li key={idx} className="text-xs text-[#0F172A] flex items-start gap-2">
                              <span className="text-[#635BDB] font-bold">{idx + 1}.</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {activeLayer === 2 && (
                        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2">
                          <p className="text-xs text-[#0F172A] leading-relaxed">
                            {t.layers.mechanism}
                          </p>
                          {t.layers.formula && (
                            <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] font-mono text-xs text-[#312E81]">
                              {t.layers.formula}
                            </div>
                          )}
                        </div>
                      )}

                      {activeLayer === 3 && (
                        <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-xl p-4 text-xs text-[#92400E] leading-relaxed">
                          <strong className="block mb-1">Common Trap / Edge Case:</strong>
                          {t.layers.nuance}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stage 3 Worked Example + Why Question */}
                  {t?.workedExample && (
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-3">
                      <div className="text-xs font-semibold text-[#0F172A]">
                        {t.workedExample.title}
                      </div>
                      <div className="space-y-1.5">
                        {t.workedExample.steps.map((step, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#334155]"
                          >
                            {step}
                          </div>
                        ))}
                      </div>

                      <div className="p-3 rounded-xl bg-[#EEF2FF]/60 border border-[#C7D2FE] space-y-2">
                        <div className="text-xs font-semibold text-[#312E81]">
                          Think & Reply: {t.workedExample.whyQuestion}
                        </div>
                        <button
                          onClick={() =>
                            setRevealedHints(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))
                          }
                          className="text-[11px] font-medium text-[#635BDB] hover:underline flex items-center gap-1"
                        >
                          <Lightbulb size={12} />
                          <span>{revealedHints[msg.id] ? 'Hide Hint' : 'Need a hint?'}</span>
                        </button>
                        {revealedHints[msg.id] && (
                          <p className="text-xs text-[#475569]">{t.workedExample.hint}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stage 4 Feynman Teach-Back Audit */}
                  {t?.teachBackAudit && (
                    <div className="space-y-2.5">
                      <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs space-y-1">
                        <span className="font-semibold text-[#16A37A] block">
                          What you nailed:
                        </span>
                        {t.teachBackAudit.understoodWell.map((u, i) => (
                          <div key={i} className="text-[#14532D]">• {u}</div>
                        ))}
                      </div>

                      {t.teachBackAudit.missingOrUnclear.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FEF3C7] text-xs space-y-1">
                          <span className="font-semibold text-[#D97706] block">
                            Missing link vs. source:
                          </span>
                          {t.teachBackAudit.missingOrUnclear.map((m, i) => (
                            <div key={i} className="text-[#78350F]">• {m}</div>
                          ))}
                          <div className="pt-1 font-medium text-[#312E81]">
                            💡 {t.teachBackAudit.hintToFix}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stage 5 Spaced Recall Pack (1d / 3d / 7d) */}
                  {t?.spacedQuestions && t.spacedQuestions.length > 0 && (
                    <div className="space-y-2.5">
                      {t.spacedQuestions.map((sq, idx) => {
                        const isOpen = !!revealedAnswers[sq.id];
                        return (
                          <div
                            key={sq.id}
                            className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#635BDB]">
                                Review in {sq.daySchedule} · {sq.topic}
                              </span>
                              <button
                                onClick={() =>
                                  setRevealedAnswers(prev => ({
                                    ...prev,
                                    [sq.id]: !prev[sq.id]
                                  }))
                                }
                                className="text-[11px] font-medium text-[#635BDB] hover:underline flex items-center gap-1"
                              >
                                {isOpen ? <EyeOff size={12} /> : <Eye size={12} />}
                                <span>{isOpen ? 'Hide' : 'Reveal Answer'}</span>
                              </button>
                            </div>
                            <p className="text-xs font-medium text-[#0F172A]">
                              {idx + 1}. {sq.question}
                            </p>
                            {isOpen && (
                              <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#334155]">
                                {sq.answer}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pause Check Question (Stages 1 & 2) */}
                  {t?.checkQuestion && (
                    <div className="p-3.5 rounded-xl bg-[#EEF2FF]/50 border border-[#C7D2FE] space-y-1.5">
                      <div className="text-xs font-semibold text-[#312E81]">
                        Quick Check: {t.checkQuestion.question}
                      </div>
                      <button
                        onClick={() =>
                          setRevealedHints(prev => ({ ...prev, [`chk-${msg.id}`]: !prev[`chk-${msg.id}`] }))
                        }
                        className="text-[11px] font-medium text-[#635BDB] hover:underline"
                      >
                        {revealedHints[`chk-${msg.id}`] ? 'Hide hint' : 'Show hint'}
                      </button>
                      {revealedHints[`chk-${msg.id}`] && (
                        <p className="text-xs text-[#475569]">{t.checkQuestion.hint}</p>
                      )}
                    </div>
                  )}

                  {/* Footer Citations & Next Stage Action */}
                  <div className="pt-2 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#64748B]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {t?.citations?.map((cit, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0]"
                        >
                          {cit}
                        </span>
                      ))}
                    </div>

                    {t && t.stage < 5 && (
                      <button
                        onClick={() => handleStageChange((t.stage + 1) as TutorStage)}
                        className="text-xs font-semibold text-[#635BDB] hover:underline flex items-center gap-1"
                      >
                        <span>Continue to Stage {t.stage + 1}</span>
                        <ChevronRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="bg-white border border-[#E6EAF5] rounded-3xl p-5 text-sm text-[#64748B] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 animate-pulse">
                <Sparkles size={16} className="text-[#635BDB]" />
                <span>Building Stage {activeStage} from {activeDoc?.title || 'your context'}...</span>
              </div>
              <button
                onClick={handleStopOrEnd}
                className="px-4 py-1.5 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-semibold hover:bg-[#FEE2E2] transition flex items-center gap-1.5 shrink-0"
              >
                <Square size={11} />
                <span>Stop</span>
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom ChatGPT-style Composer with @ Mention Calling */}
      <div className="shrink-0 px-5 pb-5 pt-2.5 bg-white/85 backdrop-blur-md border-t border-[#E6EAF5]/80">
        <div className="max-w-4xl mx-auto relative">
          {/* @ Mention Library Picker */}
          {showMentionMenu && (
            <div className="absolute bottom-24 left-0 right-0 sm:right-auto sm:w-96 bg-white border border-[#E6EAF5] rounded-3xl shadow-xl p-3 z-30 space-y-2">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-semibold text-[#635BDB] flex items-center gap-1.5">
                  <AtSign size={13} />
                  <span>Call from Library</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowMentionMenu(false)}
                  className="p-1 rounded-full text-[#94A3B8] hover:text-[#0F172A]"
                >
                  <X size={13} />
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1">
                {workspace.documents.length === 0 && workspace.folders.length === 0 && (
                  <div className="p-3 text-xs text-[#64748B] text-center">
                    No files in Library yet. Upload a PDF or paste notes first.
                  </div>
                )}

                {workspace.documents
                  .filter(d => d.title.toLowerCase().includes(mentionQuery.toLowerCase()))
                  .map(doc => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => {
                        onSelectContext(doc.folderId, doc.id);
                        setInput(prev => prev.replace(/@[^\s]*$/, '').trimStart());
                        setShowMentionMenu(false);
                        setMentionQuery('');
                        textareaRef.current?.focus();
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-2xl hover:bg-[#EEF2FF] transition flex items-center gap-2.5"
                    >
                      <FileText size={15} className="text-[#635BDB] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[#0F172A] truncate">
                          {doc.title}
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          {doc.pageCount} page{doc.pageCount > 1 ? 's' : ''} · {doc.fileSize}
                        </div>
                      </div>
                    </button>
                  ))}

                {workspace.folders
                  .filter(f => f.name.toLowerCase().includes(mentionQuery.toLowerCase()))
                  .map(folder => (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => {
                        onSelectContext(folder.id, null);
                        setInput(prev => prev.replace(/@[^\s]*$/, '').trimStart());
                        setShowMentionMenu(false);
                        setMentionQuery('');
                        textareaRef.current?.focus();
                      }}
                      className="w-full text-left px-3 py-2 rounded-2xl hover:bg-[#F5F7FF] transition flex items-center gap-2.5"
                    >
                      <FolderOpen size={15} className="text-[#7C3AED] shrink-0" />
                      <span className="text-sm font-medium text-[#0F172A] truncate">
                        Folder: {folder.name}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Quick Attach Popover */}
          {showAttachMenu && (
            <div className="absolute bottom-24 left-0 bg-white border border-[#E6EAF5] rounded-3xl shadow-xl p-2.5 w-60 z-20 space-y-1">
              <button
                onClick={() => {
                  setShowAttachMenu(false);
                  onOpenUpload();
                }}
                className="w-full text-left px-4 py-2.5 rounded-2xl hover:bg-[#EEF2FF] text-sm font-medium text-[#0F172A] flex items-center gap-2.5 transition"
              >
                <Upload size={16} className="text-[#635BDB]" />
                <span>Upload PDF</span>
              </button>
              <button
                onClick={() => {
                  setShowAttachMenu(false);
                  setShowPasteModal(true);
                }}
                className="w-full text-left px-4 py-2.5 rounded-2xl hover:bg-[#EEF2FF] text-sm font-medium text-[#0F172A] flex items-center gap-2.5 transition"
              >
                <ClipboardPaste size={16} className="text-[#635BDB]" />
                <span>Paste Study Notes</span>
              </button>
            </div>
          )}

          {/* Active @ Context Pill above/inside composer */}
          {activeDoc && (
            <div className="mb-2 flex items-center gap-2 px-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] text-xs font-semibold text-[#4F46E5]">
                <AtSign size={12} />
                <span className="max-w-[260px] truncate">{activeDoc.title}</span>
                <button
                  type="button"
                  onClick={() => onSelectContext(workspace.activeFolderId, null)}
                  className="hover:text-[#0F172A] ml-0.5"
                  title="Clear active file context"
                >
                  <X size={12} />
                </button>
              </span>
            </div>
          )}

          <div className="flex items-end gap-2 bg-[#F8FAFF] border border-[#E2E8F0] focus-within:border-[#635BDB] rounded-full px-3.5 py-2 shadow-sm transition">
            <button
              onClick={() => {
                setShowMentionMenu(false);
                setShowAttachMenu(prev => !prev);
              }}
              className="p-2.5 rounded-full hover:bg-white text-[#475569] transition shrink-0"
              title="Upload PDF or Paste notes"
            >
              <Plus size={20} />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                setMentionQuery('');
                setShowMentionMenu(prev => !prev);
              }}
              className={`p-2.5 rounded-full transition shrink-0 ${
                showMentionMenu ? 'bg-[#EEF2FF] text-[#635BDB]' : 'hover:bg-white text-[#475569]'
              }`}
              title="Type @ or click to call PDF/folder from Library"
            >
              <AtSign size={18} />
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => {
                const val = e.target.value;
                setInput(val);
                const match = val.match(/@([^\s]*)$/);
                if (match) {
                  setMentionQuery(match[1] || '');
                  setShowMentionMenu(true);
                  setShowAttachMenu(false);
                } else {
                  setShowMentionMenu(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  setShowMentionMenu(false);
                  if (input.trim()) sendToTutor(input, activeStage);
                }
              }}
              placeholder={
                activeStage === 4
                  ? 'Explain it back in your own words, or type @ to switch PDF...'
                  : 'Type @ to call a PDF from Library, or ask anything...'
              }
              className="flex-1 bg-transparent text-base text-[#0F172A] placeholder:text-[#94A3B8] resize-none py-2 px-1 focus:outline-hidden max-h-36"
            />

            <button
              onClick={toggleVoiceInput}
              className={`p-2.5 rounded-full transition shrink-0 ${
                isListening
                  ? 'bg-[#FEF2F2] text-[#E05252]'
                  : 'hover:bg-white text-[#475569]'
              }`}
              title="Voice input (0 credits)"
            >
              {isListening ? <MicOff size={19} /> : <Mic size={19} />}
            </button>

            <button
              onClick={() => {
                setShowMentionMenu(false);
                sendToTutor(input || `Continue Stage ${activeStage}`, activeStage);
              }}
              disabled={isLoading}
              className="p-2.5 rounded-full bg-gradient-to-r from-[#635BDB] to-[#7C6FF6] hover:from-[#544BC9] hover:to-[#6B5CE8] disabled:opacity-40 text-white transition shrink-0 shadow-xs"
              title="Send"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Paste Notes Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handlePasteSubmit}
            className="animate-fade-up bg-white border border-[#E6EAF5] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0F172A]">
                Paste Study Notes into Library ({activeFolder?.name})
              </h3>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="text-xs text-[#64748B] hover:text-[#0F172A]"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              value={pasteTitle}
              onChange={(e) => setPasteTitle(e.target.value)}
              placeholder="Topic title (e.g. Cellular Respiration)"
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#635BDB] focus:outline-hidden"
            />

            <textarea
              rows={6}
              required
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste paragraphs, lecture notes, or article text here..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#635BDB] focus:outline-hidden"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-xs font-medium text-[#64748B]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPasting || !pasteText.trim()}
                className="px-4 py-2 rounded-xl bg-[#635BDB] hover:bg-[#5249C9] text-white text-xs font-semibold disabled:opacity-50"
              >
                {isPasting ? 'Saving...' : 'Save & Start Stage 1'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
