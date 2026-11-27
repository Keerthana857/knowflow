import React, { useState } from 'react';
import { Target, CheckCircle2, XCircle, AlertTriangle, RefreshCw, ArrowRight, Award } from 'lucide-react';

export default function QuizView({ onReturnToGraph }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const sampleQuestion = {
    concept: 'Loss Functions & Gradients',
    question: 'Suppose your model\'s loss is decreasing very slowly, but gradient values are non-zero and stable. What is the most likely diagnosis and remedy?',
    options: [
      { id: 'A', text: 'The learning rate is too low; increase it or use an adaptive optimizer like Adam.' },
      { id: 'B', text: 'The loss function has exploded; immediately multiply the weights by zero.' },
      { id: 'C', text: 'You reached a global minimum; further training is impossible.' },
      { id: 'D', text: 'The dataset has zero entropy; remove all training labels.' }
    ],
    correctAnswer: 'A',
    explanation: 'Non-zero stable gradients with negligible loss decrease typically indicate tiny step sizes (under-sized learning rate) traversing a relatively flat loss landscape. Increasing the learning rate or adopting adaptive moment estimation (Adam) accelerates convergence.'
  };

  const handleSelect = (id) => {
    if (!hasSubmitted) {
      setSelectedOption(id);
    }
  };

  const handleSubmit = () => {
    if (selectedOption) {
      setHasSubmitted(true);
    }
  };

  const isCorrect = selectedOption === sampleQuestion.correctAnswer;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <Target color="var(--accent-rose)" size={24} />
            Diagnostic Understanding & Knowledge Gap Engine
          </h2>
          <p style={{ fontSize: '0.875rem' }}>
            Testing conceptual depth, detecting structural weak points, and recalculating your learning order.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className="badge badge-emerald">Diagnostic Active</span>
        </div>
      </div>

      <div className="grid-2">
        {/* Left Column: Interactive Quiz Question */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className="badge badge-indigo">
                {sampleQuestion.concept}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Question 1 of 3
              </span>
            </div>

            <h3 style={{ fontSize: '1.05rem', lineHeight: 1.5, marginBottom: '1.25rem', color: '#fff' }}>
              {sampleQuestion.question}
            </h3>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sampleQuestion.options.map((option) => {
                let borderStyle = '1px solid var(--border-color)';
                let bgStyle = 'var(--bg-primary)';

                if (selectedOption === option.id) {
                  borderStyle = '1px solid var(--accent-primary)';
                  bgStyle = 'rgba(99, 102, 241, 0.15)';
                }

                if (hasSubmitted) {
                  if (option.id === sampleQuestion.correctAnswer) {
                    borderStyle = '1px solid #10b981';
                    bgStyle = 'rgba(16, 185, 129, 0.15)';
                  } else if (selectedOption === option.id) {
                    borderStyle = '1px solid #f43f5e';
                    bgStyle = 'rgba(244, 63, 94, 0.15)';
                  }
                }

                return (
                  <div
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: borderStyle,
                      backgroundColor: bgStyle,
                      cursor: hasSubmitted ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#fff'
                    }}>
                      {option.id}
                    </div>
                    <span style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>
                      {option.text}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Answer Explanation */}
            {hasSubmitted && (
              <div style={{
                marginTop: '1.25rem',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                border: isCorrect ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  {isCorrect ? (
                    <>
                      <CheckCircle2 size={18} color="#10b981" />
                      <strong style={{ color: '#6ee7b7', fontSize: '0.9rem' }}>Correct Conceptual Reasoning!</strong>
                    </>
                  ) : (
                    <>
                      <XCircle size={18} color="#f43f5e" />
                      <strong style={{ color: '#fda4af', fontSize: '0.9rem' }}>Conceptual Misconception Identified</strong>
                    </>
                  )}
                </div>
                <p style={{ fontSize: '0.825rem', color: '#d1d5db', margin: 0, lineHeight: 1.5 }}>
                  {sampleQuestion.explanation}
                </p>
              </div>
            )}
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            {!hasSubmitted ? (
              <button
                className="btn btn-primary"
                disabled={!selectedOption}
                onClick={handleSubmit}
                style={{ width: '100%', justifyContent: 'center', opacity: selectedOption ? 1 : 0.5 }}
              >
                Submit for Diagnostic Evaluation
              </button>
            ) : (
              <button
                className="btn btn-secondary"
                onClick={() => { setHasSubmitted(false); setSelectedOption(null); }}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <RefreshCw size={15} /> Try Question Again
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Knowledge Gap Matrix & Adaptive Path Recalibration */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Award size={18} color="var(--accent-amber)" />
              Real-Time Mastery & Gap Tracker
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              How the system tracks what you've internalized vs where cognitive gaps exist.
            </p>
          </div>

          {/* Breakdown Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{
              padding: '0.85rem',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>1. Linear Algebra & Vectors</span>
                <span className="badge badge-emerald">95% Internalized</span>
              </div>
              <p style={{ fontSize: '0.75rem', margin: 0 }}>Solid bedrock foundation. No prerequisites needed.</p>
            </div>

            <div style={{
              padding: '0.85rem',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>2. Loss Functions & Gradients</span>
                <span className="badge badge-amber">{hasSubmitted && isCorrect ? '85% Internalized' : '65% Developing'}</span>
              </div>
              <p style={{ fontSize: '0.75rem', margin: 0 }}>Core intuition verified via diagnostic probe.</p>
            </div>

            <div style={{
              padding: '0.85rem',
              backgroundColor: 'rgba(244, 63, 94, 0.08)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(244, 63, 94, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fda4af', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <AlertTriangle size={14} color="#f43f5e" /> 4. Backpropagation Chain Rule
                </span>
                <span className="badge badge-rose">30% Gap Alert</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#fca5a5', margin: 0 }}>
                High-risk gap: Multivariable chain rule was missed. System temporarily deprioritizes Step 5 until gap is repaired.
              </p>
            </div>
          </div>

          {/* Adaptive Engine Decision Box */}
          <div style={{
            marginTop: 'auto',
            padding: '1rem',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              🧠 Adaptive Engine Action
            </div>
            <p style={{ fontSize: '0.8rem', color: '#e0e7ff', marginBottom: '0.85rem' }}>
              {hasSubmitted && isCorrect
                ? 'Great job! Your mastery score increased. Recommended next step: Proceed to Matrix Multiplications.'
                : 'Adaptive engine has inserted a quick 2-minute refresher on Multivariable Derivatives before advancing to Backpropagation.'}
            </p>
            <button
              className="btn btn-secondary"
              onClick={onReturnToGraph}
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.825rem' }}
            >
              <span>View Updated Knowledge Graph</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
