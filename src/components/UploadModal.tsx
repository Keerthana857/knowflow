'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { DocumentSource, Concept, EvidenceClaim } from '../types';

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

export default function UploadModal({ isOpen, onClose, onUploadSuccess, activeFolderId }: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const validPdfs = newFiles.filter(f =>
      f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf'
    );

    if (validPdfs.length < newFiles.length) {
      setErrorMessage('Some non-PDF files were omitted. Only PDF files are supported.');
    }

    setFiles(prev => [...prev, ...validPdfs]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      if (activeFolderId) {
        formData.append('folderId', activeFolderId);
      }

      const res = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to ingest documents');
      }

      const data = await res.json();
      if (data.documents && data.documents.length > 0) {
        await onUploadSuccess({
          documents: data.documents,
          concepts: data.concepts || [],
          claims: data.claims || []
        });
        setFiles([]);
        onClose();
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMessage(err.message || 'Ingestion encountered an error.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E8ECF2] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8ECF2]">
          <div>
            <h3 className="text-base font-bold text-[#172033]">
              Multi-PDF Document Ingestion
            </h3>
            <p className="text-xs text-[#64748B]">
              Upload multiple research papers or textbook PDFs to extract concepts & claims.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-[#64748B] hover:text-[#172033] p-1 rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dropzone */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? 'border-[#635BDB] bg-[#EEEDFC]/40'
              : 'border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#635BDB] hover:bg-[#EEEDFC]/20'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#EEEDFC] text-[#635BDB] flex items-center justify-center">
            <UploadCloud size={20} />
          </div>
          <div>
            <span className="text-xs font-bold text-[#172033] block">
              Click to select or drag and drop PDFs
            </span>
            <span className="text-[11px] text-[#64748B]">
              Supports 100+ page papers • Up to 25 MB per file
            </span>
          </div>
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
              Selected Files ({files.length})
            </span>
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E8ECF2] text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={15} className="text-[#635BDB] shrink-0" />
                  <span className="text-[#172033] truncate font-medium">{file.name}</span>
                  <span className="text-[#64748B] text-[10px] shrink-0 font-mono">
                    ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  disabled={isUploading}
                  className="text-[#64748B] hover:text-[#E05252] p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl text-xs text-[#E05252] flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8ECF2]">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E8ECF2] text-[#64748B] text-xs font-semibold rounded-xl transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={files.length === 0 || isUploading}
            className="px-5 py-2.5 bg-[#635BDB] hover:bg-[#5249C9] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition"
          >
            {isUploading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Extracting Concepts with AI...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>Ingest & Internalize ({files.length})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
