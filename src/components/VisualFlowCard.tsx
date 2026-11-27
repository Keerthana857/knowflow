'use client';

import React from 'react';
import { VisualGraphData } from '../types';
import { ArrowRight, GitBranch } from 'lucide-react';

interface VisualFlowCardProps {
  graph: VisualGraphData;
}

export default function VisualFlowCard({ graph }: VisualFlowCardProps) {
  if (!graph || !graph.nodes || graph.nodes.length === 0) return null;

  return (
    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#64748B]">
        <GitBranch size={13} className="text-[#635BDB]" />
        <span>{graph.title || 'How the ideas connect'}</span>
      </div>

      {/* Clean horizontal connected visual nodes */}
      <div className="flex flex-wrap items-center gap-2">
        {graph.nodes.map((node, idx) => {
          const edge = graph.edges.find(e => e.from === node.id);
          return (
            <React.Fragment key={node.id}>
              <div className="bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 shadow-2xs min-w-[125px] max-w-[190px]">
                <div className="text-xs font-semibold text-[#0F172A] leading-snug">
                  {node.label}
                </div>
                {node.sublabel && (
                  <div className="text-[10px] text-[#64748B] mt-0.5 truncate">
                    {node.sublabel}
                  </div>
                )}
              </div>

              {idx < graph.nodes.length - 1 && (
                <div className="flex flex-col items-center px-0.5 text-[#94A3B8]">
                  {edge?.label && (
                    <span className="text-[9px] font-medium text-[#635BDB] mb-0.5">
                      {edge.label}
                    </span>
                  )}
                  <ArrowRight size={14} className="text-[#635BDB]/70" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
