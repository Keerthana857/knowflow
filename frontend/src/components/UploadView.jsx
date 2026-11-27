import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, ArrowRight, Cpu, Network, Layers, HelpCircle } from 'lucide-react';

export default function UploadView({ onProceedToGraph }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | selected | simulated

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadStatus('selected');
    }
  };

  const handleSimulate = () => {
    setUploadStatus('simulated');
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero Welcome Box */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.9), rgba(17, 24, 39, 0.95))',
        borderLeft: '4px solid var(--accent-primary)'
      }}>
        <div style={{ maxWidth: '850px' }}>
          <h2 style={{ fontSize: '1.65rem', marginBottom: '0.5rem', color: '#ffffff' }}>
            Transform Complex Study Material into Mastery
          </h2>
          <p style={{ fontSize: '0.975rem', lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Ordinary summaries give you an illusion of competence without true retention. 
            <strong> Rapid Knowledge Internalization</strong> extracts core principles, maps prerequisite dependencies into an 
            interactive knowledge graph, delivers multi-depth chunked learning, and tests real understanding to eliminate blind spots.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span className="badge badge-indigo">PyMuPDF Ingestion</span>
            <span className="badge badge-emerald">Gemini Prerequisite Graph</span>
            <span className="badge badge-amber">3-Depth Chunking</span>
            <span className="badge badge-rose">Adaptive Gap Repair</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload Dropzone + Document Card */}
      <div className="grid-2">
        {/* Upload Dropzone */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud size={20} color="var(--accent-primary)" />
            Upload Study Material (PDF)
          </h3>

          <label
            htmlFor="pdf-upload"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2.5rem 1.5rem',
              border: '2px dashed var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              backgroundColor: 'rgba(31, 41, 55, 0.4)',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}
          >
            <div style={{
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              padding: '1rem',
              borderRadius: '50%',
              marginBottom: '1rem'
            }}>
              <UploadCloud size={32} color="var(--accent-primary)" />
            </div>
            <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Click to browse or drop your PDF here
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Supports textbooks, research papers, course lecture slides (Max 25 MB)
            </p>
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>

          {selectedFile && (
            <div style={{
              marginTop: '1.25rem',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <FileText size={20} color="#10b981" />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for PyMuPDF processing
                  </div>
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleSimulate}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
              >
                Analyze Document
              </button>
            </div>
          )}
        </div>

        {/* Pipeline Status / Architecture Explanation Card */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.85rem' }}>
            System Processing Pipeline
          </h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            How our backend pipeline converts raw documents into an adaptive internalization path:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <div style={{
                background: 'rgba(99, 102, 241, 0.2)',
                padding: '0.5rem',
                borderRadius: '8px',
                color: '#a5b4fc'
              }}>
                <Cpu size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>1. PyMuPDF Text Extraction</strong>
                <p style={{ fontSize: '0.8rem', margin: 0 }}>
                  Extracts structured text streams, section headers, and reading order without formatting loss.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <div style={{
                background: 'rgba(6, 182, 212, 0.2)',
                padding: '0.5rem',
                borderRadius: '8px',
                color: '#67e8f9'
              }}>
                <Network size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>2. Gemini Knowledge Graph & Prerequisites</strong>
                <p style={{ fontSize: '0.8rem', margin: 0 }}>
                  Identifies foundational nodes, concept dependencies, and optimal learning topological order.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <div style={{
                background: 'rgba(245, 158, 11, 0.2)',
                padding: '0.5rem',
                borderRadius: '8px',
                color: '#fcd34d'
              }}>
                <Layers size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>3. Multi-Depth Chunking Engine</strong>
                <p style={{ fontSize: '0.8rem', margin: 0 }}>
                  Synthesizes Quick Learn (tldr), Normal Learn (structured), and Deep Learn (rigorous edge-cases).
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <div style={{
                background: 'rgba(244, 63, 94, 0.2)',
                padding: '0.5rem',
                borderRadius: '8px',
                color: '#fda4af'
              }}>
                <HelpCircle size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>4. Adaptive Quiz & Gap Elimination</strong>
                <p style={{ fontSize: '0.8rem', margin: 0 }}>
                  Generates conceptual probes, scores mastery, and auto-adapts your study priority queue.
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button
              className="btn btn-secondary"
              onClick={onProceedToGraph}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>Explore Interactive Knowledge Graph</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
