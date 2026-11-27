import React, { useState } from 'react';
import { BookOpen, Zap, Layers, Microscope, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

export default function LearnView({ onProceedToQuiz }) {
  const [mode, setMode] = useState('normal'); // 'quick' | 'normal' | 'deep'
  const [currentChunk, setCurrentChunk] = useState(0);

  const chunks = [
    {
      title: 'Chunk 1: The Core Mental Model',
      quick: 'Loss functions measure the mathematical gap between your model\'s prediction and ground truth reality. The gradient is the slope pointing towards greater error; moving in the opposite direction reduces error.',
      normal: 'Imagine you are blindfolded on a foggy hillside and want to reach the lowest valley floor (minimum loss). You can feel the slope of the ground with your feet (the gradient). Moving in the direction of steepest descent guarantees you make progress downwards, provided your step size (learning rate) is not too large.',
      deep: 'Mathematically, for a parameter vector θ and loss L(θ), the gradient ∇L(θ) contains partial derivatives [∂L/∂θ₁, ∂L/∂θ₂, ...]. Under Convexity conditions, following -∇L converges to a global minimum. In deep neural nets with non-convex landscapes, saddle points and plateaus require momentum and adaptive learning rates (e.g., AdamW) to escape vanishing gradients.',
      takeaway: 'Gradient descent is hill-climbing in reverse: measure slope, step opposite.'
    },
    {
      title: 'Chunk 2: The Critical Hyperparameter (Learning Rate)',
      quick: 'Step size matters most. Too large = you overshoot the valley and explode. Too small = training takes forever and stalls.',
      normal: 'Your learning rate (η) dictates step magnitude. If η is too high (e.g., 10.0), your steps leap across the canyon walls and oscillate uncontrollably. If η is too low (e.g., 0.000001), 10,000 steps barely move you past the first rock. Modern practitioners use learning rate warmup followed by cosine decay.',
      deep: 'The Hessian matrix H (second derivatives) governs curvature. If the maximum eigenvalue λ_max of H exceeds 2/η, gradient descent diverges. Adaptive optimizers like RMSprop and Adam maintain running estimates of first and second moments to normalize step sizes along ill-conditioned ravines.',
      takeaway: 'Optimal step size balances rapid convergence against numerical instability.'
    },
    {
      title: 'Chunk 3: Connection to Upcoming Topics',
      quick: 'Once you understand single gradients, Backpropagation simply applies the calculus Chain Rule backwards across millions of layers.',
      normal: 'A neural network is just a giant composite function: f(g(h(x))). When the output makes a mistake, how much blame does layer 1 get vs layer 5? The Chain Rule traces the blame backward step by step. That is backpropagation.',
      deep: 'In computational graphs, reverse-mode automatic differentiation computes all parameter gradients in O(1) passes relative to the forward pass, whereas naive symbolic differentiation would scale exponentially in graph depth.',
      takeaway: 'Backpropagation is simply applying gradients recursively backwards through composite functions.'
    }
  ];

  const current = chunks[currentChunk];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header & Depth Switcher */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-amber">Concept 2 of 5</span>
            <h2 style={{ fontSize: '1.35rem', margin: 0, color: '#fff' }}>
              Loss Functions & Gradients
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', margin: 0 }}>
            Structured, bite-sized cognitive chunking designed for long-term retention.
          </p>
        </div>

        {/* 3-Mode Selector */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-primary)',
          padding: '0.35rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          gap: '0.25rem'
        }}>
          <button
            onClick={() => setMode('quick')}
            className="btn"
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.8rem',
              borderRadius: '6px',
              backgroundColor: mode === 'quick' ? 'var(--accent-cyan)' : 'transparent',
              color: mode === 'quick' ? '#000' : 'var(--text-muted)',
              fontWeight: 600
            }}
          >
            <Zap size={14} /> Quick (2m)
          </button>
          <button
            onClick={() => setMode('normal')}
            className="btn"
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.8rem',
              borderRadius: '6px',
              backgroundColor: mode === 'normal' ? 'var(--accent-primary)' : 'transparent',
              color: mode === 'normal' ? '#fff' : 'var(--text-muted)',
              fontWeight: 600
            }}
          >
            <Layers size={14} /> Normal (5m)
          </button>
          <button
            onClick={() => setMode('deep')}
            className="btn"
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.8rem',
              borderRadius: '6px',
              backgroundColor: mode === 'deep' ? '#8b5cf6' : 'transparent',
              color: mode === 'deep' ? '#fff' : 'var(--text-muted)',
              fontWeight: 600
            }}
          >
            <Microscope size={14} /> Deep (12m)
          </button>
        </div>
      </div>

      {/* Main Chunk Reader */}
      <div className="grid-2">
        {/* Left Column: Chunk Content */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Chunk Step Indicator */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {chunks.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentChunk(idx)}
                  style={{
                    flex: 1,
                    height: '6px',
                    borderRadius: '9999px',
                    backgroundColor: idx === currentChunk ? 'var(--accent-primary)' : idx < currentChunk ? '#10b981' : 'var(--border-color)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  title={`Go to chunk ${idx + 1}`}
                />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>
                {current.title}
              </h3>
              <span className="badge badge-indigo">
                Chunk {currentChunk + 1} of {chunks.length}
              </span>
            </div>

            {/* Mode-specific text */}
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              marginBottom: '1.25rem',
              lineHeight: 1.7,
              fontSize: '0.95rem',
              color: '#e2e8f0'
            }}>
              {mode === 'quick' && (
                <div>
                  <div style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    ⚡ Rapid Synthesis Mode
                  </div>
                  {current.quick}
                </div>
              )}
              {mode === 'normal' && (
                <div>
                  <div style={{ color: '#a5b4fc', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    📖 Guided Conceptual Breakdown
                  </div>
                  {current.normal}
                </div>
              )}
              {mode === 'deep' && (
                <div>
                  <div style={{ color: '#c084fc', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    🔬 Deep Mathematical & Practical Formalism
                  </div>
                  {current.deep}
                </div>
              )}
            </div>

            {/* Core Key Takeaway */}
            <div style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderLeft: '4px solid #10b981',
              borderRadius: '0 8px 8px 0',
              fontSize: '0.85rem',
              color: '#d1fae5'
            }}>
              <strong>Key Principle:</strong> {current.takeaway}
            </div>
          </div>

          {/* Navigation Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '2rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)'
          }}>
            <button
              className="btn btn-secondary"
              disabled={currentChunk === 0}
              onClick={() => setCurrentChunk(c => c - 1)}
              style={{ opacity: currentChunk === 0 ? 0.4 : 1 }}
            >
              Previous Chunk
            </button>

            {currentChunk < chunks.length - 1 ? (
              <button
                className="btn btn-primary"
                onClick={() => setCurrentChunk(c => c + 1)}
              >
                Next Chunk <ChevronRight size={16} />
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={onProceedToQuiz}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                <CheckCircle2 size={16} /> Mark Chunked Read Complete & Test
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Active Learning Companion */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HelpCircle size={18} color="var(--accent-primary)" />
            Active Self-Check Reflection
          </h3>

          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <p style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>
              Q: If your gradient magnitude is approaching zero, what does that mean?
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Think before checking: You are either at a local minimum, a local maximum, or a saddle point plateau.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
              Internalization Metrics
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span>Chunk Progression</span>
                  <span>{Math.round(((currentChunk + 1) / chunks.length) * 100)}%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--bg-primary)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${((currentChunk + 1) / chunks.length) * 100}%`,
                    height: '100%',
                    backgroundColor: 'var(--accent-primary)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span>Prerequisite Confidence</span>
                  <span style={{ color: '#10b981' }}>Strong (95%)</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--bg-primary)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: '95%', height: '100%', backgroundColor: '#10b981' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 'auto',
            padding: '1rem',
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a5b4fc', marginBottom: '0.25rem' }}>
              Ready to verify retention?
            </div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Summaries make you feel like you know it. Our interactive quiz proves whether you really internalized it.
            </p>
            <button
              className="btn btn-outline"
              onClick={onProceedToQuiz}
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.825rem' }}
            >
              Jump to Diagnostic Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
