'use client';

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import Sidebar, { ActiveSection } from '../components/Sidebar';
import UploadModal, { IngestResultPayload } from '../components/UploadModal';
import AskAIView from '../components/views/AskAIView';
import LibraryView from '../components/views/LibraryView';
import QuizView from '../components/views/QuizView';
import SettingsView from '../components/views/SettingsView';

import {
  getFirebaseAuth,
  isFirebaseConfigured,
  signInWithGoogle,
  signOutUser
} from '../lib/firebaseClient';
import {
  createEmptyWorkspace,
  loadUserWorkspaceFromFirestore,
  saveUserSettingsToFirestore,
  createFolderInFirestore,
  saveDocumentInFirestore,
  updateDocumentConceptsInFirestore,
  deleteDocumentInFirestore,
  saveChatSessionInFirestore,
  clearAllUserDataInFirestore,
  StoredChatSession
} from '../lib/firestoreStore';

import { WorkspaceState, ChatMessage, TutorStage, LibraryFolder } from '../types';
import { CheckCircle2, RefreshCw, Brain, AlertCircle } from 'lucide-react';

export default function KnowflowApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [firebaseConfigured, setFirebaseConfigured] = useState(false);
  const [grokConfigured, setGrokConfigured] = useState(false);

  const [workspace, setWorkspace] = useState<WorkspaceState>(() => createEmptyWorkspace());
  const [chats, setChats] = useState<StoredChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<ActiveSection>('ask-ai');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeStage, setActiveStage] = useState<TutorStage>(1);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Check server Grok / Firebase status + listen to Google Auth state
  useEffect(() => {
    const fbReady = isFirebaseConfigured();
    setFirebaseConfigured(fbReady);

    fetch('/api/workspace')
      .then(r => r.json())
      .then(data => {
        setGrokConfigured(Boolean(data.grokConfigured));
      })
      .catch(() => {});

    if (!fbReady) {
      setAuthChecked(true);
      setIsLoadingData(false);
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setAuthChecked(true);
      setIsLoadingData(false);
      return;
    }

    // Hard safety cap: never allow spinner to hang infinitely (e.g. if Brave Shields blocks WebChannel)
    const safetyTimer = setTimeout(() => {
      setAuthChecked(true);
      setIsLoadingData(false);
    }, 3000);

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      setAuthChecked(true);

      if (fbUser) {
        // Hydrate immediately from local cache if present so UI opens instantaneously
        try {
          const cachedRaw = localStorage.getItem(`knowflow_ws_${fbUser.uid}`);
          if (cachedRaw) {
            const parsed = JSON.parse(cachedRaw);
            if (parsed?.workspace) setWorkspace(parsed.workspace);
            if (Array.isArray(parsed?.chats)) setChats(parsed.chats);
            setIsLoadingData(false);
          }
        } catch {
          // ignore localStorage read errors
        }

        // Sync with Firestore using a 3-second race so blocked networks never freeze the app
        try {
          const timeoutPromise = new Promise<null>(resolve =>
            setTimeout(() => resolve(null), 3000)
          );
          const loaded = await Promise.race([
            loadUserWorkspaceFromFirestore(fbUser.uid, {
              email: fbUser.email,
              displayName: fbUser.displayName
            }),
            timeoutPromise
          ]);

          if (loaded) {
            setWorkspace(loaded.workspace);
            setChats(loaded.chats);
            try {
              const serialized = JSON.stringify(loaded);
              if (serialized.length < 1_800_000) {
                localStorage.setItem(`knowflow_ws_${fbUser.uid}`, serialized);
              }
            } catch {
              // ignore quota errors
            }
          }
        } catch (err: any) {
          console.error('Firestore load warning:', err);
        } finally {
          clearTimeout(safetyTimer);
          setIsLoadingData(false);
        }
      } else {
        clearTimeout(safetyTimer);
        setWorkspace(createEmptyWorkspace());
        setChats([]);
        setMessages([]);
        setActiveChatId(null);
        setIsLoadingData(false);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      unsub();
    };
  }, []);

  // Mirror signed-in user's workspace locally for instant load & resilience
  useEffect(() => {
    if (!user || isLoadingData) return;
    try {
      const serialized = JSON.stringify({ workspace, chats });
      if (serialized.length < 1_800_000) {
        localStorage.setItem(`knowflow_ws_${user.uid}`, serialized);
      }
    } catch {
      // ignore quota errors
    }
  }, [user, workspace, chats, isLoadingData]);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/unauthorized-domain') {
        setAuthError(
          'This domain is not authorized yet. Add this hostname (e.g. localhost or your Vercel domain) in Firebase Console → Authentication → Settings → Authorized domains.'
        );
      } else if (code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup closed. Click below to try again.');
      } else {
        setAuthError(err?.message || 'Google Sign-In failed.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setMessages([]);
    setActiveChatId(null);
    setActiveStage(1);
    setActiveSection('ask-ai');
  };

  const handleSelectContext = async (folderId: string | null, documentId: string | null) => {
    setWorkspace(prev => {
      const nextFolder = folderId;
      const nextDoc = documentId;
      const matchingConcept = nextDoc
        ? prev.concepts.find(c => c.sourceDocumentId === nextDoc)
        : undefined;
      return {
        ...prev,
        activeFolderId: nextFolder,
        activeDocumentId: nextDoc,
        activeConceptId: matchingConcept?.id || null
      };
    });

    if (user) {
      await saveUserSettingsToFirestore(user.uid, {
        activeFolderId: folderId,
        activeDocumentId: documentId
      }).catch(console.error);
    }
  };

  const handleCreateFolder = async (name: string) => {
    const newFolder: LibraryFolder = {
      id: `folder-${Date.now()}`,
      name,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setWorkspace(prev => ({
      ...prev,
      folders: [...prev.folders, newFolder],
      activeFolderId: newFolder.id
    }));

    if (user) {
      await createFolderInFirestore(user.uid, newFolder).catch(console.error);
      await saveUserSettingsToFirestore(user.uid, { activeFolderId: newFolder.id }).catch(console.error);
    }
    showToast(`Created folder "${name}"`);
  };

  const applyIngestResult = async (result: IngestResultPayload) => {
    const latestDoc = result.documents[result.documents.length - 1];
    const latestConcept = result.concepts.find(c => c.sourceDocumentId === latestDoc.id);

    setWorkspace(prev => ({
      ...prev,
      documents: [...prev.documents, ...result.documents],
      concepts: [...prev.concepts, ...result.concepts],
      claims: [...prev.claims, ...result.claims],
      activeFolderId: latestDoc.folderId,
      activeDocumentId: latestDoc.id,
      activeConceptId: latestConcept?.id || prev.activeConceptId
    }));

    if (user) {
      // Sync to Firestore in the background so UI closes and updates instantaneously
      Promise.all(
        result.documents.map(docItem => {
          const docConcepts = result.concepts.filter(c => c.sourceDocumentId === docItem.id);
          const docClaims = result.claims.filter(cl => cl.sourcePaperId === docItem.id);
          return saveDocumentInFirestore(user.uid, {
            ...docItem,
            concepts: docConcepts,
            claims: docClaims
          });
        })
      ).catch(console.error);
    }
  };

  const handlePasteNotes = async (title: string, text: string, folderId: string) => {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    if (cleanText.length < 10) {
      showToast('Please paste a bit more text.');
      return;
    }

    const chunkSize = 1400;
    const count = Math.min(20, Math.max(1, Math.ceil(cleanText.length / chunkSize)));
    const excerpts = Array.from({ length: count }, (_, i) => {
      const snippet = cleanText.slice(i * chunkSize, (i + 1) * chunkSize).trim();
      const heading = snippet.split(/[.!?]/)[0]?.slice(0, 52) || `Part ${i + 1}`;
      return {
        id: `ex-paste-${Date.now()}-${i + 1}`,
        page: i + 1,
        heading,
        text: snippet
      };
    });

    const docSource = {
      id: `doc-paste-${Date.now()}`,
      folderId: folderId || 'folder-default',
      sourceType: 'pasted' as const,
      title: title.slice(0, 200),
      authors: 'Pasted Notes',
      year: new Date().getFullYear(),
      abstract: cleanText.slice(0, 320),
      pageCount: count,
      fileSize: `${Math.max(1, Math.round(cleanText.length / 1024))} KB`,
      uploadDate: new Date().toISOString().split('T')[0],
      keyStance: cleanText.split(/[.!?]/)[0]?.slice(0, 160) || title,
      excerpts
    };

    await applyIngestResult({
      documents: [docSource],
      concepts: [],
      claims: []
    });
    showToast(`Saved "${title}" into Library!`);
  };

  const handleDeleteDocument = async (documentId: string) => {
    setWorkspace(prev => {
      const remainingDocs = prev.documents.filter(d => d.id !== documentId);
      return {
        ...prev,
        documents: remainingDocs,
        concepts: prev.concepts.filter(c => c.sourceDocumentId !== documentId),
        claims: prev.claims.filter(cl => cl.sourcePaperId !== documentId),
        activeDocumentId:
          prev.activeDocumentId === documentId ? null : prev.activeDocumentId
      };
    });

    if (user) {
      await deleteDocumentInFirestore(user.uid, documentId).catch(console.error);
    }
    showToast('Removed from Library.');
  };

  const handleChatSaved = async (updatedMsgs: ChatMessage[], stage: TutorStage) => {
    if (!user) return;
    const activeDoc = workspace.documents.find(d => d.id === workspace.activeDocumentId);
    const chatId = activeChatId || `chat-${Date.now()}`;
    if (!activeChatId) setActiveChatId(chatId);

    const firstUserMsg = updatedMsgs.find(m => m.role === 'user')?.content;
    const title =
      activeDoc?.title ||
      (firstUserMsg ? firstUserMsg.slice(0, 48) : 'Learning Session');

    const session: StoredChatSession = {
      id: chatId,
      title,
      folderId: workspace.activeFolderId,
      documentId: workspace.activeDocumentId,
      activeStage: stage,
      messages: updatedMsgs,
      updatedAt: new Date().toISOString()
    };

    setChats(prev => [session, ...prev.filter(c => c.id !== chatId)]);
    await saveChatSessionInFirestore(user.uid, session).catch(console.error);
  };

  const handleSelectSavedChat = (chatId: string) => {
    const found = chats.find(c => c.id === chatId);
    if (!found) return;
    setActiveChatId(found.id);
    setMessages(found.messages || []);
    setActiveStage(found.activeStage || 1);
    handleSelectContext(found.folderId, found.documentId);
  };

  const handleUpdateMastery = async (conceptId: string, newScore: number) => {
    const targetDocId = workspace.concepts.find(c => c.id === conceptId)?.sourceDocumentId;
    let updatedConceptsForDoc: typeof workspace.concepts = [];

    setWorkspace(prev => {
      const nextConcepts = prev.concepts.map(c =>
        c.id === conceptId
          ? {
              ...c,
              userMastery: newScore,
              status: newScore >= 80 ? ('mastered' as const) : ('in_progress' as const)
            }
          : c
      );
      if (targetDocId) {
        updatedConceptsForDoc = nextConcepts.filter(c => c.sourceDocumentId === targetDocId);
      }
      return { ...prev, concepts: nextConcepts };
    });

    if (user && targetDocId && updatedConceptsForDoc.length > 0) {
      await updateDocumentConceptsInFirestore(user.uid, targetDocId, updatedConceptsForDoc).catch(
        console.error
      );
    }
  };

  const handleUpdateSettings = async (partial: {
    creditSaverMode?: boolean;
    audioSpeed?: number;
  }) => {
    setWorkspace(prev => ({ ...prev, ...partial }));
    if (user) {
      await saveUserSettingsToFirestore(user.uid, partial).catch(console.error);
    }
    showToast('Settings saved.');
  };

  const handleClearAllData = async () => {
    if (user) {
      const empty = await clearAllUserDataInFirestore(user.uid);
      setWorkspace(empty);
    } else {
      setWorkspace(createEmptyWorkspace());
    }
    setChats([]);
    setMessages([]);
    setActiveChatId(null);
    setActiveStage(1);
    showToast('All data cleared.');
  };

  // Loading auth / Firestore
  if (!authChecked || isLoadingData) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-2 text-[#64748B]">
        <RefreshCw size={22} className="animate-spin text-[#635BDB]" />
        <p className="text-xs">Loading KNOWFLOW...</p>
      </div>
    );
  }

  // Google Sign-In Gate when Firebase is configured and user is signed out
  if (firebaseConfigured && !user) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center p-5">
        <div className="animate-fade-up max-w-md w-full bg-white border border-[#E2E8F0] rounded-3xl p-10 shadow-sm text-center space-y-7">
          <div className="w-14 h-14 rounded-2xl bg-[#635BDB] text-white flex items-center justify-center mx-auto shadow-xs">
            <Brain size={28} />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">KNOWFLOW</h1>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Sign in with Google to save your folders, PDFs, and 5-stage learning progress.
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] text-xs text-[#E05252] text-left flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full py-3.5 px-5 rounded-full bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-base font-semibold text-[#0F172A] shadow-2xs transition flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
            <span>{isSigningIn ? 'Signing in...' : 'Continue with Google'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0F172A] font-sans antialiased">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpen={() => setIsSidebarOpen(true)}
        onNewChat={() => {
          setMessages([]);
          setActiveChatId(null);
          setActiveStage(1);
        }}
        folders={workspace.folders || []}
        activeFolderId={workspace.activeFolderId}
        onSelectFolder={(folderId) => handleSelectContext(folderId, null)}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectSavedChat}
        user={user}
        onSignOut={handleSignOut}
      />

      {toastMessage && (
        <div className="fixed bottom-20 right-5 z-50 bg-[#0F172A] text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 size={14} className="text-[#16A37A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {activeSection === 'ask-ai' && (
        <AskAIView
          workspace={workspace}
          messages={messages}
          setMessages={setMessages}
          activeStage={activeStage}
          setActiveStage={setActiveStage}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onSelectContext={handleSelectContext}
          onOpenUpload={() => setIsUploadOpen(true)}
          onPasteNotes={handlePasteNotes}
          onNavigateSection={setActiveSection}
          onChatSaved={handleChatSaved}
        />
      )}

      {activeSection === 'library' && (
        <LibraryView
          workspace={workspace}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onCreateFolder={handleCreateFolder}
          onSelectContext={(fId, dId) => {
            handleSelectContext(fId, dId);
            setMessages([]);
            setActiveChatId(null);
            setActiveStage(1);
          }}
          onDeleteDocument={handleDeleteDocument}
          onOpenUpload={() => setIsUploadOpen(true)}
          onPasteNotes={handlePasteNotes}
          onNavigateSection={setActiveSection}
        />
      )}

      {activeSection === 'quiz' && (
        <QuizView
          workspace={workspace}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onSelectContext={handleSelectContext}
          onUpdateMastery={handleUpdateMastery}
        />
      )}

      {activeSection === 'settings' && (
        <SettingsView
          workspace={workspace}
          grokConfigured={grokConfigured}
          firebaseConfigured={firebaseConfigured}
          user={user}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onUpdateSettings={handleUpdateSettings}
          onClearAllData={handleClearAllData}
          onSignOut={handleSignOut}
        />
      )}

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        activeFolderId={workspace.activeFolderId}
        onUploadSuccess={async (result) => {
          await applyIngestResult(result);
          setMessages([]);
          setActiveChatId(null);
          setActiveStage(1);
          showToast('PDF added to Library! Ready in Ask AI.');
          setActiveSection('ask-ai');
        }}
      />
    </div>
  );
}
