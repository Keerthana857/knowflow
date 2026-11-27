export type MasteryStatus = 'not_started' | 'weak' | 'in_progress' | 'mastered';

export type PriorityTier = 'high' | 'medium' | 'low';

export type EdgeRelationshipType = 'prerequisite' | 'supports' | 'contradicts' | 'extends';

export type CognitiveDepthMode = 'simple' | 'normal' | 'deep';

export type QuestionLevel = 'recall' | 'conceptual' | 'application';

export type QuestionType = 'mcq' | 'short_answer';

export type TutorStage = 1 | 2 | 3 | 4 | 5;

export interface LibraryFolder {
  id: string;
  name: string;
  createdAt: string;
}

export interface DocumentExcerpt {
  id: string;
  page: number;
  heading: string;
  text: string;
}

export interface StoryBeat {
  step: number;
  title: string;
  text: string;
  icon: 'problem' | 'spark' | 'flow' | 'result';
}

export interface VisualGraphNode {
  id: string;
  label: string;
  sublabel?: string;
}

export interface VisualGraphEdge {
  from: string;
  to: string;
  label?: string;
}

export interface VisualGraphData {
  title: string;
  nodes: VisualGraphNode[];
  edges: VisualGraphEdge[];
}

export interface SpacedQuestion {
  id: string;
  daySchedule: '1d' | '3d' | '7d';
  topic: string;
  question: string;
  hint: string;
  answer: string;
}

export interface ConceptExample {
  title: string;
  scenario: string;
  breakdown: string;
}

export interface ConceptChunk {
  id: string;
  index: number;
  title: string;
  coreIdea: string;
  simple: {
    intuition: string;
    analogy: string;
    plainEnglish: string;
  };
  normal: {
    mechanics: string;
    keyFormulas: string;
    structuredExplanation: string;
  };
  deep: {
    formalDefinition: string;
    edgeCases: string;
    researchNuance: string;
  };
  keyTakeaway: string;
}

export interface AssessmentQuestion {
  id: string;
  level: QuestionLevel;
  question: string;
  type: QuestionType;
  options?: { id: string; text: string }[];
  correctOptionId?: string;
  hint?: string;
  rubricExplanation: string;
  sampleIdealAnswer?: string;
}

export interface ContextualRevision {
  prerequisiteConceptId: string;
  prerequisiteConceptName: string;
  bridgeExplanation: string;
  quickVerificationQuestion: {
    question: string;
    options: { id: string; text: string }[];
    correctOptionId: string;
    explanation: string;
  };
}

export interface Concept {
  id: string;
  name: string;
  summary: string;
  importance: number;
  difficulty: number;
  estimatedMinutes: number;
  prerequisites: string[];
  userMastery: number;
  status: MasteryStatus;
  priorityScore: number;
  priorityTier: PriorityTier;
  priorityReason: string;
  sourceDocumentId: string;
  sourceSection: string;
  examples: ConceptExample[];
  chunks: ConceptChunk[];
  assessment: AssessmentQuestion[];
  contextualRevision?: ContextualRevision;
}

export interface RelationshipEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeRelationshipType;
  label: string;
  aiConnectionExplanation: string;
}

export interface EvidenceClaim {
  id: string;
  topic: string;
  claim: string;
  methodology: string;
  evidenceStrength: 'Strong Empirical' | 'Moderate' | 'Theoretical' | 'Contested';
  limitations: string;
  sourcePaperId: string;
  sourcePaperTitle: string;
  citation: string;
  contradictsClaimId?: string;
  contradictionDetails?: {
    conflictNature: string;
    underlyingAssumption: string;
    resolutionHypothesis: string;
  };
}

export interface StudyScheduleItem {
  conceptId: string;
  conceptName: string;
  allocatedMinutes: number;
  mode: 'deep' | 'normal' | 'crunch';
  priorityRank: number;
  priorityTier: PriorityTier;
  prerequisitesMet: boolean;
  status: 'scheduled' | 'active' | 'completed' | 'deferred';
  reason: string;
}

export interface DocumentSource {
  id: string;
  folderId: string;
  sourceType?: 'pdf' | 'pasted';
  title: string;
  authors: string;
  year: number;
  abstract: string;
  pageCount: number;
  fileSize: string;
  uploadDate: string;
  keyStance: string;
  excerpts?: DocumentExcerpt[];
}

export interface TutorResponsePayload {
  stage: TutorStage;
  stageTitle: string;
  headline: string;
  narrative: string;
  storyBeats?: StoryBeat[];
  graph?: VisualGraphData;
  layers?: {
    skeleton: string[];
    mechanism: string;
    formula?: string;
    nuance: string;
  };
  workedExample?: {
    title: string;
    steps: string[];
    whyQuestion: string;
    hint: string;
  };
  teachBackPrompt?: string;
  teachBackAudit?: {
    understoodWell: string[];
    missingOrUnclear: string[];
    hintToFix: string;
    passed: boolean;
  };
  spacedQuestions?: SpacedQuestion[];
  checkQuestion?: {
    question: string;
    hint: string;
  };
  citations: string[];
  usedGrok: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tutorData?: TutorResponsePayload;
}

export interface WorkspaceState {
  id: string;
  name: string;
  availableTimeBudgetMinutes: number;
  crunchModeActive: boolean;
  learningStreakDays: number;
  folders: LibraryFolder[];
  activeFolderId: string | null;
  activeDocumentId: string | null;
  documents: DocumentSource[];
  concepts: Concept[];
  edges: RelationshipEdge[];
  claims: EvidenceClaim[];
  schedule: StudyScheduleItem[];
  activeConceptId: string | null;
  creditSaverMode?: boolean;
  audioSpeed?: number;
}
