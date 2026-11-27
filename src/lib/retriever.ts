import { Concept, DocumentExcerpt, DocumentSource, WorkspaceState } from '../types';

const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with',
  'to', 'for', 'of', 'as', 'by', 'that', 'this', 'it', 'from', 'be', 'are', 'was',
  'were', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could', 'will',
  'would', 'should', 'what', 'why', 'how', 'when', 'where', 'who', 'explain', 'tell',
  'about', 'me', 'simply', 'please', 'give', 'example', 'story', 'using', 'only'
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

export interface RetrievedContext {
  scopedDocuments: DocumentSource[];
  scopedConcepts: Concept[];
  excerpts: Array<{
    docId: string;
    docTitle: string;
    page: number;
    heading: string;
    text: string;
    score: number;
  }>;
  contextText: string;
  citations: string[];
}

/**
 * Lightweight local context retriever:
 * Finds only the top matching document excerpts for a user query/stage,
 * keeping Grok prompt token usage minimal while grounding every reply strictly in source text.
 */
export function retrieveRelevantContext(
  workspace: WorkspaceState,
  query: string,
  options?: {
    folderId?: string | null;
    documentId?: string | null;
    conceptId?: string | null;
    maxExcerpts?: number;
    maxChars?: number;
  }
): RetrievedContext {
  const maxExcerpts = options?.maxExcerpts ?? 3;
  const maxChars = options?.maxChars ?? 1600;

  // 1. Scope documents by documentId or folderId
  let scopedDocs = workspace.documents;
  if (options?.documentId) {
    const exact = workspace.documents.filter(d => d.id === options.documentId);
    if (exact.length > 0) scopedDocs = exact;
  } else if (options?.folderId) {
    const inFolder = workspace.documents.filter(d => d.folderId === options.folderId);
    if (inFolder.length > 0) scopedDocs = inFolder;
  }

  const scopedDocIds = new Set(scopedDocs.map(d => d.id));
  let scopedConcepts = workspace.concepts.filter(c => scopedDocIds.has(c.sourceDocumentId));
  if (scopedConcepts.length === 0) scopedConcepts = workspace.concepts;

  if (options?.conceptId) {
    const cMatch = scopedConcepts.find(c => c.id === options.conceptId);
    if (cMatch) {
      scopedConcepts = [cMatch, ...scopedConcepts.filter(c => c.id !== cMatch.id)];
    }
  }

  // 2. Collect all excerpts from scoped documents (synthesize from abstract/concepts if excerpts empty)
  const candidates: Array<{
    docId: string;
    docTitle: string;
    page: number;
    heading: string;
    text: string;
  }> = [];

  for (const doc of scopedDocs) {
    if (doc.excerpts && doc.excerpts.length > 0) {
      for (const ex of doc.excerpts) {
        candidates.push({
          docId: doc.id,
          docTitle: doc.title,
          page: ex.page,
          heading: ex.heading,
          text: ex.text
        });
      }
    } else {
      const fallbackParts = [doc.abstract?.trim(), doc.keyStance?.trim()].filter(Boolean);
      if (fallbackParts.length > 0) {
        candidates.push({
          docId: doc.id,
          docTitle: doc.title,
          page: 1,
          heading: 'Overview',
          text: fallbackParts.join(' Key finding: ')
        });
      }
    }
  }

  // Also include concept summaries in matching pool if needed
  for (const c of scopedConcepts) {
    const doc = scopedDocs.find(d => d.id === c.sourceDocumentId) || scopedDocs[0];
    if (doc) {
      candidates.push({
        docId: doc.id,
        docTitle: doc.title,
        page: 1,
        heading: c.name,
        text: `${c.name}: ${c.summary} ${c.chunks[0]?.normal.mechanics || ''} ${c.chunks[0]?.deep.edgeCases || ''}`.trim()
      });
    }
  }

  // 3. Score candidates by query keyword overlap
  const queryTerms = tokenize(query);

  const scored = candidates.map((cand, idx) => {
    const hay = `${cand.docTitle} ${cand.heading} ${cand.text}`.toLowerCase();
    let score = 0;

    if (queryTerms.length === 0) {
      // Favor early primary excerpts when no specific query terms exist
      score = Math.max(1, 10 - idx);
    } else {
      for (const term of queryTerms) {
        if (cand.heading.toLowerCase().includes(term)) score += 3;
        if (hay.includes(term)) score += 1;
      }
    }

    // Slight boost for document excerpts over synthesized concept blocks
    if (cand.text.length > 120) score += 0.5;

    return { ...cand, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Deduplicate similar headings/texts and respect maxChars budget
  const chosen: typeof scored = [];
  let charBudget = maxChars;
  const seen = new Set<string>();

  for (const item of scored) {
    if (chosen.length >= maxExcerpts) break;
    const key = `${item.docId}:${item.heading}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const trimmedText = item.text.length > 600 ? item.text.slice(0, 597) + '...' : item.text;
    if (charBudget - trimmedText.length < 0 && chosen.length > 0) break;

    chosen.push({ ...item, text: trimmedText });
    charBudget -= trimmedText.length;
  }

  const contextText = chosen
    .map(c => `[${c.docTitle} | p.${c.page} | ${c.heading}]: ${c.text}`)
    .join('\n\n');

  const citations = Array.from(
    new Set(chosen.map(c => `${c.docTitle.split(':')[0].trim()} (p.${c.page})`))
  );

  return {
    scopedDocuments: scopedDocs,
    scopedConcepts,
    excerpts: chosen,
    contextText,
    citations
  };
}
