'use client';

import React, { useState } from 'react';
import { Concept, CognitiveDepthMode } from '../types';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface MicroChunkViewProps {
  concept: Concept;
  onStartActiveVerification: () => void;
  onBackToMap: () => void;
}

export default function MicroChunkView({
  concept,
  onStartActiveVerification,
  onBackToMap,
}: MicroChunkViewProps) {
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [depthMode, setDepthMode] = useState<CognitiveDepthMode>('normal');

  const chunks = concept.chunks || [];
  const currentChunk = chunks[currentChunkIndex] || {
    id: 'placeholder',
    index: 1,
    title: 'Core Concept Principle',
    coreIdea: concept.summary,
    simple: { intuition: concept.summary, analogy: 'Intuitive grounding', plainEnglish: concept.summary },
    normal: { mechanics: 'Step by step breakdown', keyFormulas: '', structuredExplanation: 'Detailed breakdown' },
    deep: { formalDefinition: '', edgeCases: '', researchNuance: '' },
    keyTakeaway: 'Core concept to retain.'
  };

  return (
    <div className="max-w-3xl mx-auto py-4 px-4 sm:px-0 space-y-6">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <button onClick={onBackToMap} className="flex items-center gap-1 hover:text-gray-900 transition">
          <ArrowLeft size={13} /> Back to Map
        </button>
        <span>Topic: {concept.name}</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-xs text-gray-400 block mb-1">Concept Explanation</span>
          <h1 className="text-2xl font-bold text-gray-900">{concept.name}</h1>
        </div>

        {/* Depth Toggles */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs w-fit">
          <button
            onClick={() => setDepthMode('simple')}
            className={`px-3 py-1 rounded font-medium transition ${
              depthMode === 'simple' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
            }`}
          >
            Simple
          </button>
          <button
            onClick={() => setDepthMode('normal')}
            className={`px-3 py-1 rounded font-medium transition ${
              depthMode === 'normal' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setDepthMode('deep')}
            className={`px-3 py-1 rounded font-medium transition ${
              depthMode === 'deep' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
            }`}
          >
            Deep
          </button>
        </div>

        {/* Content */}
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 leading-relaxed">
          {currentChunk.coreIdea}
        </div>

        {depthMode === 'simple' && (
          <div className="p-3 bg-[#F0EFFF] rounded-lg text-xs text-gray-800">
            <strong>Analogy: </strong>&ldquo;{currentChunk.simple.analogy}&rdquo;
          </div>
        )}

        {depthMode === 'normal' && (
          <div className="space-y-2 text-xs text-gray-700 leading-relaxed">
            <p>{currentChunk.normal.mechanics}</p>
            {currentChunk.normal.keyFormulas && (
              <div className="p-2.5 bg-gray-50 rounded font-mono border border-gray-200">
                {currentChunk.normal.keyFormulas}
              </div>
            )}
          </div>
        )}

        {depthMode === 'deep' && (
          <div className="space-y-2 text-xs text-gray-700 leading-relaxed">
            <p>{currentChunk.deep.formalDefinition}</p>
            <p>{currentChunk.deep.edgeCases}</p>
          </div>
        )}

        <div className="p-3 bg-emerald-50 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          <span><strong>Takeaway: </strong>{currentChunk.keyTakeaway}</span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            onClick={() => setCurrentChunkIndex(c => Math.max(0, c - 1))}
            disabled={currentChunkIndex === 0}
            className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-40"
          >
            Previous
          </button>

          {currentChunkIndex < chunks.length - 1 ? (
            <button
              onClick={() => setCurrentChunkIndex(c => c + 1)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded-lg"
            >
              Next Part
            </button>
          ) : (
            <button
              onClick={onStartActiveVerification}
              className="px-4 py-2 bg-[#5E5CE6] hover:bg-[#4E4CD4] text-white text-xs font-medium rounded-lg"
            >
              Take Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
