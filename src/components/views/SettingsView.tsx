'use client';

import React from 'react';
import { WorkspaceState } from '../../types';
import { Menu, Trash2, Sparkles, Volume2, Zap, Database, LogOut } from 'lucide-react';

interface SettingsViewProps {
  workspace: WorkspaceState;
  grokConfigured: boolean;
  firebaseConfigured: boolean;
  user: { displayName?: string | null; email?: string | null } | null;
  onOpenSidebar: () => void;
  onUpdateSettings: (partial: { creditSaverMode?: boolean; audioSpeed?: number }) => Promise<void>;
  onClearAllData: () => Promise<void>;
  onSignOut: () => void;
}

export default function SettingsView({
  workspace,
  grokConfigured,
  firebaseConfigured,
  user,
  onOpenSidebar,
  onUpdateSettings,
  onClearAllData,
  onSignOut
}: SettingsViewProps) {
  const creditSaver = workspace.creditSaverMode ?? true;
  const audioSpeed = workspace.audioSpeed ?? 1.0;

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F172A] flex flex-col">
      <header className="h-14 px-4 border-b border-[#F1F5F9] flex items-center gap-2.5">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl hover:bg-[#F8FAFC] text-[#475569] transition"
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-base font-semibold text-[#0F172A]">Settings</h1>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Google Account */}
        {user && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#0F172A] truncate">
                {user.displayName || 'Google Account'}
              </div>
              <div className="text-xs text-[#64748B] truncate">{user.email}</div>
            </div>
            <button
              onClick={onSignOut}
              className="px-3.5 py-1.5 rounded-full border border-[#E2E8F0] hover:border-[#E05252] text-xs font-medium text-[#475569] hover:text-[#E05252] flex items-center gap-1.5 shrink-0"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Firebase Cloud Backend */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database size={18} className="text-[#635BDB]" />
            <div>
              <div className="text-sm font-semibold text-[#0F172A]">Firebase Auth & Firestore</div>
              <div className="text-xs text-[#64748B]">Cloud library & chat persistence</div>
            </div>
          </div>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              firebaseConfigured
                ? 'bg-[#F0FDF4] text-[#16A37A]'
                : 'bg-[#FFFBEB] text-[#D97706]'
            }`}
          >
            {firebaseConfigured ? 'Connected' : 'Add Keys'}
          </span>
        </div>

        {/* Grok AI Status */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles size={18} className="text-[#635BDB]" />
            <div>
              <div className="text-sm font-semibold text-[#0F172A]">Grok AI Engine</div>
              <div className="text-xs text-[#64748B]">Uses GROK_API_KEY</div>
            </div>
          </div>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              grokConfigured
                ? 'bg-[#F0FDF4] text-[#16A37A]'
                : 'bg-[#FFFBEB] text-[#D97706]'
            }`}
          >
            {grokConfigured ? 'Key Detected' : 'Not Set'}
          </span>
        </div>

        {/* Low-Credit Mode */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Zap size={18} className="text-[#635BDB]" />
            <div>
              <div className="text-sm font-semibold text-[#0F172A]">Minimal Credit Mode</div>
              <div className="text-xs text-[#64748B]">
                Compact excerpts + capped tokens + free browser audio
              </div>
            </div>
          </div>
          <button
            onClick={() => onUpdateSettings({ creditSaverMode: !creditSaver })}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
              creditSaver ? 'bg-[#635BDB] text-white' : 'bg-[#F1F5F9] text-[#475569]'
            }`}
          >
            {creditSaver ? 'On' : 'Off'}
          </button>
        </div>

        {/* Audio Speed */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Volume2 size={18} className="text-[#635BDB]" />
            <div>
              <div className="text-sm font-semibold text-[#0F172A]">Audio Speed</div>
              <div className="text-xs text-[#64748B]">Browser voice playback (0 credits)</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[0.85, 1.0, 1.25].map(rate => (
              <button
                key={rate}
                onClick={() => onUpdateSettings({ audioSpeed: rate })}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                  audioSpeed === rate
                    ? 'bg-[#EEF2FF] border-[#635BDB] text-[#635BDB]'
                    : 'border-[#E2E8F0] text-[#64748B]'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Clear All Library Data */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[#0F172A]">Clear My Data</div>
            <div className="text-xs text-[#64748B]">Delete all uploaded files and chats</div>
          </div>
          <button
            onClick={onClearAllData}
            className="px-3.5 py-1.5 rounded-full border border-[#E2E8F0] hover:border-[#E05252] text-xs font-medium text-[#E05252] flex items-center gap-1.5"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        </div>
      </main>
    </div>
  );
}
