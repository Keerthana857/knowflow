import { NextResponse } from 'next/server';
import { retrieveRelevantContext, RetrievedContext } from '@/lib/retriever';
import { generateFiveStageTutorReply } from '@/lib/ai';
import { runWithGrokKey } from '@/lib/grok';
import { TutorStage, WorkspaceState, DocumentSource, Concept } from '@/types';
import { EMPTY_WORKSPACE } from '@/data/defaultBenchmark';

export const maxDuration = 60;

export async function POST(request: Request) {
  return runWithGrokKey(request.headers.get('x-grok-key'), async () => {
    try {
      const body = await request.json();
      const {
        conceptId,
        folderId,
        documentId,
        message = '',
        stage = 1,
        documents = [],
        concepts = [],
        creditSaverMode = true
      } = body as {
        conceptId?: string | null;
        folderId?: string | null;
        documentId?: string | null;
        message?: string;
        stage?: TutorStage;
        documents?: DocumentSource[];
        concepts?: Concept[];
        creditSaverMode?: boolean;
      };

      const validStage: TutorStage = (
        [1, 2, 3, 4, 5].includes(Number(stage)) ? Number(stage) : 1
      ) as TutorStage;

      const docList = Array.isArray(documents) ? documents : [];

      // Support inline @document mention in typed message even if chip was cleared
      let effectiveDocId = documentId ?? null;
      if (!effectiveDocId && message.includes('@') && docList.length > 0) {
        const lowerMsg = message.toLowerCase();
        const matched = docList.find(d => lowerMsg.includes(`@${d.title.toLowerCase()}`));
        if (matched) effectiveDocId = matched.id;
      }

      // Build stateless workspace view strictly from caller's real documents/concepts (ZERO fake data)
      const runtimeWorkspace: WorkspaceState = {
        ...EMPTY_WORKSPACE,
        documents: docList,
        concepts: Array.isArray(concepts) ? concepts : [],
        activeFolderId: folderId ?? null,
        activeDocumentId: effectiveDocId,
        activeConceptId: conceptId ?? null,
        creditSaverMode
      };

      let retrieved: RetrievedContext;

      if (docList.length > 0 && (effectiveDocId || folderId)) {
        retrieved = retrieveRelevantContext(runtimeWorkspace, message || 'overview', {
          folderId: folderId ?? null,
          documentId: effectiveDocId,
          conceptId: conceptId ?? null,
          maxExcerpts: 3,
          maxChars: creditSaverMode ? 1400 : 2200
        });
      } else {
        // No file or folder selected in chat — scope strictly to the user's typed question/topic
        const topicQuery = message.trim() || 'Your Study Topic';
        retrieved = {
          scopedDocuments: [],
          scopedConcepts: [],
          excerpts: [
            {
              docId: 'direct-topic',
              docTitle: topicQuery.slice(0, 60),
              page: 1,
              heading: topicQuery.slice(0, 48),
              text: `Topic requested directly by student: "${topicQuery}".`,
              score: 1
            }
          ],
          contextText: `Student Question / Topic: "${topicQuery}" (No PDF attached; explain this topic directly in the 5-stage format).`,
          citations: []
        };
      }

      const tutorData = await generateFiveStageTutorReply({
        stage: validStage,
        userMessage: message,
        retrieved,
        creditSaverMode
      });

      return NextResponse.json({
        success: true,
        reply: tutorData.narrative || tutorData.headline,
        tutorData
      });
    } catch (error: any) {
      console.error('Error in chat route:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  });
}
