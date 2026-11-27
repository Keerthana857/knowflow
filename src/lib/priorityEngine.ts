import { Concept, RelationshipEdge, WorkspaceState, PriorityTier } from '../types';

/**
 * Feature 2: Smart Priority Engine
 * Ranks topics into High Priority, Medium Priority, and Low Priority based on:
 * - Importance within the uploaded material (1-10)
 * - Topic difficulty (1-10)
 * - User's quiz performance and weak areas (100 - userMastery)
 * - Prerequisite concepts & blocking factor
 * - Estimated time required
 */
export function computePriorityScore(concept: Concept, edges: RelationshipEdge[]): {
  score: number;
  tier: PriorityTier;
  reason: string;
} {
  // 1. Calculate downstream dependencies (how many concepts require this concept)
  const downstreamCount = edges.filter(
    e => e.source === concept.id && e.type === 'prerequisite'
  ).length;

  // 2. Base formula
  const importanceWeight = concept.importance * 5; // max 50
  const difficultyWeight = concept.difficulty * 2.5; // max 25
  const blockingWeight = downstreamCount * 8; // blocks downstream
  const weaknessWeight = (100 - concept.userMastery) * 0.35; // max 35

  const rawScore = importanceWeight + difficultyWeight + blockingWeight + weaknessWeight;
  const score = Math.round(Math.min(100, Math.max(10, rawScore)));

  // Tier classification: High, Medium, Low
  let tier: PriorityTier = 'medium';
  if (score >= 78 || (concept.userMastery < 50 && concept.userMastery > 0)) {
    tier = 'high';
  } else if (score < 45 || concept.userMastery >= 85) {
    tier = 'low';
  }

  // 3. Dynamic human-readable reason
  let reason = concept.priorityReason || '';
  if (!reason || reason.includes('CRITICAL GAP') || reason.includes('exam weight')) {
    if (downstreamCount > 0) {
      reason = `Required to understand ${downstreamCount === 1 ? 'the next topic' : 'the next ' + downstreamCount + ' topics'}.`;
    } else if (concept.userMastery < 50 && concept.userMastery > 0) {
      reason = 'You may want to review this concept before moving forward.';
    } else if (concept.userMastery >= 85) {
      reason = 'Already understood.';
    } else {
      reason = 'Core concept of this document.';
    }
  }

  return { score, tier, reason };
}

/**
 * Topologically sorts concepts so prerequisites are always studied before dependents.
 * Ties are broken using the calculated priority score and user weakness.
 */
export function topologicalPrioritySort(concepts: Concept[], edges: RelationshipEdge[]): Concept[] {
  const conceptMap = new Map<string, Concept>();
  concepts.forEach(c => conceptMap.set(c.id, c));

  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  concepts.forEach(c => {
    inDegree.set(c.id, 0);
    adj.set(c.id, []);
  });

  edges.forEach(edge => {
    if (edge.type === 'prerequisite') {
      if (conceptMap.has(edge.source) && conceptMap.has(edge.target)) {
        adj.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      }
    }
  });

  const readyQueue: Concept[] = [];
  concepts.forEach(c => {
    if ((inDegree.get(c.id) || 0) === 0) {
      readyQueue.push(c);
    }
  });

  readyQueue.sort((a, b) => b.priorityScore - a.priorityScore);

  const sorted: Concept[] = [];

  while (readyQueue.length > 0) {
    readyQueue.sort((a, b) => b.priorityScore - a.priorityScore);
    const curr = readyQueue.shift()!;
    sorted.push(curr);

    const neighbors = adj.get(curr.id) || [];
    for (const nId of neighbors) {
      const newDeg = (inDegree.get(nId) || 1) - 1;
      inDegree.set(nId, newDeg);
      if (newDeg === 0) {
        const nextConcept = conceptMap.get(nId);
        if (nextConcept) {
          readyQueue.push(nextConcept);
        }
      }
    }
  }

  if (sorted.length < concepts.length) {
    const includedIds = new Set(sorted.map(s => s.id));
    concepts.forEach(c => {
      if (!includedIds.has(c.id)) {
        sorted.push(c);
      }
    });
  }

  return sorted;
}

export function recalculateWorkspacePriorities(state: WorkspaceState): WorkspaceState {
  const updatedConcepts = state.concepts.map(concept => {
    const { score, tier, reason } = computePriorityScore(concept, state.edges);
    let status = concept.status;
    if (concept.userMastery >= 85) status = 'mastered';
    else if (concept.userMastery >= 50) status = 'in_progress';
    else if (concept.userMastery > 0) status = 'weak';
    else status = 'not_started';

    return {
      ...concept,
      priorityScore: score,
      priorityTier: tier,
      priorityReason: reason,
      status
    };
  });

  const sorted = topologicalPrioritySort(updatedConcepts, state.edges);

  return {
    ...state,
    concepts: sorted
  };
}
