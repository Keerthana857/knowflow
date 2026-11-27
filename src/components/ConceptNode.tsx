'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { CheckCircle2, Clock, AlertTriangle, Sparkles, BookOpen } from 'lucide-react';
import { Concept } from '../types';

export interface ConceptNodeData extends Concept {
  isRecommendedNext?: boolean;
  onSelectNode?: (conceptId: string) => void;
}

export const ConceptNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as ConceptNodeData;

  const getStatusStyles = () => {
    switch (nodeData.status) {
      case 'mastered':
        return {
          border: 'border-[#16A37A]/60',
          badge: 'bg-[#EEFDF8] text-[#16A37A] border-[#DCF7ED]',
          progress: 'bg-[#16A37A]',
          icon: <CheckCircle2 size={12} className="text-[#16A37A]" />
        };
      case 'in_progress':
        return {
          border: 'border-[#E6A23C]/60',
          badge: 'bg-[#FFFBEB] text-[#D97706] border-[#FEF3C7]',
          progress: 'bg-[#E6A23C]',
          icon: <Clock size={12} className="text-[#D97706]" />
        };
      case 'weak':
        return {
          border: 'border-[#E05252]/60',
          badge: 'bg-[#FEF2F2] text-[#E05252] border-[#FEE2E2]',
          progress: 'bg-[#E05252]',
          icon: <AlertTriangle size={12} className="text-[#E05252]" />
        };
      default:
        return {
          border: 'border-[#E8ECF2]',
          badge: 'bg-[#F8FAFC] text-[#64748B] border-[#E8ECF2]',
          progress: 'bg-slate-300',
          icon: <BookOpen size={12} className="text-[#64748B]" />
        };
    }
  };

  const style = getStatusStyles();

  return (
    <div
      onClick={() => nodeData.onSelectNode && nodeData.onSelectNode(nodeData.id)}
      className={`relative w-72 rounded-xl p-3.5 bg-white border transition-all duration-150 cursor-pointer text-left shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${style.border} ${
        selected ? 'ring-2 ring-[#635BDB] ring-offset-2 ring-offset-white shadow-md' : 'hover:border-[#635BDB]/50 hover:shadow-xs'
      }`}
    >
      {/* Target Handle (Incoming Prerequisites) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-[#635BDB] !border-2 !border-white"
      />

      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border ${style.badge}`}>
            {style.icon}
            {nodeData.status.replace('_', ' ')}
          </span>
          {nodeData.priorityTier && (
            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
              nodeData.priorityTier === 'high' ? 'bg-[#FEF2F2] text-[#E05252] border-[#FEE2E2]' :
              nodeData.priorityTier === 'medium' ? 'bg-[#FFFBEB] text-[#D97706] border-[#FEF3C7]' :
              'bg-[#F8FAFC] text-[#64748B] border-[#E8ECF2]'
            }`}>
              {nodeData.priorityTier}
            </span>
          )}
          {nodeData.isRecommendedNext && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#635BDB] text-white">
              <Sparkles size={9} /> NEXT
            </span>
          )}
        </div>

        <span className="text-[11px] font-medium text-[#64748B]">
          {nodeData.estimatedMinutes}m
        </span>
      </div>

      {/* Title */}
      <h4 className="text-xs font-bold text-[#172033] leading-snug mb-1 line-clamp-2">
        {nodeData.name}
      </h4>

      {/* Priority Reason / Tag */}
      <p className="text-[11px] text-[#64748B] line-clamp-1 mb-2.5">
        {nodeData.priorityReason}
      </p>

      {/* Mastery Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-[10px] text-[#64748B] font-medium">
          <span>Mastery</span>
          <span className="font-semibold text-[#172033]">{nodeData.userMastery}%</span>
        </div>
        <div className="w-full h-1 bg-[#F1F5F9] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${style.progress}`}
            style={{ width: `${nodeData.userMastery}%` }}
          />
        </div>
      </div>

      {/* Source Handle (Outgoing Dependencies) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-[#635BDB] !border-2 !border-white"
      />
    </div>
  );
});

ConceptNode.displayName = 'ConceptNode';
