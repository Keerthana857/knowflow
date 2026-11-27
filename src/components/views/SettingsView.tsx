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
    <div className="min-h-screen bg-gradient-to-br from-[#F5F7FF] via-[#FFFFFF] to-[#F3FAFF] text-[#0F172A] flex flex-col">
      <header className="h-16 px-5 border-b border-[#E6EAF5]/80 bg-white/80 backdrop-blur-md flex items-center gap-3">
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
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-5 py-8 sm:py-10 space-y-5">
        <div className="animate-fade-up space-y-1.5 pb-2">
          <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">Settings</h1>
          <p className="text-sm text-[#64748B]">
            Manage your account, audio voice speed, and credit-saving preferences.
          </p>
        </div>

        <div className="animate-fade-up-delay space-y-4">
          {user && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-base font-semibold text-[#0F172A] truncate">
                  {user.displayName || 'Google Account'}
                </div>
                <div className="text-sm text-[#64748B] truncate">{user.email}</div>
              </div>
              <button
                onClick={onSignOut}
                className="px-4 py-2 rounded-full border border-[#E2E8F0] hover:border-[#E05252] text-sm font-medium text-[#475569] hover:text-[#E05252] flex items-center gap-2 shrink-0 transition"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <Database size={20} className="text-[#635BDB]" />
              <div>
                <div className="text-base font-semibold text-[#0F172A]">Firebase Auth & Firestore</div>
                <div className="text-sm text-[#64748B]">Cloud library & chat persistence</div>
              </div>
            </div>
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                firebaseConfigured ? 'bg-[#F0FDF4] text-[#16A37A]' : 'bg-[#FFFBEB] text-[#D97706]'
              }`}
            >
              {firebaseConfigured ? 'Connected' : 'Add Keys'}
            </span>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <Sparkles size={20} className="text-[#635BDB]" />
              <div>
                <div className="text-base font-semibold text-[#0F172A]">Grok AI Engine</div>
                <div className="text-sm text-[#64748B]">Uses GROK_API_KEY</div>
              </div>
            </div>
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                grokConfigured ? 'bg-[#F0FDF4] text-[#16A37A]' : 'bg-[#FFFBEB] text-[#D97706]'
              }`}
            >
              {grokConfigured ? 'Key Detected' : 'Not Set'}
            </span>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <Zap size={20} className="text-[#635BDB]" />
              <div>
                <div className="text-base font-semibold text-[#0F172A]">Minimal Credit Mode</div>
                <div className="text-sm text-[#64748B]">
                  Compact excerpts + capped tokens + free browser audio
                </div>
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ creditSaverMode: !creditSaver })}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                creditSaver ? 'bg-[#635BDB] text-white' : 'bg-[#F1F5F9] text-[#475569]'
              }`}
            >
              {creditSaver ? 'On' : 'Off'}
            </button>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <Volume2 size={20} className="text-[#635BDB]" />
              <div>
                <div className="text-base font-semibold text-[#0F172A]">Audio Speed</div>
                <div className="text-sm text-[#64748B]">Browser voice playback (0 credits)</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {[0.85, 1.0, 1.25].map(rate => (
                <button
                  key={rate}
                  onClick={() => onUpdateSettings({ audioSpeed: rate })}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${
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

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex items-center justify-between gap-4">
            <div>
              <div className="text-base font-semibold text-[#0F172A]">Clear My Data</div>
              <div className="text-sm text-[#64748B]">Delete all uploaded files and chats</div>
            </div>
            <button
              onClick={onClearAllData}
              className="px-4 py-2 rounded-full border border-[#E2E8F0] hover:border-[#E05252] text-sm font-medium text-[#E05252] flex items-center gap-2 transition"
            >
              <Trash2 size={15} />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
