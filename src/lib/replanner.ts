import { Concept, StudyScheduleItem } from '../types';

/**
 * Feature 8: Dynamic Learning Replanner
 * Automatically recalculates the remaining study schedule based on:
 * - availableTimeBudgetMinutes
 * - estimated time per concept
 * - current userMastery
 * - prerequisite dependencies
 *
 * Employs "Crunch Mode" if time is scarce:
 * - Drops low-yield deep edge cases to 'crunch' mode (50% time)
 * - Compresses mastered topics to 0 mins
 * - Focuses available time strictly on high-impact weak concepts
 */
export function recalculateSchedule(
  concepts: Concept[],
  timeBudgetMinutes: number
): StudyScheduleItem[] {
  let remainingBudget = timeBudgetMinutes;
  const schedule: StudyScheduleItem[] = [];

  // 1. Separate concepts: mastered vs. needing study
  const needingStudy = concepts.filter(c => c.userMastery < 85);
  const mastered = concepts.filter(c => c.userMastery >= 85);

  // 2. Calculate baseline time needed
  const totalBaseMinutes = needingStudy.reduce((acc, c) => acc + c.estimatedMinutes, 0);

  // If totalBaseMinutes > remainingBudget * 1.15, activate Crunch Mode
  const isCrunchMode = totalBaseMinutes > remainingBudget;

  let rank = 1;

  for (const concept of needingStudy) {
    let allocated = concept.estimatedMinutes;
    let mode: 'deep' | 'normal' | 'crunch' = 'normal';

    if (isCrunchMode) {
      if (concept.importance >= 9 || concept.userMastery < 40) {
        allocated = Math.round(concept.estimatedMinutes * 0.75);
        mode = 'normal';
      } else {
        allocated = Math.max(4, Math.round(concept.estimatedMinutes * 0.45));
        mode = 'crunch';
      }
    } else {
      if (concept.importance >= 8 && concept.difficulty >= 7) {
        mode = 'deep';
        allocated = concept.estimatedMinutes;
      } else {
        mode = 'normal';
        allocated = Math.round(concept.estimatedMinutes * 0.85);
      }
    }

    // Check prerequisites
    const prerequisitesMet = concept.prerequisites.every(pId => {
      const p = concepts.find(c => c.id === pId);
      return !p || p.userMastery >= 70;
    });

    let reason = concept.priorityReason || '';
    if (!reason || reason.includes('Allocated') || reason.includes('exam payoff') || reason.includes('Crunch Mode:')) {
      if (concept.userMastery < 50 && concept.userMastery > 0) {
        reason = 'Review first to strengthen your foundation.';
      } else if (!prerequisitesMet) {
        reason = 'Builds on earlier foundational concepts.';
      } else if (mode === 'crunch') {
        reason = 'Shortened to fit your available time.';
      } else {
        reason = 'Core concept for your study session.';
      }
    }

    schedule.push({
      conceptId: concept.id,
      conceptName: concept.name,
      allocatedMinutes: Math.min(allocated, Math.max(5, remainingBudget)),
      mode,
      priorityRank: rank++,
      priorityTier: concept.priorityTier || (rank <= 2 ? 'high' : 'medium'),
      prerequisitesMet,
      status: rank === 2 ? 'active' : 'scheduled',
      reason
    });

    remainingBudget -= allocated;
    if (remainingBudget <= 0) remainingBudget = 0;
  }

  // Add mastered concepts as compressed/completed items at the end
  mastered.forEach(concept => {
    schedule.push({
      conceptId: concept.id,
      conceptName: concept.name,
      allocatedMinutes: 0,
      mode: 'normal',
      priorityRank: rank++,
      priorityTier: 'low',
      prerequisitesMet: true,
      status: 'completed',
      reason: `Already understood. Time saved for new topics.`
    });
  });

  return schedule;
}
