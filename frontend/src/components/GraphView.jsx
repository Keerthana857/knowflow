import React, { useState } from 'react';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import { GitFork, BookOpen, Clock, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';

const initialNodes = [
  {
    id: '1',
    position: { x: 50, y: 150 },
    data: {
      label: (
        <div style={{ textAlign: 'left', padding: '4px' }}>
          <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>STEP 1 • PREREQUISITE</div>
          <div style={{ fontWeight: 600, color: '#fff' }}>Linear Algebra & Vectors</div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>Foundational • 95% Mastery</div>
        </div>
      )
    },
    style: {
      backgroundColor: '#1f2937',
      border: '2px solid #10b981',
      borderRadius: '12px',
      color: '#fff',
      width: 220
    }
  },
  {
    id: '2',
    position: { x: 340, y: 80 },
    data: {
      label: (
        <div style={{ textAlign: 'left', padding: '4px' }}>
          <div style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700 }}>STEP 2 • IN PROGRESS</div>
          <div style={{ fontWeight: 600, color: '#fff' }}>Loss Functions & Gradients</div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>Core Concept • 65% Mastery</div>
        </div>
      )
    },
    style: {
      backgroundColor: '#1f2937',
      border: '2px solid #f59e0b',
      borderRadius: '12px',
      color: '#fff',
      width: 220
    }
  },
  {
    id: '3',
    position: { x: 340, y: 220 },
    data: {
      label: (
        <div style={{ textAlign: 'left', padding: '4px' }}>
          <div style={{ fontSize: '10px', color: '#6366f1', fontWeight: 700 }}>STEP 3 • NEXT UP</div>
          <div style={{ fontWeight: 600, color: '#fff' }}>Matrix Multiplications in GPUs</div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>Optimization • Not Started</div>
        </div>
      )
    },
    style: {
      backgroundColor: '#1f2937',
      border: '2px solid #6366f1',
      borderRadius: '12px',
      color: '#fff',
      width: 230
    }
  },
  {
    id: '4',
    position: { x: 650, y: 150 },
    data: {
      label: (
        <div style={{ textAlign: 'left', padding: '4px' }}>
          <div style={{ fontSize: '10px', color: '#f43f5e', fontWeight: 700 }}>STEP 4 • GAP DETECTED</div>
          <div style={{ fontWeight: 600, color: '#fff' }}>Backpropagation Chain Rule</div>
          <div style={{ fontSize: '11px', color: '#fca5a5' }}>Requires: Gradient Calculus</div>
        </div>
      )
    },
    style: {
      backgroundColor: '#1f2937',
      border: '2px solid #f43f5e',
      borderRadius: '12px',
      color: '#fff',
      width: 230
    }
  },
  {
    id: '5',
    position: { x: 960, y: 150 },
    data: {
      label: (
        <div style={{ textAlign: 'left', padding: '4px' }}>
          <div style={{ fontSize: '10px', color: '#a855f7', fontWeight: 700 }}>TARGET MILESTONE</div>
          <div style={{ fontWeight: 600, color: '#fff' }}>Multi-Head Attention Networks</div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>Advanced Architecture</div>
        </div>
      )
    },
    style: {
      backgroundColor: '#1f2937',
      border: '2px solid #a855f7',
      borderRadius: '12px',
      color: '#fff',
      width: 240
    }
  }
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, label: 'prerequisite', style: { stroke: '#10b981' } },
  { id: 'e1-3', source: '1', target: '3', style: { stroke: '#6366f1' } },
  { id: 'e2-4', source: '2', target: '4', animated: true, label: 'requires calculus', style: { stroke: '#f43f5e' } },
  { id: 'e3-4', source: '3', target: '4', style: { stroke: '#4b5563' } },
  { id: 'e4-5', source: '4', target: '5', label: 'builds upon', style: { stroke: '#a855f7' } }
];

export default function GraphView({ onStartLearning }) {
  const [selectedNode, setSelectedNode] = useState({
    title: 'Loss Functions & Gradients',
    priority: 'Step 2 in Recommended Learning Order',
    mastery: '65% Mastery',
    prereqs: ['Linear Algebra & Vectors'],
    desc: 'Quantifies prediction error between target distribution and model output. Essential prerequisite before attempting Backpropagation.',
    time: '4 mins (Quick) • 12 mins (Deep)'
  });

  const onNodeClick = (_, node) => {
    if (node.id === '1') {
      setSelectedNode({
        title: 'Linear Algebra & Vectors',
        priority: 'Step 1 in Recommended Learning Order',
        mastery: '95% (Strong Foundation)',
        prereqs: ['High School Algebra'],
        desc: 'Vector spaces, dot products, and coordinate projections. The bedrock for all modern neural representations.',
        time: '3 mins (Quick) • 8 mins (Deep)'
      });
    } else if (node.id === '4') {
      setSelectedNode({
        title: 'Backpropagation Chain Rule',
        priority: 'Step 4 • Needs Prerequisite Reinforcement',
        mastery: '30% (Knowledge Gap Detected)',
        prereqs: ['Loss Functions', 'Multivariate Derivatives'],
        desc: 'Iterative backward pass calculating partial derivatives across layer activations. Identified as a high-risk gap in recent quiz.',
        time: '6 mins (Quick) • 18 mins (Deep)'
      });
    } else if (node.id === '5') {
      setSelectedNode({
        title: 'Multi-Head Attention Networks',
        priority: 'Target Milestone (Paper Objective)',
        mastery: '0% (Locked)',
        prereqs: ['Backpropagation', 'Matrix Multiplications'],
        desc: 'Allows the model to jointly attend to information from different representation subspaces at different positions.',
        time: '8 mins (Quick) • 25 mins (Deep)'
      });
    } else {
      setSelectedNode({
        title: 'Matrix Multiplications in GPUs',
        priority: 'Step 3 in Recommended Learning Order',
        mastery: '0% (Ready to start)',
        prereqs: ['Linear Algebra & Vectors'],
        desc: 'Tiling and cache optimizations that make modern large language models feasible at scale.',
        time: '5 mins (Quick) • 14 mins (Deep)'
      });
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <GitFork color="var(--accent-cyan)" size={24} />
            AI Prerequisite Knowledge Graph
          </h2>
          <p style={{ fontSize: '0.875rem' }}>
            Gemini analyzed concepts, dependencies, and topological prerequisites. Click any node to inspect.
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
          <span className="badge badge-emerald"><CheckCircle size={12} /> Mastered</span>
          <span className="badge badge-amber">● In Progress</span>
          <span className="badge badge-rose"><AlertTriangle size={12} /> Prereq Gap</span>
          <span className="badge badge-indigo">✦ Recommended Next</span>
        </div>
      </div>

      {/* Main Flow Canvas + Details Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '1.25rem', height: '540px' }}>
        {/* React Flow Graph */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
          <ReactFlow
            nodes={initialNodes}
            edges={initialEdges}
            onNodeClick={onNodeClick}
            fitView
            style={{ width: '100%', height: '100%', backgroundColor: '#0f172a' }}
          >
            <Background color="#334155" gap={20} size={1} />
            <Controls />
            <MiniMap style={{ backgroundColor: '#1e293b' }} nodeColor="#6366f1" />
          </ReactFlow>
        </div>

        {/* Selected Concept Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span className="badge badge-indigo" style={{ marginBottom: '0.75rem' }}>
              {selectedNode.priority}
            </span>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#ffffff' }}>
              {selectedNode.title}
            </h3>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              {selectedNode.desc}
            </p>

            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-primary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Prerequisites Required
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {selectedNode.prereqs.map((p, idx) => (
                  <span key={idx} style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    color: '#c7d2fe'
                  }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <Clock size={15} color="var(--accent-amber)" />
              <span>Est: {selectedNode.time}</span>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button
              className="btn btn-primary"
              onClick={onStartLearning}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <BookOpen size={16} />
              <span>Internalize This Concept</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
