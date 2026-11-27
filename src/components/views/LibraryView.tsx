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
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F172A] flex flex-col">
      {/* Minimal Header */}
      <header className="h-14 px-4 border-b border-[#F1F5F9] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenSidebar}
            className="p-2 rounded-xl hover:bg-[#F8FAFC] text-[#475569] transition"
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>
          <h1 className="text-base font-semibold text-[#0F172A]">Library</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPasteModal(true)}
            className="px-3 py-1.5 rounded-full border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-medium text-[#0F172A] flex items-center gap-1.5 transition"
          >
            <ClipboardPaste size={13} className="text-[#635BDB]" />
            <span>Paste Text</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="px-3.5 py-1.5 rounded-full bg-[#635BDB] hover:bg-[#5249C9] text-white text-xs font-medium flex items-center gap-1.5 transition"
          >
            <Upload size={13} />
            <span>Upload PDF</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Folder Strip */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Folders</span>
            <button
              onClick={() => setShowNewFolder(prev => !prev)}
              className="text-xs font-medium text-[#635BDB] hover:underline flex items-center gap-1"
            >
              <FolderPlus size={13} />
              <span>New Folder</span>
            </button>
          </div>

          {showNewFolder && (
            <form onSubmit={handleCreateFolderSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name (e.g. Biology Ch.4)"
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#635BDB] focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-medium"
              >
                Create
              </button>
            </form>
          )}

          <div className="flex flex-wrap gap-2">
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
                  className={`px-3.5 py-2 rounded-2xl border text-xs font-medium flex items-center gap-2 transition ${
                    isSelected
                      ? 'bg-[#EEF2FF] border-[#635BDB] text-[#312E81]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-white'
                  }`}
                >
                  <Folder size={14} className="text-[#635BDB]" />
                  <span>{folder.name}</span>
                  <span className="text-[10px] text-[#94A3B8]">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Compare Action (only when 2+ items in folder) */}
        {folderDocs.length >= 2 && (
          <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-2.5 text-xs">
            <span className="text-[#475569]">
              Select 2 files to compare side by side ({compareIds.length}/2 selected)
            </span>
            {compareIds.length === 2 && (
              <button
                onClick={() => setShowCompare(prev => !prev)}
                className="px-3 py-1 rounded-full bg-[#635BDB] text-white font-medium flex items-center gap-1.5"
              >
                <Scale size={12} />
                <span>{showCompare ? 'Hide Comparison' : 'Compare Selected'}</span>
              </button>
            )}
          </div>
        )}

        {/* Side-by-side Comparison View (dynamic based on selected docs) */}
        {showCompare && comparedDocs.length === 2 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="text-sm font-semibold text-[#0F172A]">
              Comparison: {comparedDocs[0].title} vs. {comparedDocs[1].title}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {comparedDocs.map(d => {
                const docClaims = claims.filter(c => c.sourcePaperId === d.id);
                return (
                  <div key={d.id} className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                    <div className="font-semibold text-[#0F172A]">{d.title}</div>
                    <p className="text-[#475569] leading-relaxed">{d.keyStance}</p>
                    {docClaims[0] && (
                      <div className="text-[11px] text-[#635BDB] pt-1">
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
          <div className="py-14 text-center bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-2xl space-y-3">
            <p className="text-xs text-[#64748B]">This folder is empty.</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={onOpenUpload}
                className="px-3.5 py-1.5 rounded-full bg-[#635BDB] text-white text-xs font-medium"
              >
                Upload PDF
              </button>
              <button
                onClick={() => setShowPasteModal(true)}
                className="px-3.5 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-xs font-medium text-[#0F172A]"
              >
                Paste Notes
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {folderDocs.map((doc) => {
              const isPreview = previewDocId === doc.id;
              const isChecked = compareIds.includes(doc.id);

              return (
                <div
                  key={doc.id}
                  className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {folderDocs.length >= 2 && (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCompare(doc.id)}
                          className="mt-1 rounded border-[#CBD5E1] text-[#635BDB] cursor-pointer"
                          title="Select to compare"
                        />
                      )}
                      <FileText size={18} className="text-[#635BDB] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[#0F172A] truncate">
                          {doc.title}
                        </h3>
                        <p className="text-[11px] text-[#64748B]">
                          {doc.sourceType === 'pasted' ? 'Pasted Notes' : 'PDF'} · {doc.pageCount} page{doc.pageCount > 1 ? 's' : ''} · {doc.fileSize}
                        </p>
                      </div>
                    </div>

                    {/* Clean Actions: Call in Ask AI, Visual Graph, Quiz, Audio, Copy, Delete */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          onSelectContext(doc.folderId, doc.id);
                          onNavigateSection('ask-ai');
                        }}
                        className="px-3 py-1.5 rounded-full bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#635BDB] text-xs font-medium flex items-center gap-1 transition"
                      >
                        <MessageSquare size={12} />
                        <span>Ask AI</span>
                      </button>

                      <button
                        onClick={() => {
                          onSelectContext(doc.folderId, doc.id);
                          onNavigateSection('quiz');
                        }}
                        className="px-3 py-1.5 rounded-full bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] text-xs font-medium flex items-center gap-1 transition"
                      >
                        <CheckSquare size={12} className="text-[#16A37A]" />
                        <span>Quiz</span>
                      </button>

                      <button
                        onClick={() => setPreviewDocId(isPreview ? null : doc.id)}
                        className="px-2.5 py-1.5 rounded-full bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#475569] text-xs font-medium flex items-center gap-1 transition"
                        title="Show visual concept map"
                      >
                        <GitBranch size={12} />
                        <span>Graph</span>
                      </button>

                      <button
                        onClick={() => handleSpeakDoc(doc)}
                        className="p-1.5 rounded-full hover:bg-[#F8FAFC] text-[#64748B]"
                        title="Listen (0 credits)"
                      >
                        <Volume2 size={14} />
                      </button>

                      <button
                        onClick={() => handleCopyDoc(doc)}
                        className="p-1.5 rounded-full hover:bg-[#F8FAFC] text-[#64748B]"
                        title="Copy overview"
                      >
                        {copiedId === doc.id ? (
                          <Check size={14} className="text-[#16A37A]" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>

                      <button
                        onClick={() => onDeleteDocument(doc.id)}
                        className="p-1.5 rounded-full hover:bg-[#FEF2F2] text-[#94A3B8] hover:text-[#E05252]"
                        title="Remove from library"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Context Visual Graph Preview */}
                  {isPreview && (
                    <div className="pt-2 space-y-2.5">
                      <p className="text-xs text-[#475569] leading-relaxed">{doc.abstract}</p>
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
            className="bg-white border border-[#E2E8F0] rounded-2xl max-w-lg w-full p-5 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0F172A]">
                Paste Study Material into Folder
              </h3>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="text-xs text-[#64748B]"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              value={pasteTitle}
              onChange={(e) => setPasteTitle(e.target.value)}
              placeholder="Title (e.g. Thermodynamics Notes)"
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#635BDB] focus:outline-hidden"
            />

            <textarea
              rows={6}
              required
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your text, article, or notes here..."
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
                disabled={isSaving || !pasteText.trim()}
                className="px-4 py-2 rounded-xl bg-[#635BDB] text-white text-xs font-semibold disabled:opacity-50"
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
