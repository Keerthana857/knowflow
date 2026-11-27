'use client';

import React, { useState } from 'react';
import { WorkspaceState, DocumentSource } from '../../types';
import { ActiveSection } from '../Sidebar';
import VisualFlowCard from '../VisualFlowCard';
import {
  Folder,
  FolderPlus,
  FileText,
  Upload,
  ClipboardPaste,
  MessageSquare,
  CheckSquare,
  Trash2,
  Scale,
  Menu,
  GitBranch,
  Volume2,
  Copy,
  Check
} from 'lucide-react';

interface LibraryViewProps {
  workspace: WorkspaceState;
  onOpenSidebar: () => void;
  onCreateFolder: (name: string) => Promise<void>;
  onSelectContext: (folderId: string | null, documentId: string | null) => void;
  onDeleteDocument: (documentId: string) => Promise<void>;
  onOpenUpload: () => void;
  onPasteNotes: (title: string, text: string, folderId: string) => Promise<void>;
  onNavigateSection: (section: ActiveSection) => void;
}

export default function LibraryView({
  workspace,
  onOpenSidebar,
  onCreateFolder,
  onSelectContext,
  onDeleteDocument,
  onOpenUpload,
  onPasteNotes,
  onNavigateSection
}: LibraryViewProps) {
  const { folders, documents, concepts, claims } = workspace;

  const [selectedFolderId, setSelectedFolderId] = useState<string>(
    workspace.activeFolderId || folders[0]?.id || ''
  );
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);

  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const folderDocs = documents.filter(d => d.folderId === selectedFolderId);

  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await onCreateFolder(newFolderName.trim());
    setNewFolderName('');
    setShowNewFolder(false);
  };

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteText.trim()) return;
    setIsSaving(true);
    try {
      await onPasteNotes(
        pasteTitle.trim() || 'Pasted Study Notes',
        pasteText.trim(),
        selectedFolderId || folders[0]?.id
      );
      setPasteTitle('');
      setPasteText('');
      setShowPasteModal(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyDoc = async (doc: DocumentSource) => {
    try {
      await navigator.clipboard.writeText(`${doc.title}\n\n${doc.abstract}`);
      setCopiedId(doc.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  };

  const handleSpeakDoc = (doc: DocumentSource) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(`${doc.title}. ${doc.abstract}`);
    u.rate = workspace.audioSpeed || 1.0;
    window.speechSynthesis.speak(u);
  };

  const buildDocVisualGraph = (doc: DocumentSource) => {
    const docConcepts = concepts.filter(c => c.sourceDocumentId === doc.id);
    if (docConcepts.length >= 2) {
      return {
        title: `Concept Flow: ${doc.title.slice(0, 32)}`,
        nodes: docConcepts.slice(0, 4).map(c => ({
          id: c.id,
          label: c.name,
          sublabel: c.sourceSection
        })),
        edges: docConcepts.slice(0, 3).map((c, idx) => ({
          from: c.id,
          to: docConcepts[idx + 1].id,
          label: 'leads to'
        }))
      };
    }

    const excerptNodes = (doc.excerpts || []).slice(0, 3);
    if (excerptNodes.length >= 2) {
      return {
        title: `Visual Map: ${doc.title.slice(0, 32)}`,
        nodes: excerptNodes.map((ex, i) => ({
          id: ex.id || `n-${i}`,
          label: ex.heading,
          sublabel: `Page ${ex.page}`
        })),
        edges: excerptNodes.slice(0, -1).map((ex, i) => ({
          from: ex.id || `n-${i}`,
          to: excerptNodes[i + 1].id || `n-${i + 1}`,
          label: 'next'
        }))
      };
    }

    return {
      title: `Visual Map: ${doc.title.slice(0, 32)}`,
      nodes: [
        { id: 'a', label: doc.title.slice(0, 26), sublabel: `${doc.pageCount}p` },
        { id: 'b', label: 'Key Takeaway', sublabel: doc.keyStance.slice(0, 28) }
      ],
      edges: [{ from: 'a', to: 'b', label: 'shows' }]
    };
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id]
    );
  };

  const comparedDocs = documents.filter(d => compareIds.includes(d.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F7FF] via-[#FFFFFF] to-[#F3FAFF] text-[#0F172A] flex flex-col">
      {/* Top Bar */}
      <header className="h-16 px-5 border-b border-[#E6EAF5]/80 bg-white/80 backdrop-blur-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="p-2.5 rounded-full hover:bg-[#EEF2FF] text-[#475569] transition"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <span className="text-lg font-bold bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent tracking-tight">
            KNOWFLOW
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowPasteModal(true)}
            className="px-4 py-2 rounded-full border border-[#E2E8F0] bg-white hover:bg-[#F8FAFF] text-sm font-medium text-[#0F172A] flex items-center gap-2 transition shadow-2xs"
          >
            <ClipboardPaste size={15} className="text-[#635BDB]" />
            <span>Paste Text</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-[#635BDB] to-[#7C6FF6] hover:from-[#544BC9] hover:to-[#6B5CE8] text-white text-sm font-semibold flex items-center gap-2 transition shadow-sm"
          >
            <Upload size={15} />
            <span>Upload PDF</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-5 py-8 sm:py-10 space-y-7">
        {/* Fade-In Hero Title */}
        <div className="animate-fade-up space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
            Your Study Library
          </h1>
          <p className="text-sm sm:text-base text-[#64748B]">
            Organize PDFs and notes into folders, then launch Ask AI or Quiz in one click.
          </p>
        </div>

        {/* Folder Strip */}
        <div className="animate-fade-up-delay space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#475569]">Folders</span>
            <button
              onClick={() => setShowNewFolder(prev => !prev)}
              className="text-sm font-semibold text-[#635BDB] hover:underline flex items-center gap-1.5"
            >
              <FolderPlus size={16} />
              <span>New Folder</span>
            </button>
          </div>

          {showNewFolder && (
            <form onSubmit={handleCreateFolderSubmit} className="flex items-center gap-2.5">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name (e.g. Biology Ch.4)"
                className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-[#E2E8F0] focus:border-[#635BDB] focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#0F172A] text-white text-sm font-semibold"
              >
                Create
              </button>
            </form>
          )}

          <div className="flex flex-wrap gap-2.5">
            {folders.map(folder => {
              const count = documents.filter(d => d.folderId === folder.id).length;
              const isSelected = selectedFolderId === folder.id;
              return (
                <button
                  key={folder.id}
                  onClick={() => {
                    setSelectedFolderId(folder.id);
                    setShowCompare(false);
                    setCompareIds([]);
                  }}
                  className={`px-4 py-2.5 rounded-2xl border text-sm font-medium flex items-center gap-2.5 transition ${
                    isSelected
                      ? 'bg-[#EEF2FF] border-[#635BDB] text-[#312E81] shadow-2xs'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-white'
                  }`}
                >
                  <Folder size={16} className="text-[#635BDB]" />
                  <span>{folder.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/80 text-[#64748B] font-semibold">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Compare Action (only when 2+ items in folder) */}
        {folderDocs.length >= 2 && (
          <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-5 py-3.5 text-sm">
            <span className="text-[#475569]">
              Select 2 files to compare side by side ({compareIds.length}/2 selected)
            </span>
            {compareIds.length === 2 && (
              <button
                onClick={() => setShowCompare(prev => !prev)}
                className="px-4 py-2 rounded-full bg-[#635BDB] text-white text-sm font-semibold flex items-center gap-2"
              >
                <Scale size={14} />
                <span>{showCompare ? 'Hide Comparison' : 'Compare Selected'}</span>
              </button>
            )}
          </div>
        )}

        {/* Side-by-side Comparison View */}
        {showCompare && comparedDocs.length === 2 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="text-base font-semibold text-[#0F172A]">
              Comparison: {comparedDocs[0].title} vs. {comparedDocs[1].title}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {comparedDocs.map(d => {
                const docClaims = claims.filter(c => c.sourcePaperId === d.id);
                return (
                  <div key={d.id} className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                    <div className="font-semibold text-[#0F172A]">{d.title}</div>
                    <p className="text-[#475569] leading-relaxed text-xs sm:text-sm">{d.keyStance}</p>
                    {docClaims[0] && (
                      <div className="text-xs text-[#635BDB] pt-1">
                        Evidence ({docClaims[0].citation}): {docClaims[0].claim}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Files inside Folder */}
        {folderDocs.length === 0 ? (
          <div className="animate-fade-up-slow py-16 px-6 text-center bg-[#F8FAFC] border-2 border-dashed border-[#CBD5E1] rounded-3xl space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] text-[#635BDB] flex items-center justify-center mx-auto">
              <Upload size={26} />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="text-lg font-semibold text-[#0F172A]">
                Drop your first PDF or study notes here
              </h2>
              <p className="text-sm text-[#64748B]">
                KNOWFLOW turns your material into visual graphs, causal stories, and spaced quizzes.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-1">
              <button
                onClick={onOpenUpload}
                className="px-6 py-3 rounded-full bg-[#635BDB] hover:bg-[#5249C9] text-white text-sm font-semibold shadow-xs transition flex items-center gap-2"
              >
                <Upload size={16} />
                <span>Upload PDF</span>
              </button>
              <button
                onClick={() => setShowPasteModal(true)}
                className="px-6 py-3 rounded-full bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-sm font-semibold text-[#0F172A] transition flex items-center gap-2"
              >
                <ClipboardPaste size={16} className="text-[#635BDB]" />
                <span>Paste Notes</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-up-slow space-y-4">
            {folderDocs.map((doc) => {
              const isPreview = previewDocId === doc.id;
              const isChecked = compareIds.includes(doc.id);

              return (
                <div
                  key={doc.id}
                  className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      {folderDocs.length >= 2 && (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCompare(doc.id)}
                          className="mt-1.5 w-4 h-4 rounded border-[#CBD5E1] text-[#635BDB] cursor-pointer"
                          title="Select to compare"
                        />
                      )}
                      <FileText size={20} className="text-[#635BDB] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-[#0F172A] truncate">
                          {doc.title}
                        </h3>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          {doc.sourceType === 'pasted' ? 'Pasted Notes' : 'PDF'} · {doc.pageCount} page{doc.pageCount > 1 ? 's' : ''} · {doc.fileSize}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          onSelectContext(doc.folderId, doc.id);
                          onNavigateSection('ask-ai');
                        }}
                        className="px-4 py-2 rounded-full bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#635BDB] text-sm font-semibold flex items-center gap-1.5 transition"
                      >
                        <MessageSquare size={14} />
                        <span>Ask AI</span>
                      </button>

                      <button
                        onClick={() => {
                          onSelectContext(doc.folderId, doc.id);
                          onNavigateSection('quiz');
                        }}
                        className="px-4 py-2 rounded-full bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] text-sm font-semibold flex items-center gap-1.5 transition"
                      >
                        <CheckSquare size={14} className="text-[#16A37A]" />
                        <span>Quiz</span>
                      </button>

                      <button
                        onClick={() => setPreviewDocId(isPreview ? null : doc.id)}
                        className="px-3.5 py-2 rounded-full bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#475569] text-sm font-medium flex items-center gap-1.5 transition"
                        title="Show visual concept map"
                      >
                        <GitBranch size={14} />
                        <span>Graph</span>
                      </button>

                      <button
                        onClick={() => handleSpeakDoc(doc)}
                        className="p-2 rounded-full hover:bg-[#F8FAFC] text-[#64748B]"
                        title="Listen (0 credits)"
                      >
                        <Volume2 size={16} />
                      </button>

                      <button
                        onClick={() => handleCopyDoc(doc)}
                        className="p-2 rounded-full hover:bg-[#F8FAFC] text-[#64748B]"
                        title="Copy overview"
                      >
                        {copiedId === doc.id ? (
                          <Check size={16} className="text-[#16A37A]" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>

                      <button
                        onClick={() => onDeleteDocument(doc.id)}
                        className="p-2 rounded-full hover:bg-[#FEF2F2] text-[#94A3B8] hover:text-[#E05252]"
                        title="Remove from library"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {isPreview && (
                    <div className="pt-2 space-y-3">
                      <p className="text-sm text-[#475569] leading-relaxed">{doc.abstract}</p>
                      <VisualFlowCard graph={buildDocVisualGraph(doc)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Paste Notes Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handlePasteSubmit}
            className="bg-white border border-[#E2E8F0] rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#0F172A]">
                Paste Study Material into Folder
              </h3>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="text-sm text-[#64748B]"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              value={pasteTitle}
              onChange={(e) => setPasteTitle(e.target.value)}
              placeholder="Title (e.g. Thermodynamics Notes)"
              className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#E2E8F0] focus:border-[#635BDB] focus:outline-hidden"
            />

            <textarea
              rows={6}
              required
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your text, article, or notes here..."
              className="w-full text-sm px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#635BDB] focus:outline-hidden"
            />

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2.5 rounded-full border border-[#E2E8F0] text-sm font-medium text-[#64748B]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !pasteText.trim()}
                className="px-5 py-2.5 rounded-full bg-[#635BDB] text-white text-sm font-semibold disabled:opacity-50"
              >
                {isSaving ? 'Extracting...' : 'Save to Folder'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
