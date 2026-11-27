import { WorkspaceState } from '../types';

/**
 * Clean initial workspace with ZERO fake papers, concepts, or quiz data.
 * All real data comes from the signed-in user's Cloud Firestore library and uploaded/pasted materials.
 */
export const EMPTY_WORKSPACE: WorkspaceState = {
  id: 'user-workspace',
  name: 'My Library',
  availableTimeBudgetMinutes: 30,
  crunchModeActive: false,
  learningStreakDays: 0,
  activeConceptId: null,
  creditSaverMode: true,
  audioSpeed: 1.0,
  folders: [
    {
      id: 'folder-default',
      name: 'My Study Folder',
      createdAt: new Date().toISOString().split('T')[0]
    }
  ],
  activeFolderId: 'folder-default',
  activeDocumentId: null,
  documents: [],
  concepts: [],
  edges: [],
  claims: [],
  schedule: []
};

export const DEFAULT_BENCHMARK: WorkspaceState = EMPTY_WORKSPACE;
