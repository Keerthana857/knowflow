import fs from 'fs';
import path from 'path';
import { WorkspaceState } from '../types';
import { DEFAULT_BENCHMARK } from '../data/defaultBenchmark';
import { recalculateWorkspacePriorities } from './priorityEngine';
import { recalculateSchedule } from './replanner';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'workspace.json');

let inMemoryState: WorkspaceState | null = null;

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

function normalizeWorkspace(ws: WorkspaceState): WorkspaceState {
  const folders =
    ws.folders && ws.folders.length > 0 ? ws.folders : DEFAULT_BENCHMARK.folders;
  const defaultFolderId = folders[0].id;
  const documents = (ws.documents || []).map(d => ({
    ...d,
    folderId: d.folderId || defaultFolderId,
    sourceType: d.sourceType || ('pdf' as const)
  }));

  return {
    ...ws,
    folders,
    activeFolderId: ws.activeFolderId ?? defaultFolderId,
    activeDocumentId: ws.activeDocumentId ?? documents[0]?.id ?? null,
    documents,
    creditSaverMode: ws.creditSaverMode ?? true,
    audioSpeed: ws.audioSpeed ?? 1.0
  };
}

export async function getWorkspace(): Promise<WorkspaceState> {
  if (inMemoryState) {
    return inMemoryState;
  }

  ensureDataDir();

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      if (raw.trim()) {
        const parsed = normalizeWorkspace(JSON.parse(raw) as WorkspaceState);
        inMemoryState = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read workspace.json, falling back to default benchmark:', err);
  }

  const initial = normalizeWorkspace(JSON.parse(JSON.stringify(DEFAULT_BENCHMARK)));
  inMemoryState = recalculateWorkspacePriorities(initial);
  inMemoryState.schedule = recalculateSchedule(
    inMemoryState.concepts,
    inMemoryState.availableTimeBudgetMinutes
  );
  saveWorkspace(inMemoryState);
  return inMemoryState;
}

export function saveWorkspace(state: WorkspaceState): void {
  const normalized = normalizeWorkspace(state);
  inMemoryState = normalized;
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(normalized, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write workspace to disk:', err);
  }
}

export async function resetWorkspace(): Promise<WorkspaceState> {
  const fresh = normalizeWorkspace(JSON.parse(JSON.stringify(DEFAULT_BENCHMARK)));
  const prioritized = recalculateWorkspacePriorities(fresh);
  prioritized.schedule = recalculateSchedule(
    prioritized.concepts,
    prioritized.availableTimeBudgetMinutes
  );
  saveWorkspace(prioritized);
  return prioritized;
}

export async function updateWorkspace(partial: Partial<WorkspaceState>): Promise<WorkspaceState> {
  const current = await getWorkspace();
  let updated: WorkspaceState = normalizeWorkspace({
    ...current,
    ...partial
  });

  if (partial.concepts || partial.edges) {
    updated = recalculateWorkspacePriorities(updated);
  }
  if (partial.availableTimeBudgetMinutes !== undefined || partial.concepts) {
    updated.schedule = recalculateSchedule(
      updated.concepts,
      updated.availableTimeBudgetMinutes
    );
    updated.crunchModeActive = updated.schedule.some(s => s.mode === 'crunch');
  }

  saveWorkspace(updated);
  return updated;
}

export async function updateConceptMastery(
  conceptId: string,
  newScore: number
): Promise<WorkspaceState> {
  const current = await getWorkspace();
  const boundedScore = Math.max(0, Math.min(100, Math.round(newScore)));

  const updatedConcepts = current.concepts.map(c => {
    if (c.id === conceptId) {
      let status = c.status;
      if (boundedScore >= 85) status = 'mastered';
      else if (boundedScore >= 50) status = 'in_progress';
      else status = 'weak';

      return {
        ...c,
        userMastery: boundedScore,
        status
      };
    }
    return c;
  });

  return updateWorkspace({ concepts: updatedConcepts });
}
