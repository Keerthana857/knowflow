'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { DocumentSource, Concept, EvidenceClaim } from '../types';
import { parsePdfClientSide } from '../lib/clientPdf';

export interface IngestResultPayload {
  documents: DocumentSource[];
  concepts: Concept[];
  claims: EvidenceClaim[];
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (result: IngestResultPayload) => void | Promise<void>;
  activeFolderId?: string | null;
}

export default function UploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  activeFolderId
}: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    setErrorMessage('');
    const validPdfs = newFiles.filter(
      f => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf'
    );

    if (validPdfs.length < newFiles.length) {
      setErrorMessage('Some non-PDF files were skipped. Only PDF files are supported.');
    }

    setFiles(prev => [...prev, ...validPdfs]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    cancelledRef.current = true;
    setIsSaving(false);
    setProgressText('');
    onClose();
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;

    cancelledRef.current = false;
    setIsSaving(true);
    setErrorMessage('');
    setProgressText('Saving to your Library...');

    try {
      const targetFolder = activeFolderId || 'folder-default';
      const savedDocs: DocumentSource[] = [];

      for (let i = 0; i < files.length; i++) {
        if (cancelledRef.current) return;
        const f = files[i];
        setProgressText(`Saving ${f.name}...`);
        const doc = await parsePdfClientSide(f, targetFolder, (_pct, label) => {
          if (!cancelledRef.current) setProgressText(`${f.name} · ${label}`);
        });
        if (cancelledRef.current) return;
        savedDocs.push(doc);
      }

      if (cancelledRef.current) return;
      await onUploadSuccess({
        documents: savedDocs,
        concepts: [],
        claims: []
      });

      setFiles([]);
      setProgressText('');
      onClose();
    } catch (err: any) {
      if (!cancelledRef.current) {
        console.error('Save failed:', err);
        setErrorMessage(err?.message || 'Could not save PDF to Library.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="animate-fade-up bg-white border border-[#E6EAF5] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">Save PDF to Library</h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Saves locally & to your Library folder—call it anytime in chat with <span className="font-semibold text-[#635BDB]">@</span>.
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F5F7FF] transition"
          >
            <X size={18} />
          </button>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? 'border-[#635BDB] bg-[#EEF2FF]/70'
              : 'border-[#CBD5E1] hover:border-[#635BDB] bg-gradient-to-b from-[#F8FAFF] to-[#FFFFFF]'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            multiple
            accept=".pdf,application/pdf"
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#635BDB] flex items-center justify-center">
            <UploadCloud size={24} />
          </div>

          <div>
            <p className="text-sm font-semibold text-[#0F172A]">
              Click to choose or drag PDFs here
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              Works with large lecture decks & textbooks · 0 AI credits used on save
            </p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[#64748B] block">
              Selected ({files.length})
            </span>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2.5 rounded-2xl bg-[#F8FAFF] border border-[#E6EAF5] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText size={16} className="text-[#635BDB] shrink-0" />
                    <span className="font-semibold text-[#0F172A] truncate">{file.name}</span>
                    <span className="text-[#64748B] shrink-0">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="p-1 rounded-full text-[#94A3B8] hover:text-[#E05252]"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FEE2E2] text-xs text-[#E05252] flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            onClick={handleCancel}
            className="px-5 py-2.5 rounded-full border border-[#E2E8F0] hover:bg-[#F8FAFC] text-sm font-medium text-[#64748B] transition"
          >
            {isSaving ? 'Stop & Cancel' : 'Cancel'}
          </button>

          <button
            onClick={handleSubmit}
            disabled={files.length === 0 || isSaving}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#635BDB] to-[#7C6FF6] hover:from-[#544BC9] hover:to-[#6B5CE8] disabled:opacity-45 text-white text-sm font-semibold shadow-sm transition flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>{progressText || 'Saving...'}</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                <span>Save to Library</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
