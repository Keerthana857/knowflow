'use client';

import React, { useState } from 'react';
import { Concept, AssessmentQuestion, WorkspaceState } from '../types';
import {
  Target,
  CheckCircle2,
  XCircle,
  Award,
  ArrowLeft,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface UnderstandingDetectorProps {
  concept: Concept;
  onEvaluationComplete: (updatedWorkspace: WorkspaceState) => void;
  onBackToChunks: () => void;
}

export default function UnderstandingDetector({
  concept,
  onEvaluationComplete,
  onBackToChunks
}: UnderstandingDetectorProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<{
    newMastery: number;
    questionResults: Array<{
      questionId: string;
      level: string;
      isCorrect: boolean;
      score: number;
      feedback: string;
      explanation: string;
    }>;
  } | null>(null);

  const questions: AssessmentQuestion[] = concept.assessment || [];

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (evaluationResults) return; // locked after submission
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleTextChange = (questionId: string, text: string) => {
    if (evaluationResults) return;
    setAnswers(prev => ({ ...prev, [questionId]: text }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptId: concept.id,
          answers
        })
      });

      if (res.ok) {
        const data = await res.json();
        setEvaluationResults({
          newMastery: data.newMastery,
          questionResults: data.questionResults
        });
        if (data.updatedWorkspace) {
          onEvaluationComplete(data.updatedWorkspace);
        }
      }
    } catch (err) {
      console.error('Evaluation failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormComplete = questions.every(q => {
    const val = answers[q.id];
    return val && val.trim().length > 0;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white border border-[#E8ECF2] rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div>
          <button
            onClick={onBackToChunks}
            className="text-[11px] font-semibold text-[#64748B] hover:text-[#172033] flex items-center gap-1 mb-1.5 transition"
          >
            <ArrowLeft size={12} /> Back to Cognitive Chunks
          </button>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#EEEDFC] text-[#635BDB] border border-[#D5D1F7] flex items-center justify-center">
              <Target size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#172033]">
                Understanding Detector: {concept.name}
              </h2>
              <p className="text-xs text-[#64748B]">
                Active recall across 3 cognitive levels: Recall, Conceptual, and Application.
              </p>
            </div>
          </div>
        </div>

        {evaluationResults && (
          <div className="text-right">
            <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">New Mastery</span>
            <div className={`text-xl font-black ${
              evaluationResults.newMastery >= 85 ? 'text-[#16A37A]' :
              evaluationResults.newMastery >= 50 ? 'text-[#D97706]' : 'text-[#E05252]'
            }`}>
              {evaluationResults.newMastery}%
            </div>
          </div>
        )}
      </div>

      {/* 3 Questions */}
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const result = evaluationResults?.questionResults.find(r => r.questionId === q.id);

          return (
            <div
              key={q.id}
              className={`p-5 rounded-2xl border transition-all ${
                result
                  ? result.isCorrect
                    ? 'bg-white border-2 border-[#16A37A] shadow-xs'
                    : 'bg-white border-2 border-[#E05252] shadow-xs'
                  : 'bg-white border border-[#E8ECF2] shadow-xs'
              }`}
            >
              {/* Question Level Badge */}
              <div className="flex items-center justify-between mb-2.5">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                  q.level === 'recall' ? 'bg-[#EEEDFC] text-[#635BDB] border-[#D5D1F7]' :
                  q.level === 'conceptual' ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]' :
                  'bg-[#FAF5FF] text-[#7C3AED] border-[#E9D5FF]'
                }`}>
                  Level {idx + 1}: {q.level.toUpperCase()}
                </span>

                {result && (
                  <span className={`text-xs font-bold flex items-center gap-1 ${
                    result.isCorrect ? 'text-[#16A37A]' : 'text-[#E05252]'
                  }`}>
                    {result.isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {result.score}%
                  </span>
                )}
              </div>

              {/* Question Text */}
              <h4 className="text-sm font-semibold text-[#172033] mb-3.5 leading-snug">
                {q.question}
              </h4>

              {/* Input Area: MCQ or Short Answer */}
              {q.type === 'mcq' && q.options ? (
                <div className="space-y-2">
                  {q.options.map(opt => {
                    const isSelected = answers[q.id] === opt.id;
                    const isCorrectAnswer = result && opt.id === q.correctOptionId;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(q.id, opt.id)}
                        className={`p-3 rounded-xl border text-xs font-medium cursor-pointer transition flex items-center justify-between ${
                          isCorrectAnswer
                            ? 'bg-[#F0FDF4] border-2 border-[#16A37A] text-[#166534]'
                            : isSelected
                            ? result && !result.isCorrect
                              ? 'bg-[#FEF2F2] border-2 border-[#E05252] text-[#991B1B]'
                              : 'bg-[#EEEDFC] border-2 border-[#635BDB] text-[#172033]'
                            : 'bg-[#F8FAFC] border border-[#E8ECF2] text-[#172033] hover:bg-[#F1F5F9]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-white border border-[#E8ECF2] text-[10px] font-bold text-[#64748B] flex items-center justify-center uppercase">
                            {opt.id}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {isCorrectAnswer && <CheckCircle2 size={16} className="text-[#16A37A] shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Type your structured explanation here (describe the causal mechanism)..."
                    value={answers[q.id] || ''}
                    disabled={!!evaluationResults}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E8ECF2] rounded-xl p-3 text-xs text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#635BDB] focus:bg-white resize-none"
                  />
                  {q.sampleIdealAnswer && evaluationResults && (
                    <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E8ECF2] text-[11px] text-[#64748B]">
                      <strong className="text-[#172033] block mb-0.5">Reference Benchmark Answer:</strong>
                      {q.sampleIdealAnswer}
                    </div>
                  )}
                </div>
              )}

              {/* Result Feedback */}
              {result && (
                <div className="mt-3 pt-3 border-t border-[#E8ECF2] space-y-1">
                  <p className="text-xs text-[#172033] leading-relaxed font-medium">
                    {result.feedback}
                  </p>
                  <p className="text-[11px] text-[#64748B]">
                    <strong className="text-[#172033]">Evaluation Rubric: </strong>
                    {result.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBackToChunks}
          className="text-xs text-[#64748B] hover:text-[#172033] flex items-center gap-1.5 transition"
        >
          <ArrowLeft size={14} /> Review Cognitive Chunks
        </button>

        {!evaluationResults ? (
          <button
            onClick={handleSubmit}
            disabled={!isFormComplete || isSubmitting}
            className="px-6 py-2.5 bg-[#635BDB] hover:bg-[#5249C9] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition"
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Evaluating via AI Rubric...</span>
              </>
            ) : (
              <>
                <Award size={16} />
                <span>Submit Active Verification</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEvaluationResults(null);
                setAnswers({});
              }}
              className="px-4 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E8ECF2] text-[#172033] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
            >
              <RefreshCw size={13} /> Retake Test
            </button>

            <button
              onClick={onBackToChunks}
              className="px-6 py-2 bg-[#635BDB] hover:bg-[#5249C9] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
            >
              <span>Back to Learning Journey</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
