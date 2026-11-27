import { ParsedPdfResult } from './pdfExtractor';
import {
  Concept,
  RelationshipEdge,
  EvidenceClaim,
  TutorResponsePayload,
  TutorStage
} from '../types';
import { callGrokJson } from './grok';
import { RetrievedContext } from './retriever';

/**
 * Extracts context-specific concepts, relationships, and claims from a parsed PDF or pasted notes
 * using Grok exclusively (low-credit compact prompt), with a real text-grounded fallback.
 */
export async function extractConceptsAndClaimsFromPdf(
  docId: string,
  pdfResult: ParsedPdfResult,
  existingConceptIds: string[]
): Promise<{
  concepts: Concept[];
  edges: RelationshipEdge[];
  claims: EvidenceClaim[];
}> {
  const compactSections = pdfResult.sections
    .slice(0, 4)
    .map(s => `[p.${s.pageEstimate} ${s.title}]: ${s.content.substring(0, 380)}`)
    .join('\n');

  const systemPrompt =
    'You extract structured study concepts strictly from the provided text. Return valid JSON only. Keep explanations concise, visual, and jargon-free.';

  const userPrompt = `Document: "${pdfResult.title}"
Abstract: ${pdfResult.abstract.slice(0, 300)}
Excerpts:
${compactSections}

Extract 2 to 4 core concepts strictly from THIS document (never invent unrelated topics).
Return JSON:
{
  "concepts": [
    {
      "name": "short clear topic name",
      "summary": "1 plain sentence from this text",
      "importance": 8,
      "difficulty": 5,
      "estimatedMinutes": 7,
      "sourceSection": "Pages X-Y",
      "coreIdea": "1 clear sentence",
      "simpleIntuition": "1-2 sentence everyday intuition",
      "simpleAnalogy": "1-2 sentence real-world analogy",
      "normalMechanics": "how it works based on the text",
      "normalFormulas": "key rule or formula from text (or N/A)",
      "deepFormal": "technical detail from text",
      "deepEdgeCases": "limitation or trap mentioned in text",
      "keyTakeaway": "1 short takeaway",
      "mcqQuestion": "1 conceptual check question about THIS topic",
      "mcqCorrect": "correct answer from text",
      "mcqDistractor1": "plausible wrong answer",
      "mcqDistractor2": "plausible wrong answer"
    }
  ],
  "claims": [
    {
      "topic": "string",
      "claim": "main finding from this text",
      "methodology": "how it was tested/argued",
      "evidenceStrength": "Strong Empirical",
      "limitations": "limitation from text",
      "citation": "Page reference"
    }
  ]
}`;

  const grokRes = await callGrokJson<{ concepts?: any[]; claims?: any[] }>({
    systemPrompt,
    userPrompt,
    maxTokens: 900
  });

  if (grokRes.ok && grokRes.data?.concepts && grokRes.data.concepts.length > 0) {
    return transformAiOutputToEntities(docId, pdfResult.title, grokRes.data, existingConceptIds);
  }

  return generateContextGroundedConcepts(docId, pdfResult, existingConceptIds);
}

function transformAiOutputToEntities(
  docId: string,
  docTitle: string,
  raw: { concepts?: any[]; claims?: any[] },
  existingConceptIds: string[]
): {
  concepts: Concept[];
  edges: RelationshipEdge[];
  claims: EvidenceClaim[];
} {
  const concepts: Concept[] = [];
  const edges: RelationshipEdge[] = [];
  const claims: EvidenceClaim[] = [];

  (raw.concepts || []).forEach((rc: any, idx: number) => {
    const cId = `gen-${docId.replace(/[^a-zA-Z0-9]/g, '')}-${idx + 1}`;
    const prereqs: string[] = [];
    if (idx > 0 && concepts[idx - 1]) {
      prereqs.push(concepts[idx - 1].id);
    } else if (existingConceptIds.length > 0 && idx === 0) {
      // keep document chain clean without forcing cross-document dependencies
    }

    const name = rc.name || `${docTitle.slice(0, 28)} — Part ${idx + 1}`;
    const summary = rc.summary || rc.coreIdea || `Core concept from ${docTitle}.`;

    concepts.push({
      id: cId,
      name,
      summary,
      importance: Number(rc.importance) || 8,
      difficulty: Number(rc.difficulty) || 5,
      estimatedMinutes: Number(rc.estimatedMinutes) || 7,
      prerequisites: prereqs,
      userMastery: 0,
      status: 'not_started',
      priorityScore: 90 - idx * 5,
      priorityTier: idx === 0 ? 'high' : 'medium',
      priorityReason:
        idx === 0
          ? `Foundation in "${docTitle.slice(0, 32)}": needed for the next topics.`
          : `Builds on ${concepts[idx - 1]?.name || 'earlier ideas'}.`,
      sourceDocumentId: docId,
      sourceSection: rc.sourceSection || 'Page 1',
      examples: [
        {
          title: `Example: ${name}`,
          scenario: rc.simpleAnalogy || summary,
          breakdown: rc.normalMechanics || summary
        }
      ],
      chunks: [
        {
          id: `${cId}-ch1`,
          index: 1,
          title: name,
          coreIdea: rc.coreIdea || summary,
          simple: {
            intuition: rc.simpleIntuition || summary,
            analogy: rc.simpleAnalogy || rc.simpleIntuition || summary,
            plainEnglish: summary
          },
          normal: {
            mechanics: rc.normalMechanics || summary,
            keyFormulas: rc.normalFormulas || '',
            structuredExplanation: rc.normalMechanics || summary
          },
          deep: {
            formalDefinition: rc.deepFormal || rc.normalMechanics || summary,
            edgeCases: rc.deepEdgeCases || 'See source limitations.',
            researchNuance: `Extracted from ${docTitle} (${rc.sourceSection || 'p.1'}).`
          },
          keyTakeaway: rc.keyTakeaway || summary
        }
      ],
      assessment: [
        {
          id: `${cId}-q1`,
          level: 'conceptual',
          type: 'mcq',
          question: rc.mcqQuestion || `What is the key idea behind ${name}?`,
          options: [
            { id: 'a', text: rc.mcqCorrect || rc.coreIdea || summary },
            { id: 'b', text: rc.mcqDistractor1 || 'It ignores all context from earlier sections.' },
            { id: 'c', text: rc.mcqDistractor2 || 'It is an unrelated formatting rule.' }
          ],
          correctOptionId: 'a',
          hint: rc.simpleIntuition || summary,
          rubricExplanation: rc.keyTakeaway || summary
        }
      ]
    });

    if (prereqs.length > 0) {
      edges.push({
        id: `e-${prereqs[0]}-${cId}`,
        source: prereqs[0],
        target: cId,
        type: 'prerequisite',
        label: 'leads to',
        aiConnectionExplanation: `${concepts[idx - 1]?.name} leads into ${name}.`
      });
    }
  });

  (raw.claims || []).forEach((cl: any, idx: number) => {
    claims.push({
      id: `cl-${docId}-${idx + 1}`,
      topic: cl.topic || docTitle.slice(0, 40),
      claim: cl.claim || 'Key finding extracted from document.',
      methodology: cl.methodology || 'Document analysis.',
      evidenceStrength: cl.evidenceStrength || 'Moderate',
      limitations: cl.limitations || 'Scoped to document context.',
      sourcePaperId: docId,
      sourcePaperTitle: docTitle,
      citation: cl.citation || 'Page 1'
    });
  });

  return { concepts, edges, claims };
}

/**
 * Text-grounded deterministic extractor (used only if Grok is unavailable):
 * Builds concepts, stories, examples, and questions strictly from actual sentences of THIS PDF.
 */
function generateContextGroundedConcepts(
  docId: string,
  pdfResult: ParsedPdfResult,
  _existingConceptIds: string[]
): {
  concepts: Concept[];
  edges: RelationshipEdge[];
  claims: EvidenceClaim[];
} {
  const concepts: Concept[] = [];
  const edges: RelationshipEdge[] = [];
  const claims: EvidenceClaim[] = [];

  const sourceSections = pdfResult.sections.slice(0, 3);

  sourceSections.forEach((sec, idx) => {
    const sentences = sec.content
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 25);

    const s1 = sentences[0] || sec.content.slice(0, 180);
    const s2 = sentences[1] || s1;
    const s3 = sentences[2] || s2;

    const cleanHeading = sec.title.replace(/^Part \d+:\s*/i, '').slice(0, 48);
    const cId = `c-ctx-${docId.slice(-6)}-${idx + 1}`;
    const prereqs = idx > 0 && concepts[idx - 1] ? [concepts[idx - 1].id] : [];

    concepts.push({
      id: cId,
      name: cleanHeading || `${pdfResult.title.slice(0, 32)} (${idx + 1})`,
      summary: s1,
      importance: 8 - idx,
      difficulty: 5 + idx,
      estimatedMinutes: 6,
      prerequisites: prereqs,
      userMastery: 0,
      status: 'not_started',
      priorityScore: 88 - idx * 6,
      priorityTier: idx === 0 ? 'high' : 'medium',
      priorityReason:
        idx === 0
          ? `Key starting section from "${pdfResult.title.slice(0, 30)}" (p.${sec.pageEstimate}).`
          : `Follows from ${concepts[idx - 1]?.name} (p.${sec.pageEstimate}).`,
      sourceDocumentId: docId,
      sourceSection: `Page ${sec.pageEstimate}`,
      examples: [
        {
          title: `From Page ${sec.pageEstimate}`,
          scenario: s1,
          breakdown: s2
        }
      ],
      chunks: [
        {
          id: `${cId}-ch1`,
          index: 1,
          title: cleanHeading,
          coreIdea: s1,
          simple: {
            intuition: s1,
            analogy: s2,
            plainEnglish: s1
          },
          normal: {
            mechanics: `${s1} ${s2}`,
            keyFormulas: '',
            structuredExplanation: `${s1} ${s2}`
          },
          deep: {
            formalDefinition: sec.content.slice(0, 380),
            edgeCases: s3,
            researchNuance: `Extracted from ${pdfResult.title} around page ${sec.pageEstimate}.`
          },
          keyTakeaway: s2
        }
      ],
      assessment: [
        {
          id: `${cId}-q1`,
          level: 'conceptual',
          type: 'mcq',
          question: `Based on "${cleanHeading}" (p.${sec.pageEstimate}), which statement accurately reflects the document?`,
          options: [
            { id: 'a', text: s1.slice(0, 140) },
            { id: 'b', text: 'The document concludes that none of these factors affect the outcome.' },
            { id: 'c', text: 'This section discusses an unrelated historical timeline.' }
          ],
          correctOptionId: 'a',
          hint: `Look closely at page ${sec.pageEstimate}: "${s1.slice(0, 75)}..."`,
          rubricExplanation: `Page ${sec.pageEstimate} states: ${s1}`
        }
      ]
    });

    if (prereqs.length > 0) {
      edges.push({
        id: `e-${prereqs[0]}-${cId}`,
        source: prereqs[0],
        target: cId,
        type: 'prerequisite',
        label: 'leads to',
        aiConnectionExplanation: `${concepts[idx - 1]?.name} sets up ${cleanHeading}.`
      });
    }
  });

  claims.push({
    id: `cl-${docId}-1`,
    topic: pdfResult.title.slice(0, 42),
    claim: pdfResult.abstract.slice(0, 220),
    methodology: `Based on ${pdfResult.pageCount} page(s) in ${pdfResult.title}.`,
    evidenceStrength: 'Moderate',
    limitations: 'Grounded in uploaded document excerpts.',
    sourcePaperId: docId,
    sourcePaperTitle: pdfResult.title,
    citation: `Pages 1–${pdfResult.pageCount}`
  });

  return { concepts, edges, claims };
}

/**
 * 5-Stage Evidence-Based AI Tutor (Grok-powered + strict context grounding)
 * Follows the exact cognitive science protocol:
 *   Stage 1: Story Hook (4-sentence real-world analogy / causal story + visual graph)
 *   Stage 2: Layer 1 (Skeleton) & Layer 2/3 scaffolding + 1 check question
 *   Stage 3: Worked Example from PDF + "Why" question
 *   Stage 4: Feynman Teach-Back audit strictly against source with hints only
 *   Stage 5: Spaced Recall Pack (6 mixed application questions for 1d, 3d, 7d with hidden answers)
 */
export async function generateFiveStageTutorReply(params: {
  stage: TutorStage;
  userMessage: string;
  retrieved: RetrievedContext;
  creditSaverMode?: boolean;
}): Promise<TutorResponsePayload> {
  const { stage, userMessage, retrieved, creditSaverMode = true } = params;
  const maxTokens = creditSaverMode ? 700 : 1050;

  const docNames = retrieved.scopedDocuments.map(d => d.title).join(', ') || 'Study Material';

  const systemPrompt = `You are an evidence-based AI tutor using ONLY the provided study excerpts.
Never dump a full summary upfront. Keep text crisp, clean, visual, and jargon-free so any student understands immediately.
Always ground every idea, story, diagram node, example, and question strictly in the provided excerpts from "${docNames}".
Return valid JSON matching the requested fields for Stage ${stage}.`;

  const stageInstructions: Record<TutorStage, string> = {
    1: `Stage 1 (Story Hook):
- Explain why this topic matters and how its core pieces connect using a 4-sentence real-world analogy or causal story. Avoid heavy jargon.
- Also output 3 short visual storyBeats and a simple 3-4 node causal graph from THIS context.
JSON format:
{
  "headline": "short clear topic title",
  "narrative": "4-sentence causal story or real-world analogy grounded in the excerpts",
  "storyBeats": [
    {"step":1,"title":"The Problem","text":"1 short sentence","icon":"problem"},
    {"step":2,"title":"The Key Shift","text":"1 short sentence","icon":"spark"},
    {"step":3,"title":"How It Connects","text":"1 short sentence","icon":"flow"},
    {"step":4,"title":"Why It Matters","text":"1 short sentence","icon":"result"}
  ],
  "graph": {
    "title": "How the pieces connect",
    "nodes": [{"id":"n1","label":"short node","sublabel":"2-4 words"},{"id":"n2","label":"...","sublabel":"..."},{"id":"n3","label":"...","sublabel":"..."}],
    "edges": [{"from":"n1","to":"n2","label":"causes"},{"from":"n2","to":"n3","label":"leads to"}]
  },
  "checkQuestion": {"question": "1 simple warm-up question to pause for reply", "hint": "short hint"}
}`,
    2: `Stage 2 (Scaffolding — Layer 1 Skeleton & Deeper Layers):
- Give 3-5 core principles in plain language (skeleton), how they interact (mechanism + formula if present in excerpts), and 1 exam trap/nuance from the excerpts.
- Ask ONE quick check question before moving on.
JSON format:
{
  "headline": "Core Building Blocks",
  "narrative": "1-2 sentence transition connecting from the story to the rules",
  "layers": {
    "skeleton": ["Rule 1 in plain words", "Rule 2...", "Rule 3..."],
    "mechanism": "How these pieces interact step by step",
    "formula": "Key equation or rule from text (or empty string)",
    "nuance": "Key edge case or common misconception from the text"
  },
  "graph": {
    "title": "Rule Interaction Map",
    "nodes": [{"id":"n1","label":"...","sublabel":"..."},{"id":"n2","label":"...","sublabel":"..."},{"id":"n3","label":"...","sublabel":"..."}],
    "edges": [{"from":"n1","to":"n2","label":"feeds"},{"from":"n2","to":"n3","label":"produces"}]
  },
  "checkQuestion": {"question": "1 quick check question on these principles", "hint": "short hint without giving full answer"}
}`,
    3: `Stage 3 (Worked Example + Why Question):
- Walk through ONE concrete worked example strictly from the excerpts in 3-4 clear steps.
- Ask the student WHY one key step works.
JSON format:
{
  "headline": "Worked Example",
  "narrative": "1 short sentence introducing the example from the material",
  "workedExample": {
    "title": "Example title",
    "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
    "whyQuestion": "Why does Step 2 work (or what breaks if we skip it)?",
    "hint": "Helpful hint if the student gets stuck"
  }
}`,
    4: `Stage 4 (Feynman Teach-Back Audit — Hints Only):
- Compare the student's reply strictly against the excerpts.
- If the student hasn't explained it yet (e.g. clicked Stage 4), prompt them to explain the topic back in their own words like teaching a 12-year-old.
- If they wrote an explanation, list what they understood well, exact gaps/misconceptions vs the excerpts, and give HINTS (NEVER give the full answer away).
JSON format:
{
  "headline": "Feynman Teach-Back",
  "narrative": "Encouraging 1-2 sentence response",
  "teachBackPrompt": "Explain this concept in your own words as if teaching a 12-year-old (or refine your explanation using the hint below).",
  "teachBackAudit": {
    "understoodWell": ["point 1 they got right"],
    "missingOrUnclear": ["exact gap vs the source text"],
    "hintToFix": "Socratic hint pointing them to the missing causal link without spoiling the answer",
    "passed": false
  }
}`,
    5: `Stage 5 (Spaced & Interleaved Recall Pack):
- Generate 6 short, mixed application questions grounded strictly in the excerpts (not copy-paste definitions).
- Tag 2 for 1d, 2 for 3d, and 2 for 7d. Include a hint and hidden answer for each.
JSON format:
{
  "headline": "Spaced Recall Pack (1d · 3d · 7d)",
  "narrative": "Test yourself with these 6 mixed application questions over the next week. Answers stay hidden until you click Reveal.",
  "spacedQuestions": [
    {"id":"sr1","daySchedule":"1d","topic":"topic name","question":"application question","hint":"short hint","answer":"concise answer from text"}
  ]
}`
  };

  const userPrompt = `Source Excerpts:
${retrieved.contextText}

Student Message / Request: "${userMessage || 'Start teaching this material'}"

${stageInstructions[stage]}`;

  const grokRes = await callGrokJson<Partial<TutorResponsePayload>>({
    systemPrompt,
    userPrompt,
    maxTokens
  });

  const stageNames: Record<TutorStage, string> = {
    1: 'Story Hook',
    2: 'Scaffolding',
    3: 'Worked Example',
    4: 'Teach-Back',
    5: 'Spaced Recall'
  };

  if (grokRes.ok && grokRes.data) {
    return {
      stage,
      stageTitle: stageNames[stage],
      headline: grokRes.data.headline || stageNames[stage],
      narrative: grokRes.data.narrative || '',
      storyBeats: grokRes.data.storyBeats,
      graph: grokRes.data.graph,
      layers: grokRes.data.layers,
      workedExample: grokRes.data.workedExample,
      teachBackPrompt: grokRes.data.teachBackPrompt,
      teachBackAudit: grokRes.data.teachBackAudit,
      spacedQuestions: grokRes.data.spacedQuestions,
      checkQuestion: grokRes.data.checkQuestion,
      citations: retrieved.citations,
      usedGrok: true
    };
  }

  // Context-grounded deterministic fallback (passes grokRes.error so UI reports invalid/exhausted keys)
  return buildContextFallbackTutorReply(
    stage,
    userMessage,
    retrieved,
    stageNames[stage],
    grokRes.error
  );
}

function buildContextFallbackTutorReply(
  stage: TutorStage,
  userMessage: string,
  retrieved: RetrievedContext,
  stageTitle: string,
  aiError?: string
): TutorResponsePayload {
  const topExcerpt = retrieved.excerpts[0];
  const secondExcerpt = retrieved.excerpts[1] || topExcerpt;
  const concept = retrieved.scopedConcepts[0];
  const concept2 = retrieved.scopedConcepts[1] || concept;

  const docTitle = topExcerpt?.docTitle || 'Your Material';

  // Gather real sentences from ALL retrieved excerpts, filtering out upload placeholders
  const isPlaceholder = (txt: string) =>
    /^(Saved PDF file|Ask questions or paste|Topic requested directly)/i.test(txt.trim());

  const allSentences = retrieved.excerpts
    .flatMap(ex =>
      ex.text
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 28 && !isPlaceholder(s))
    );

  const hasRealText = allSentences.length > 0 || Boolean(concept);

  if (!hasRealText) {
    return {
      stage,
      stageTitle,
      headline: `${docTitle.slice(0, 40)} — Needs Text or Live Grok Key`,
      narrative:
        'This PDF appears to contain scanned images without selectable text, and the Grok API key is not active yet. Paste a short excerpt or update GROK_API_KEY to get brief, accurate explanations and quizzes.',
      citations: retrieved.citations,
      usedGrok: false,
      aiError:
        aiError ||
        'Grok API key is invalid or out of credits. Add a valid xai-... key in .env.local / Vercel.'
    };
  }

  const s1 = allSentences[0] || concept?.chunks[0]?.simple.analogy || concept?.summary || '';
  const s2 = allSentences[1] || concept?.chunks[0]?.simple.intuition || s1;
  const s3 = allSentences[2] || allSentences[0] || s2;
  const s4 = allSentences[3] || s2;
  const s5 = allSentences[4] || s3;
  const s6 = allSentences[5] || s1;

  const graphNodes =
    retrieved.scopedConcepts.slice(0, 4).length >= 2
      ? retrieved.scopedConcepts.slice(0, 4).map((c, idx) => ({
          id: `g-${idx}`,
          label: c.name.length > 22 ? c.name.slice(0, 20) + '…' : c.name,
          sublabel: c.sourceSection.slice(0, 20)
        }))
      : [
          { id: 'g-0', label: 'Core Problem', sublabel: docTitle.slice(0, 18) },
          { id: 'g-1', label: topExcerpt?.heading.slice(0, 20) || 'Mechanism', sublabel: `p.${topExcerpt?.page || 1}` },
          { id: 'g-2', label: 'Key Outcome', sublabel: 'Applied result' }
        ];

  const graphEdges = graphNodes.slice(0, -1).map((n, i) => ({
    from: n.id,
    to: graphNodes[i + 1].id,
    label: i === 0 ? 'drives' : 'leads to'
  }));

  if (stage === 1) {
    const analogy = concept?.chunks[0]?.simple.analogy || s1;
    const intuition = concept?.chunks[0]?.simple.intuition || s2;
    return {
      stage: 1,
      stageTitle,
      headline: concept?.name || topExcerpt?.heading || docTitle,
      narrative: `${analogy} ${intuition} In "${docTitle}", this explains why ${s1.charAt(0).toLowerCase() + s1.slice(1)} Connecting these pieces prevents overload before any formal math appears.`,
      storyBeats: [
        { step: 1, title: 'The Challenge', text: s1, icon: 'problem' },
        { step: 2, title: 'Real-World Picture', text: analogy, icon: 'spark' },
        { step: 3, title: 'How Pieces Connect', text: intuition, icon: 'flow' },
        { step: 4, title: 'End Result', text: s3, icon: 'result' }
      ],
      graph: {
        title: `Visual Map: ${docTitle.slice(0, 36)}`,
        nodes: graphNodes,
        edges: graphEdges
      },
      checkQuestion: {
        question: `In your own words, what main problem is "${concept?.name || topExcerpt?.heading}" trying to solve?`,
        hint: `Think back to the story beat: ${analogy.slice(0, 90)}...`
      },
      citations: retrieved.citations,
      usedGrok: false,
      aiError
    };
  }

  if (stage === 2) {
    const skeleton = retrieved.scopedConcepts
      .slice(0, 4)
      .map(c => `${c.name}: ${c.summary}`);
    return {
      stage: 2,
      stageTitle,
      headline: `Core Principles (${docTitle.slice(0, 32)})`,
      narrative: `Here is the plain-language skeleton before diving into technical details.`,
      layers: {
        skeleton: skeleton.length > 0 ? skeleton : [s1, s2, s3],
        mechanism: concept?.chunks[0]?.normal.mechanics || `${s1} ${s2}`,
        formula: concept?.chunks[0]?.normal.keyFormulas || '',
        nuance: concept?.chunks[0]?.deep.edgeCases || s3
      },
      graph: {
        title: 'Principle Flow',
        nodes: graphNodes,
        edges: graphEdges
      },
      checkQuestion: {
        question: `Quick check: Why can't we skip "${concept?.name || 'the first principle'}" when moving to "${concept2?.name || 'the next idea'}"?`,
        hint: concept?.priorityReason || s2
      },
      citations: retrieved.citations,
      usedGrok: false,
      aiError
    };
  }

  if (stage === 3) {
    const ex = concept?.examples[0];
    return {
      stage: 3,
      stageTitle,
      headline: ex?.title || `Worked Example from ${docTitle.slice(0, 28)}`,
      narrative: `Let's trace one concrete case straight from the material rather than abstract rules.`,
      workedExample: {
        title: ex?.title || topExcerpt?.heading || 'Case Walkthrough',
        steps: [
          `1. Context: ${ex?.scenario || s1}`,
          `2. Mechanism applied: ${concept?.chunks[0]?.normal.mechanics || s2}`,
          `3. Outcome: ${ex?.breakdown || s3}`
        ],
        whyQuestion: `Why does Step 2 lead to the result in Step 3—and what would break if Step 2 were skipped?`,
        hint: concept?.chunks[0]?.keyTakeaway || s2
      },
      citations: retrieved.citations,
      usedGrok: false,
      aiError
    };
  }

  if (stage === 4) {
    const isAttempt =
      userMessage.trim().length > 20 &&
      !/^(next|stage|teach|start|continue|skip)/i.test(userMessage.trim());

    if (!isAttempt) {
      return {
        stage: 4,
        stageTitle,
        headline: 'Feynman Teach-Back',
        narrative: `Close your notes for a moment and teach "${concept?.name || docTitle}" back to me like I'm 12 years old. Type or use the mic button below.`,
        teachBackPrompt: `Explain "${concept?.name || topExcerpt?.heading}" in 2–4 plain sentences using your own words.`,
        citations: retrieved.citations,
        usedGrok: false,
        aiError
      };
    }

    // Audit user's teach-back strictly against retrieved context keywords
    const contextWords = Array.from(
      new Set(
        retrieved.contextText
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter(w => w.length > 5)
      )
    ).slice(0, 20);

    const lowerAttempt = userMessage.toLowerCase();
    const matched = contextWords.filter(w => lowerAttempt.includes(w));
    const missing = contextWords.filter(w => !lowerAttempt.includes(w)).slice(0, 3);
    const passed = matched.length >= 2 && userMessage.trim().length >= 45;

    return {
      stage: 4,
      stageTitle,
      headline: passed ? 'Teach-Back Verified' : 'Teach-Back Feedback (Hints Only)',
      narrative: passed
        ? `Solid explanation! You captured the core cause-and-effect in your own words.`
        : `Good start—let's tighten one causal link against the source material before moving on.`,
      teachBackPrompt: passed
        ? 'Ready for Stage 5 Spaced Recall whenever you are.'
        : 'Try refining your explanation with the hint below (no peeking at the PDF!).',
      teachBackAudit: {
        understoodWell:
          matched.length > 0
            ? [`Connected key ideas (${matched.slice(0, 3).join(', ')}) in plain language.`]
            : ['You started framing the problem in your own words.'],
        missingOrUnclear: passed
          ? []
          : [
              `Missing specific link to: ${concept?.chunks[0]?.keyTakeaway || s2.slice(0, 90)}`
            ],
        hintToFix: `Hint: Think about how ${missing[0] || 'the core mechanism'} affects the outcome described around page ${topExcerpt?.page || 1}.`,
        passed
      },
      citations: retrieved.citations,
      usedGrok: false,
      aiError
    };
  }

  // Stage 5: Spaced Recall Pack (6 mixed application questions across 1d, 3d, 7d)
  const scopedList = retrieved.scopedConcepts;
  const cA = scopedList[0] || concept;
  const cB = scopedList[1] || cA;
  const cC = scopedList[2] || cB;

  const spacedQuestions = [
    {
      id: 'sr-1',
      daySchedule: '1d' as const,
      topic: cA?.name || topExcerpt?.heading || 'Core Idea',
      question: cA?.assessment[1]?.question || `What key idea does "${topExcerpt?.heading || docTitle}" explain?`,
      hint: s1.slice(0, 110),
      answer: `${s1} ${s2 !== s1 ? s2 : ''}`.trim()
    },
    {
      id: 'sr-2',
      daySchedule: '1d' as const,
      topic: cB?.name || secondExcerpt?.heading || 'Mechanism',
      question: cB?.assessment[0]?.question || `How does the mechanism in "${secondExcerpt?.heading || docTitle}" work?`,
      hint: s2.slice(0, 110),
      answer: s2
    },
    {
      id: 'sr-3',
      daySchedule: '3d' as const,
      topic: cA?.name || 'Application',
      question: cA?.assessment[2]?.question || `Where would you apply "${topExcerpt?.heading || docTitle}" in practice?`,
      hint: s3.slice(0, 110),
      answer: s3
    },
    {
      id: 'sr-4',
      daySchedule: '3d' as const,
      topic: cC?.name || 'Connections',
      question: `How does "${topExcerpt?.heading || 'the first idea'}" connect to "${secondExcerpt?.heading || 'later sections'}"?`,
      hint: s4.slice(0, 110),
      answer: s4
    },
    {
      id: 'sr-5',
      daySchedule: '7d' as const,
      topic: cB?.name || 'Edge Case',
      question: cB?.assessment[2]?.question || `What limitation or condition must hold for "${topExcerpt?.heading || docTitle}"?`,
      hint: s5.slice(0, 110),
      answer: s5
    },
    {
      id: 'sr-6',
      daySchedule: '7d' as const,
      topic: cC?.name || 'Transfer',
      question: `In 1–2 sentences, explain the main takeaway of "${docTitle}" to a beginner.`,
      hint: s6.slice(0, 110),
      answer: s6
    }
  ];

  return {
    stage: 5,
    stageTitle,
    headline: `Spaced Recall Pack: ${docTitle.slice(0, 34)}`,
    narrative: `6 brief application prompts scheduled for Day 1, Day 3, and Day 7.`,
    spacedQuestions,
    citations: retrieved.citations,
    usedGrok: false,
    aiError
  };
}

/**
 * AI Short-Answer Grader (uses Grok when available, keyword rubric fallback otherwise)
 */
export async function gradeShortAnswerQuestion(
  question: string,
  rubric: string,
  userAnswer: string
): Promise<{
  score: number;
  isPassing: boolean;
  feedback: string;
}> {
  const cleanAns = userAnswer.trim();

  if (cleanAns.length < 8) {
    return {
      score: 15,
      isPassing: false,
      feedback: 'Too short to check understanding. Try explaining the cause-and-effect in 1–2 sentences.'
    };
  }

  const grokGrade = await callGrokJson<{ score: number; isPassing: boolean; feedback: string }>({
    systemPrompt:
      'Grade the student answer strictly against the rubric. Give a brief hint-style explanation (never just dump jargon). Return JSON: {"score":0-100,"isPassing":boolean,"feedback":"1-2 crisp sentences"}.',
    userPrompt: `Question: ${question}\nRubric: ${rubric}\nStudent Answer: ${cleanAns}`,
    maxTokens: 180
  });

  if (grokGrade.ok && grokGrade.data && typeof grokGrade.data.score === 'number') {
    return {
      score: Math.max(0, Math.min(100, Math.round(grokGrade.data.score))),
      isPassing: Boolean(grokGrade.data.isPassing),
      feedback: grokGrade.data.feedback || 'Evaluated against source rubric.'
    };
  }

  const lowerAns = cleanAns.toLowerCase();
  const rubricWords = rubric
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .split(' ')
    .filter(w => w.length > 4);

  let matchCount = 0;
  for (const word of rubricWords) {
    if (lowerAns.includes(word)) matchCount++;
  }

  const ratio = rubricWords.length > 0 ? matchCount / rubricWords.length : 0.5;
  const score = cleanAns.length > 45 && ratio >= 0.25 ? Math.min(100, Math.round(72 + ratio * 28)) : 48;

  return {
    score,
    isPassing: score >= 70,
    feedback:
      score >= 70
        ? 'Good understanding! You connected the core mechanism cleanly.'
        : 'Close—review how the key steps cause the outcome and try again.'
  };
}
