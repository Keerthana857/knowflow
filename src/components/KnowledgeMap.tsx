'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  BackgroundVariant
} from '@xyflow/react';
import { ConceptNode } from './ConceptNode';
import { Concept, RelationshipEdge } from '../types';
import { GitFork, Sparkles, BookOpen, Clock, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const nodeTypes = {
  conceptNode: ConceptNode,
};

interface KnowledgeMapProps {
  concepts: Concept[];
  edges: RelationshipEdge[];
  activeConceptId: string | null;
  onSelectConcept: (conceptId: string) => void;
  onOpenLearn: (conceptId: string) => void;
}

export default function KnowledgeMap({
  concepts,
  edges,
  activeConceptId,
  onSelectConcept,
  onOpenLearn,
}: KnowledgeMapProps) {
  const [selectedEdge, setSelectedEdge] = useState<RelationshipEdge | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Recommended next concept is highest priority non-mastered topic with prerequisites met
  const recommendedNextConcept = useMemo(() => {
    return concepts.find(c => {
      if (c.userMastery >= 85) return false;
      return c.prerequisites.every(pId => {
        const p = concepts.find(item => item.id === pId);
        return !p || p.userMastery >= 70;
      });
    }) || concepts.find(c => c.userMastery < 85) || concepts[0];
  }, [concepts]);

  // Construct React Flow Nodes with topological coordinates
  const flowNodes: Node[] = useMemo(() => {
    const layerMap = new Map<string, number>();

    concepts.forEach(c => {
      if (c.prerequisites.length === 0) {
        layerMap.set(c.id, 0);
      }
    });

    let changed = true;
    let iteration = 0;
    while (changed && iteration < 10) {
      changed = false;
      iteration++;
      concepts.forEach(c => {
        if (c.prerequisites.length > 0) {
          const maxPrereqLayer = Math.max(
            ...c.prerequisites.map(p => layerMap.get(p) ?? 0)
          );
          const currentLayer = layerMap.get(c.id);
          const newLayer = maxPrereqLayer + 1;
          if (currentLayer !== newLayer) {
            layerMap.set(c.id, newLayer);
            changed = true;
          }
        }
      });
    }

    const layerGroups = new Map<number, Concept[]>();
    concepts.forEach(c => {
      const l = layerMap.get(c.id) || 0;
      if (!layerGroups.has(l)) layerGroups.set(l, []);
      layerGroups.get(l)!.push(c);
    });

    return concepts.map(c => {
      const layer = layerMap.get(c.id) || 0;
      const group = layerGroups.get(layer) || [c];
      const indexInGroup = group.findIndex(item => item.id === c.id);

      const x = 50 + layer * 340;
      const y = 80 + indexInGroup * 170;

      return {
        id: c.id,
        type: 'conceptNode',
        position: { x, y },
        selected: c.id === activeConceptId,
        data: {
          ...c,
          isRecommendedNext: c.id === recommendedNextConcept?.id,
          onSelectNode: onSelectConcept
        }
      };
    });
  }, [concepts, activeConceptId, recommendedNextConcept, onSelectConcept]);

  // Construct React Flow Edges with relationship types
  const flowEdges: Edge[] = useMemo(() => {
    return edges.map(edge => {
      let strokeColor = '#635BDB';
      let strokeDasharray: string | undefined = undefined;
      let animated = false;

      switch (edge.type) {
        case 'contradicts':
          strokeColor = '#E05252';
          strokeDasharray = '5 5';
          animated = true;
          break;
        case 'supports':
          strokeColor = '#16A37A';
          strokeDasharray = '4 4';
          break;
        case 'extends':
          strokeColor = '#8B5CF6';
          strokeDasharray = '2 3';
          break;
        case 'prerequisite':
        default:
          strokeColor = '#635BDB';
          break;
      }

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated,
        label: edge.label,
        style: {
          stroke: strokeColor,
          strokeWidth: 2,
          strokeDasharray
        },
        labelStyle: {
          fill: '#172033',
          fontSize: 10,
          fontWeight: 600
        },
        labelBgStyle: {
          fill: '#FFFFFF',
          fillOpacity: 0.95
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
          width: 12,
          height: 12
        }
      };
    });
  }, [edges]);

  const onEdgeClick = useCallback((_: any, edge: Edge) => {
    const rawEdge = edges.find(e => e.id === edge.id);
    if (rawEdge) {
      setSelectedEdge(rawEdge);
    }
  }, [edges]);

  const activeConcept = concepts.find(c => c.id === activeConceptId) || concepts[0];

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-140px)] min-h-[640px]">
      {/* Main React Flow Graph Canvas */}
      <div className="relative flex-1 min-h-[560px] h-[640px] lg:h-full bg-[#F8FAFC] rounded-2xl border border-[#E8ECF2] overflow-hidden shadow-xs flex flex-col">
        {/* Top Floating Map Header & Legend */}
        <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#E8ECF2] shadow-xs">
            <h3 className="text-xs font-bold text-[#172033] flex items-center gap-1.5 uppercase tracking-wider">
              <GitFork size={13} className="text-[#635BDB]" />
              Interactive Knowledge Graph
            </h3>
            <p className="text-[11px] text-[#64748B]">
              Click a node to inspect • Click an edge for AI connection rationale
            </p>
          </div>

          {/* Relationship Legend */}
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#E8ECF2] shadow-xs flex flex-wrap items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-[#172033]">
              <span className="w-3 h-0.5 bg-[#635BDB] rounded-full" /> Prerequisite
            </span>
            <span className="flex items-center gap-1.5 text-[#172033]">
              <span className="w-3 h-0.5 border-b-2 border-[#16A37A] border-dashed" /> Supports
            </span>
            <span className="flex items-center gap-1.5 text-[#E05252]">
              <span className="w-3 h-0.5 border-b-2 border-[#E05252] border-dashed" /> Contradicts
            </span>
            <span className="flex items-center gap-1.5 text-[#172033]">
              <span className="w-3 h-0.5 border-b-2 border-[#8B5CF6] border-dotted" /> Extends
            </span>
          </div>
        </div>

        {/* ReactFlow Canvas */}
        <div className="flex-1 w-full h-full min-h-[500px] relative">
          {isMounted ? (
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              nodeTypes={nodeTypes}
              onEdgeClick={onEdgeClick}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.3}
              maxZoom={1.8}
              style={{ width: '100%', height: '100%' }}
            >
              <Background color="#CBD5E1" variant={BackgroundVariant.Dots} gap={20} size={1} />
              <Controls className="!bg-white !border-[#E8ECF2] !rounded-xl !shadow-xs" />
              <MiniMap
                className="!bg-white !border-[#E8ECF2] !rounded-xl !overflow-hidden !shadow-xs"
                nodeColor={(n) => {
                  const c = concepts.find(item => item.id === n.id);
                  if (c?.status === 'mastered') return '#16A37A';
                  if (c?.status === 'weak') return '#E05252';
                  if (c?.status === 'in_progress') return '#E6A23C';
                  return '#94A3B8';
                }}
              />
            </ReactFlow>
          ) : (
            <div className="w-full h-full min-h-[500px] flex items-center justify-center text-xs text-[#64748B]">
              <span>Loading Knowledge Graph...</span>
            </div>
          )}
        </div>

        {/* Edge Connection Explanation Modal */}
        {selectedEdge && (
          <div className="absolute inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#E8ECF2] rounded-2xl max-w-lg w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-4">
                <div className="flex items-center gap-2 text-[#635BDB]">
                  <Info size={17} />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#172033]">
                    AI Relationship Rationale
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedEdge(null)}
                  className="text-[#64748B] hover:text-[#172033] p-1 rounded-md"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold px-3 py-2 bg-[#F8FAFC] rounded-lg border border-[#E8ECF2]">
                  <span className="text-[#172033]">
                    {concepts.find(c => c.id === selectedEdge.source)?.name}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                    selectedEdge.type === 'contradicts' ? 'bg-[#FEF2F2] text-[#E05252] border border-[#FEE2E2]' :
                    selectedEdge.type === 'supports' ? 'bg-[#EEFDF8] text-[#16A37A] border border-[#DCF7ED]' :
                    'bg-[#EEEDFC] text-[#635BDB] border border-[#DCDAF9]'
                  }`}>
                    {selectedEdge.type}
                  </span>
                  <span className="text-[#172033]">
                    {concepts.find(c => c.id === selectedEdge.target)?.name}
                  </span>
                </div>

                <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E8ECF2] text-xs leading-relaxed text-[#172033]">
                  {selectedEdge.aiConnectionExplanation}
                </div>

                <button
                  onClick={() => setSelectedEdge(null)}
                  className="w-full py-2 bg-[#635BDB] hover:bg-[#5249C9] text-white rounded-lg text-xs font-semibold transition"
                >
                  Close Explanation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Side Priority Queue & Selected Concept Inspector */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        {/* Selected Concept Card */}
        {activeConcept && (
          <div className="bg-white border border-[#E8ECF2] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#635BDB] bg-[#EEEDFC] px-2.5 py-0.5 rounded-full border border-[#DCDAF9] flex items-center gap-1">
                  <Sparkles size={11} /> Topic Details
                </span>
                <span className="text-xs text-[#64748B] font-medium">
                  {activeConcept.estimatedMinutes}m duration
                </span>
              </div>

              <h3 className="text-sm font-bold text-[#172033] mb-1.5 leading-snug">
                {activeConcept.name}
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed mb-3">
                {activeConcept.summary}
              </p>

              {/* Rationale pill */}
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E8ECF2] mb-3 text-xs">
                <div className="text-[10px] text-[#64748B] uppercase font-semibold mb-0.5">Priority Reason</div>
                <div className="text-[#635BDB] font-medium">{activeConcept.priorityReason}</div>
              </div>

              {/* Prerequisites check */}
              <div className="mb-4">
                <div className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider mb-1.5">
                  Prerequisites Required
                </div>
                {activeConcept.prerequisites.length === 0 ? (
                  <div className="text-xs text-[#16A37A] flex items-center gap-1 font-medium">
                    <CheckCircle2 size={13} /> None (Foundational node)
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {activeConcept.prerequisites.map(pId => {
                      const p = concepts.find(item => item.id === pId);
                      const isMet = (p?.userMastery ?? 0) >= 70;
                      return (
                        <span
                          key={pId}
                          className={`text-[11px] px-2 py-0.5 rounded-md font-medium border flex items-center gap-1 ${
                            isMet
                              ? 'bg-[#EEFDF8] text-[#16A37A] border-[#DCF7ED]'
                              : 'bg-[#FEF2F2] text-[#E05252] border-[#FEE2E2]'
                          }`}
                        >
                          {isMet ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                          {p?.name || pId} ({p?.userMastery ?? 0}%)
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => onOpenLearn(activeConcept.id)}
              className="w-full py-2.5 px-4 bg-[#635BDB] hover:bg-[#5249C9] text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <BookOpen size={14} />
              <span>Open Learning Session</span>
            </button>
          </div>
        )}

        {/* Priority Queue Sidebar */}
        <div className="flex-1 bg-white border border-[#E8ECF2] rounded-2xl p-4 shadow-xs flex flex-col overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033] flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#635BDB]" />
              Priority Study Sequence
            </h4>
            <span className="text-[11px] text-[#64748B] font-medium">
              Topological
            </span>
          </div>

          <div className="overflow-y-auto space-y-2 flex-1 pr-1">
            {concepts.map((concept, index) => {
              const isSelected = concept.id === activeConceptId;
              const isRecommended = concept.id === recommendedNextConcept?.id;

              return (
                <div
                  key={concept.id}
                  onClick={() => onSelectConcept(concept.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#EEEDFC]/40 border-[#635BDB] ring-1 ring-[#635BDB]'
                      : 'bg-[#F8FAFC] border-[#E8ECF2] hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-white border border-[#E8ECF2] text-[10px] font-bold text-[#64748B] flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-semibold text-[#172033] line-clamp-1">
                        {concept.name}
                      </span>
                    </div>

                    {isRecommended && (
                      <span className="text-[9px] font-bold uppercase bg-[#635BDB] text-white px-1.5 py-0.5 rounded">
                        Next
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#64748B] line-clamp-1 mb-2">
                    {concept.priorityReason}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-[#64748B] font-medium">
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {concept.estimatedMinutes}m
                    </span>
                    <span className={`font-semibold ${
                      concept.userMastery >= 85 ? 'text-[#16A37A]' :
                      concept.userMastery >= 50 ? 'text-[#D97706]' : 'text-[#E05252]'
                    }`}>
                      {concept.userMastery}% Mastery
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
