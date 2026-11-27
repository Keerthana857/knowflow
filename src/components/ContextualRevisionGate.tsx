'use client';

import React, { useState } from 'react';
import { Concept, ContextualRevision } from '../types';
import { ShieldAlert, Zap, CheckCircle2, XCircle, ArrowRight, BookOpen } from 'lucide-react';

interface ContextualRevisionGateProps {
  targetConcept: Concept;
  unmetPrerequisite: Concept;
  onUnlocked: () => void;
  onNavigateToPrerequisite: (conceptId: string) => void;
}

export default function ContextualRevisionGate({
  targetConcept,
  unmetPrerequisite,
  onUnlocked,
  onNavigateToPrerequisite
}: ContextualRevisionGateProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState(false);

  // Extract revision data from target concept or synthesize from prerequisite
  const revision: ContextualRevision = targetConcept.contextualRevision || {
    prerequisiteConceptId: unmetPrerequisite.id,
    prerequisiteConceptName: unmetPrerequisite.name,
    bridgeExplanation: `Before diving into ${targetConcept.name}, you need the core insight from ${unmetPrerequisite.name}: ${unmetPrerequisite.summary}`,
    quickVerificationQuestion: {
      question: `What is the core prerequisite principle of ${unmetPrerequisite.name}?`,
      options: [
        { id: 'opt1', text: unmetPrerequisite.chunks[0]?.coreIdea || 'Core theoretical foundation' },
        { id: 'opt2', text: 'Arbitrary unconstrained random parameter initialization' },
        { id: 'opt3', text: 'Legacy static assumption that has been fully deprecated' }
      ],
      correctOptionId: 'opt1',
      explanation: 'Exactly right! Understanding this constraint is essential to prevent cognitive breakdown on the next topic.'
    }
  };

  const handleVerify = () => {
    if (!selectedOption) return;

    if (selectedOption === revision.quickVerificationQuestion.correctOptionId) {
      setIsAnswered(true);
      setErrorFeedback(false);
    } else {
      setErrorFeedback(true);
    }
  };

  return (
    <div className="bg-white border-2 border-[#E05252]/40 rounded-2xl p-6 shadow-xs max-w-2xl mx-auto my-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Header Alert */}
      <div className="flex items-center gap-3 pb-4 border-b border-[#E8ECF2] mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] text-[#E05252] border border-[#FEE2E2] flex items-center justify-center shrink-0">
          <ShieldAlert size={22} />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#E05252] bg-[#FEF2F2] px-2 py-0.5 rounded border border-[#FEE2E2]">
            Prerequisite Gap Intercepted (Feature 5)
          </span>
          <h3 className="text-base font-bold text-[#172033] mt-1">
            Prerequisite Weakness Detected: {unmetPrerequisite.name} ({unmetPrerequisite.userMastery}% Mastery)
          </h3>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-[#64748B] leading-relaxed mb-4">
        Attempting <strong className="text-[#172033]">{targetConcept.name}</strong> without mastering{' '}
        <strong className="text-[#172033]">{unmetPrerequisite.name}</strong> causes high cognitive overload.
        Complete this <strong className="text-[#635BDB]">60-second Micro-Revision</strong> to bridge the gap and unlock the concept.
      </p>

      {/* 60-Second Micro-Revision Card */}
      <div className="bg-[#EEEDFC]/40 p-4 rounded-xl border border-[#D5D1F7] mb-5 relative overflow-hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-[#635BDB] mb-2 uppercase tracking-wider">
          <Zap size={14} />
          60-Second Targeted Refresher
        </div>
        <p className="text-sm text-[#172033] leading-relaxed font-medium">
          {revision.bridgeExplanation}
        </p>
      </div>

      {/* 1-Question Quick Verification */}
      <div className="space-y-3 mb-6">
        <div className="text-xs font-bold text-[#172033]">
          Quick Verification: {revision.quickVerificationQuestion.question}
        </div>

        <div className="space-y-2">
          {revision.quickVerificationQuestion.options.map(option => {
            const isSelected = selectedOption === option.id;
            return (
              <div
                key={option.id}
                onClick={() => !isAnswered && setSelectedOption(option.id)}
                className={`p-3 rounded-xl border text-xs font-medium cursor-pointer transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#EEEDFC] border-2 border-[#635BDB] text-[#172033]'
                    : 'bg-[#F8FAFC] border border-[#E8ECF2] text-[#172033] hover:bg-[#F1F5F9]'
                }`}
              >
                <span>{option.text}</span>
                {isAnswered && option.id === revision.quickVerificationQuestion.correctOptionId && (
                  <CheckCircle2 size={16} className="text-[#16A37A] shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {errorFeedback && !isAnswered && (
          <div className="flex items-center gap-2 text-xs text-[#E05252] bg-[#FEF2F2] p-2.5 rounded-lg border border-[#FEE2E2]">
            <XCircle size={15} />
            <span>Not quite. Review the 60-second summary above and try again.</span>
          </div>
        )}

        {isAnswered && (
          <div className="flex items-center gap-2 text-xs text-[#16A37A] bg-[#F0FDF4] p-2.5 rounded-lg border border-[#BBF7D0]">
            <CheckCircle2 size={15} />
            <span>{revision.quickVerificationQuestion.explanation}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E8ECF2]">
        <button
          onClick={() => onNavigateToPrerequisite(unmetPrerequisite.id)}
          className="text-xs text-[#64748B] hover:text-[#172033] flex items-center gap-1.5 transition py-2"
        >
          <BookOpen size={14} /> Study full prerequisite instead
        </button>

        {!isAnswered ? (
          <button
            onClick={handleVerify}
            disabled={!selectedOption}
            className="px-5 py-2.5 bg-[#635BDB] hover:bg-[#5249C9] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            Verify & Unlock
          </button>
        ) : (
          <button
            onClick={onUnlocked}
            className="px-6 py-2.5 bg-[#16A37A] hover:bg-[#138865] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition animate-bounce"
          >
            <span>Proceed to {targetConcept.name}</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
