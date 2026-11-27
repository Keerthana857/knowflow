import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { getFirebaseDb } from './firebaseClient';
import {
  WorkspaceState,
  LibraryFolder,
  DocumentSource,
  Concept,
  EvidenceClaim,
  ChatMessage,
  TutorStage
} from '../types';
import { EMPTY_WORKSPACE } from '../data/defaultBenchmark';

export interface StoredChatSession {
  id: string;
  title: string;
  folderId: string | null;
  documentId: string | null;
  activeStage: TutorStage;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface StoredDocumentRecord extends DocumentSource {
  concepts: Concept[];
  claims: EvidenceClaim[];
}

function stripUndefined<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function createEmptyWorkspace(uid?: string): WorkspaceState {
  return {
    ...EMPTY_WORKSPACE,
    id: uid || 'user-workspace',
    folders: [
      {
        id: 'folder-default',
        name: 'My Study Folder',
        createdAt: new Date().toISOString().split('T')[0]
      }
    ]
  };
}

export async function loadUserWorkspaceFromFirestore(
  uid: string,
  userProfile?: { email?: string | null; displayName?: string | null }
): Promise<{ workspace: WorkspaceState; chats: StoredChatSession[] }> {
  const db = getFirebaseDb();
  if (!db) {
    return { workspace: createEmptyWorkspace(uid), chats: [] };
  }

  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  const defaultWs = createEmptyWorkspace(uid);

  const safeEmail =
    userProfile?.email && userProfile.email.includes('@') ? userProfile.email : null;
  const safeName = userProfile?.displayName
    ? userProfile.displayName.slice(0, 120)
    : null;

  if (!userSnap.exists()) {
    await setDoc(
      userRef,
      stripUndefined({
        email: safeEmail,
        displayName: safeName,
        creditSaverMode: true,
        audioSpeed: 1.0,
        activeFolderId: 'folder-default',
        activeDocumentId: null,
        updatedAt: new Date().toISOString()
      })
    );
    await setDoc(
      doc(db, 'users', uid, 'folders', 'folder-default'),
      defaultWs.folders[0]
    );
    return { workspace: defaultWs, chats: [] };
  }

  const profileData = userSnap.data() || {};

  const [foldersSnap, docsSnap, chatsSnap] = await Promise.all([
    getDocs(collection(db, 'users', uid, 'folders')),
    getDocs(collection(db, 'users', uid, 'documents')),
    getDocs(collection(db, 'users', uid, 'chats'))
  ]);

  const folders: LibraryFolder[] = [];
  foldersSnap.forEach(d => folders.push(d.data() as LibraryFolder));

  if (folders.length === 0) {
    folders.push(defaultWs.folders[0]);
    await setDoc(
      doc(db, 'users', uid, 'folders', 'folder-default'),
      defaultWs.folders[0]
    );
  }

  const documents: DocumentSource[] = [];
  const concepts: Concept[] = [];
  const claims: EvidenceClaim[] = [];

  docsSnap.forEach(d => {
    const raw = d.data() as StoredDocumentRecord;
    const { concepts: docConcepts, claims: docClaims, ...docOnly } = raw;
    documents.push(docOnly);
    if (Array.isArray(docConcepts)) concepts.push(...docConcepts);
    if (Array.isArray(docClaims)) claims.push(...docClaims);
  });

  const chats: StoredChatSession[] = [];
  chatsSnap.forEach(c => chats.push(c.data() as StoredChatSession));
  chats.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

  const activeFolderId = folders.some(f => f.id === profileData.activeFolderId)
    ? profileData.activeFolderId
    : folders[0].id;

  const activeDocumentId = documents.some(d => d.id === profileData.activeDocumentId)
    ? profileData.activeDocumentId
    : documents[0]?.id || null;

  return {
    workspace: {
      ...defaultWs,
      folders,
      activeFolderId,
      activeDocumentId,
      documents,
      concepts,
      claims,
      activeConceptId:
        concepts.find(c => c.sourceDocumentId === activeDocumentId)?.id ||
        concepts[0]?.id ||
        null,
      creditSaverMode: profileData.creditSaverMode ?? true,
      audioSpeed: profileData.audioSpeed ?? 1.0
    },
    chats
  };
}

export async function saveUserSettingsToFirestore(
  uid: string,
  partial: {
    creditSaverMode?: boolean;
    audioSpeed?: number;
    activeFolderId?: string | null;
    activeDocumentId?: string | null;
  }
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  await setDoc(
    doc(db, 'users', uid),
    stripUndefined({
      ...partial,
      updatedAt: new Date().toISOString()
    }),
    { merge: true }
  );
}

export async function createFolderInFirestore(
  uid: string,
  folder: LibraryFolder
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  await setDoc(
    doc(db, 'users', uid, 'folders', folder.id),
    stripUndefined({
      id: folder.id,
      name: folder.name.slice(0, 120),
      createdAt: folder.createdAt
    })
  );
}

export async function saveDocumentInFirestore(
  uid: string,
  record: StoredDocumentRecord
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  const sanitized: StoredDocumentRecord = stripUndefined({
    id: record.id,
    folderId: record.folderId,
    sourceType: record.sourceType || 'pdf',
    title: record.title.slice(0, 300),
    authors: (record.authors || 'Uploaded').slice(0, 300),
    year: Math.round(record.year || new Date().getFullYear()),
    abstract: (record.abstract || '').slice(0, 10000),
    pageCount: Math.max(0, Math.round(record.pageCount || 1)),
    fileSize: (record.fileSize || '1 KB').slice(0, 64),
    uploadDate: record.uploadDate,
    keyStance: (record.keyStance || '').slice(0, 2000),
    excerpts: (record.excerpts || []).slice(0, 200),
    concepts: (record.concepts || []).slice(0, 200),
    claims: (record.claims || []).slice(0, 200)
  });

  await setDoc(doc(db, 'users', uid, 'documents', sanitized.id), sanitized);
  await saveUserSettingsToFirestore(uid, {
    activeFolderId: sanitized.folderId,
    activeDocumentId: sanitized.id
  });
}

export async function updateDocumentConceptsInFirestore(
  uid: string,
  docId: string,
  concepts: Concept[]
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  await setDoc(
    doc(db, 'users', uid, 'documents', docId),
    stripUndefined({ concepts: concepts.slice(0, 200) }),
    { merge: true }
  );
}

export async function deleteDocumentInFirestore(
  uid: string,
  docId: string
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  await deleteDoc(doc(db, 'users', uid, 'documents', docId));
}

export async function saveChatSessionInFirestore(
  uid: string,
  session: StoredChatSession
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  const sanitized: StoredChatSession = stripUndefined({
    id: session.id,
    title: (session.title || 'Learning Chat').slice(0, 300),
    documentId: session.documentId || null,
    folderId: session.folderId || null,
    activeStage: Math.min(5, Math.max(1, Math.round(session.activeStage))) as TutorStage,
    messages: (session.messages || []).slice(-500),
    updatedAt: session.updatedAt || new Date().toISOString()
  });
  await setDoc(doc(db, 'users', uid, 'chats', sanitized.id), sanitized);
}

export async function clearAllUserDataInFirestore(
  uid: string
): Promise<WorkspaceState> {
  const db = getFirebaseDb();
  const emptyWs = createEmptyWorkspace(uid);
  if (!db) return emptyWs;

  const batch = writeBatch(db);
  const docsSnap = await getDocs(collection(db, 'users', uid, 'documents'));
  docsSnap.forEach(d => batch.delete(d.ref));

  const chatsSnap = await getDocs(collection(db, 'users', uid, 'chats'));
  chatsSnap.forEach(c => batch.delete(c.ref));

  const foldersSnap = await getDocs(collection(db, 'users', uid, 'folders'));
  foldersSnap.forEach(f => batch.delete(f.ref));

  await batch.commit();

  await setDoc(
    doc(db, 'users', uid, 'folders', 'folder-default'),
    emptyWs.folders[0]
  );
  await saveUserSettingsToFirestore(uid, {
    activeFolderId: 'folder-default',
    activeDocumentId: null
  });

  return emptyWs;
}
