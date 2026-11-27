'use client';

import React, { useRef } from 'react';
import { LibraryFolder } from '../types';
import { StoredChatSession } from '../lib/firestoreStore';
import {
  Brain,
  MessageSquare,
  FolderOpen,
  CheckSquare,
  Settings,
  Plus,
  X,
  Folder,
  LogOut,
  History
} from 'lucide-react';

export type ActiveSection = 'ask-ai' | 'library' | 'quiz' | 'settings';

interface SidebarProps {
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onNewChat: () => void;
  folders: LibraryFolder[];
  activeFolderId: string | null;
  onSelectFolder: (folderId: string) => void;
  chats: StoredChatSession[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  user: {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null;
  onSignOut: () => void;
}

export default function Sidebar({
  activeSection,
  onSelectSection,
  isOpen,
  onClose,
  onOpen,
  onNewChat,
  folders,
  activeFolderId,
  onSelectFolder,
  chats,
  activeChatId,
  onSelectChat,
  user,
  onSignOut
}: SidebarProps) {
  const dragStartX = useRef<number | null>(null);

  const handleEdgePointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
  };
  const handleEdgePointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current !== null && e.clientX - dragStartX.current > 24) {
      dragStartX.current = null;
      onOpen();
    }
  };

  const handleSidebarPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
  };
  const handleSidebarPointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current !== null && dragStartX.current - e.clientX > 45) {
      dragStartX.current = null;
      onClose();
    }
  };

  const navItems = [
    { id: 'ask-ai' as ActiveSection, label: 'Ask AI', icon: MessageSquare },
    { id: 'library' as ActiveSection, label: 'Library', icon: FolderOpen },
    { id: 'quiz' as ActiveSection, label: 'Quiz', icon: CheckSquare },
    { id: 'settings' as ActiveSection, label: 'Settings', icon: Settings }
  ];

  return (
    <>
      {!isOpen && (
        <div
          onPointerDown={handleEdgePointerDown}
          onPointerMove={handleEdgePointerMove}
          onPointerUp={() => (dragStartX.current = null)}
          onClick={onOpen}
          className="fixed top-14 bottom-0 left-0 w-3 z-30 cursor-ew-resize group flex items-center"
          title="Drag right or click to open menu"
        >
          <div className="w-1 h-12 rounded-r-full bg-[#CBD5E1]/70 group-hover:bg-[#635BDB] transition-all" />
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      <aside
        onPointerDown={handleSidebarPointerDown}
        onPointerMove={handleSidebarPointerMove}
        onPointerUp={() => (dragStartX.current = null)}
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#F8FAFC] border-r border-[#E2E8F0] flex flex-col transition-transform duration-200 ease-out shadow-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 px-4 border-b border-[#E2E8F0] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#635BDB] text-white flex items-center justify-center">
              <Brain size={16} />
            </div>
            <span className="text-sm font-bold text-[#0F172A] tracking-tight">
              KNOWFLOW
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition"
            title="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onSelectSection('ask-ai');
              onClose();
            }}
            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] flex items-center gap-2 shadow-2xs transition"
          >
            <Plus size={14} className="text-[#635BDB]" />
            <span>New Learning Chat</span>
          </button>
        </div>

        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id);
                  onClose();
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 transition ${
                  isActive
                    ? 'bg-[#EEF2FF] text-[#635BDB] font-semibold'
                    : 'text-[#475569] hover:bg-white hover:text-[#0F172A]'
                }`}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-4 px-3 flex-1 overflow-y-auto space-y-4">
          {/* Library Folders */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              Library Folders
            </div>
            {folders.map(folder => {
              const isSelected = activeFolderId === folder.id;
              return (
                <button
                  key={folder.id}
                  onClick={() => {
                    onSelectFolder(folder.id);
                    onSelectSection('library');
                    onClose();
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2 transition ${
                    isSelected
                      ? 'bg-white border border-[#E2E8F0] text-[#0F172A] font-medium'
                      : 'text-[#64748B] hover:bg-white/70 hover:text-[#0F172A]'
                  }`}
                >
                  <Folder size={13} className="text-[#635BDB] shrink-0" />
                  <span className="truncate">{folder.name}</span>
                </button>
              );
            })}
          </div>

          {/* Saved Chat Sessions from Firestore */}
          {chats.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                Recent Chats
              </div>
              {chats.slice(0, 8).map(chat => (
                <button
                  key={chat.id}
                  onClick={() => {
                    onSelectChat(chat.id);
                    onSelectSection('ask-ai');
                    onClose();
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2 transition ${
                    activeChatId === chat.id
                      ? 'bg-white border border-[#E2E8F0] text-[#0F172A] font-medium'
                      : 'text-[#64748B] hover:bg-white/70 hover:text-[#0F172A]'
                  }`}
                >
                  <History size={12} className="text-[#94A3B8] shrink-0" />
                  <span className="truncate">{chat.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Google User Footer */}
        <div className="p-3 border-t border-[#E2E8F0] bg-white">
          {user ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-[#E2E8F0] shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#EEF2FF] text-[#635BDB] text-xs font-bold flex items-center justify-center shrink-0">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-medium text-[#0F172A] truncate">
                    {user.displayName || 'Google User'}
                  </div>
                  <div className="text-[10px] text-[#64748B] truncate">
                    {user.email}
                  </div>
                </div>
              </div>

              <button
                onClick={onSignOut}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#E05252] hover:bg-[#FEF2F2] transition shrink-0"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="text-[11px] text-[#64748B]">Grok + Firebase Backend</div>
          )}
        </div>
      </aside>
    </>
  );
}
