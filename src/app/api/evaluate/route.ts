import { NextResponse } from 'next/server';
import { getWorkspace, updateConceptMastery } from '@/lib/storage';
import { gradeShortAnswerQuestion } from '@/lib/ai';
import { runWithGrokKey } from '@/lib/grok';

export async function POST(request: Request) {
  return runWithGrokKey(request.headers.get('x-grok-key'), async () => {
  try {
    const body = await request.json();
    const { conceptId, answers } = body as {
      conceptId: string;
      answers: Record<string, string>; // questionId -> selectedOptionId or short answer text
    };

    const workspace = await getWorkspace();
    const concept = workspace.concepts.find(c => c.id === conceptId);

    if (!concept) {
      return NextResponse.json({ success: false, error: 'Concept not found' }, { status: 404 });
    }

    const questionResults: Array<{
      questionId: string;
      level: string;
      isCorrect: boolean;
      score: number;
      feedback: string;
      explanation: string;
    }> = [];

    let totalScore = 0;
    const questions = concept.assessment;

    for (const q of questions) {
      const userAns = answers[q.id] || '';

      if (q.type === 'mcq') {
        const isCorrect = userAns.toLowerCase() === (q.correctOptionId || '').toLowerCase();
        const score = isCorrect ? 100 : 0;
        totalScore += score;

        questionResults.push({
          questionId: q.id,
          level: q.level,
          isCorrect,
          score,
          feedback: isCorrect
            ? 'Correct! You demonstrated exact recall of this principle.'
            : `Incorrect. The correct answer was option (${(q.correctOptionId || '').toUpperCase()}).`,
          explanation: q.rubricExplanation
        });
      } else {
        // Short answer evaluation
        const grading = await gradeShortAnswerQuestion(q.question, q.rubricExplanation, userAns);
        totalScore += grading.score;

        questionResults.push({
          questionId: q.id,
          level: q.level,
          isCorrect: grading.isPassing,
          score: grading.score,
          feedback: grading.feedback,
          explanation: q.rubricExplanation
        });
      }
    }

    const avgMastery = Math.round(totalScore / (questions.length || 1));

    // Update mastery in persistent storage (this also updates status and re-triggers topological sort)
    const updatedWorkspace = await updateConceptMastery(conceptId, avgMastery);

    return NextResponse.json({
      success: true,
      conceptId,
      newMastery: avgMastery,
      questionResults,
      updatedWorkspace
    });
  } catch (error: any) {
    console.error('Error during evaluation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  });
}
