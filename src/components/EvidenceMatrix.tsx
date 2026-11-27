'use client';

import React, { useState } from 'react';
import { EvidenceClaim, DocumentSource } from '../types';
import {
  FileText,
  AlertTriangle,
  Scale,
  Sparkles,
  Filter,
  CheckCircle2
} from 'lucide-react';

interface EvidenceMatrixProps {
  claims: EvidenceClaim[];
  documents: DocumentSource[];
}

export default function EvidenceMatrix({ claims, documents }: EvidenceMatrixProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  const topics = ['all', ...Array.from(new Set(claims.map(c => c.topic)))];

  const filteredClaims = selectedTopic === 'all'
    ? claims
    : claims.filter(c => c.topic === selectedTopic);

  // Group conflicting claims together
  const contradictions = claims.filter(c => !!c.contradictsClaimId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-[#E8ECF2] rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="w-8 h-8 rounded-lg bg-[#EEEDFC] text-[#635BDB] border border-[#D5D1F7] flex items-center justify-center">
              <Scale size={18} />
            </span>
            <h2 className="text-lg font-bold text-[#172033]">
              Evidence Comparison & Multi-Paper Contradiction Matrix
            </h2>
          </div>
          <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
            Side-by-side verification comparing empirical findings, underlying assumptions, and flagged architectural contradictions across ingested research papers.
          </p>
        </div>

        {/* Papers Count & Conflicts Count Badges */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E8ECF2] text-xs">
            <span className="text-[#64748B] block text-[10px] uppercase font-bold tracking-wider">Documents Ingested</span>
            <span className="text-[#172033] font-bold">{documents.length} Papers</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] text-xs">
            <span className="text-[#E05252] block text-[10px] uppercase font-bold tracking-wider">Flagged Conflicts</span>
            <span className="text-[#E05252] font-bold">{contradictions.length} Contradictions</span>
          </div>
        </div>
      </div>

      {/* Prominent Contradiction Callouts */}
      {contradictions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E05252] px-1">
            <AlertTriangle size={15} />
            <span>High-Impact Architectural Conflicts</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contradictions.map(claim => {
              const opponent = claims.find(c => c.id === claim.contradictsClaimId);
              if (!opponent) return null;

              return (
                <div
                  key={claim.id}
                  className="bg-white border border-[#FEE2E2] rounded-2xl p-5 shadow-xs relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-[#E05252] uppercase tracking-wider bg-[#FEF2F2] px-2 py-0.5 rounded border border-[#FEE2E2]">
                      Direct Contradiction • {claim.topic}
                    </span>
                    <span className="text-[10px] text-[#64748B] font-medium">
                      {claim.citation}
                    </span>
                  </div>

                  {/* Conflict Dispute */}
                  <div className="space-y-3 text-xs mb-4">
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E8ECF2]">
                      <div className="text-[10px] font-bold text-[#64748B] uppercase mb-1">
                        Stance A ({claim.sourcePaperTitle.split(':')[0]})
                      </div>
                      <p className="text-[#172033] leading-snug font-medium">
                        &ldquo;{claim.claim}&rdquo;
                      </p>
                    </div>

                    <div className="p-3 bg-[#FEF2F2]/60 rounded-xl border border-[#FEE2E2]">
                      <div className="text-[10px] font-bold text-[#E05252] uppercase mb-1">
                        Opposing Stance B ({opponent.sourcePaperTitle.split(':')[0]})
                      </div>
                      <p className="text-[#991B1B] leading-snug font-medium">
                        &ldquo;{opponent.claim}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Resolution Hypothesis */}
                  {claim.contradictionDetails && (
                    <div className="p-3 rounded-xl bg-[#EEEDFC] border border-[#D5D1F7] text-xs">
                      <div className="text-[10px] font-bold text-[#635BDB] uppercase flex items-center gap-1 mb-1">
                        <Sparkles size={11} /> AI Resolution Analysis
                      </div>
                      <p className="text-[#172033] text-[11px] leading-relaxed">
                        {claim.contradictionDetails.resolutionHypothesis}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Multi-Paper Evidence Matrix Table */}
      <div className="bg-white border border-[#E8ECF2] rounded-2xl shadow-xs overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-[#E8ECF2] flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[#64748B]" />
            <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Filter by Topic:
            </span>
            <div className="flex flex-wrap gap-1">
              {topics.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTopic(t)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                    selectedTopic === t
                      ? 'bg-[#635BDB] text-white shadow-xs'
                      : 'bg-white text-[#64748B] hover:text-[#172033] border border-[#E8ECF2]'
                  }`}
                >
                  {t === 'all' ? 'All Topics' : t}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-[#64748B]">
            Showing {filteredClaims.length} structured claims
          </span>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] uppercase text-[10px] font-bold tracking-wider border-b border-[#E8ECF2]">
              <tr>
                <th className="py-3 px-4">Source Paper & Citation</th>
                <th className="py-3 px-4">Extracted Empirical Claim</th>
                <th className="py-3 px-4">Methodology</th>
                <th className="py-3 px-4">Evidence Strength</th>
                <th className="py-3 px-4">Reported Limitations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECF2]">
              {filteredClaims.map(claim => {
                const isContradicted = !!claim.contradictsClaimId;

                return (
                  <tr
                    key={claim.id}
                    className={`hover:bg-[#F8FAFC] transition-colors ${
                      isContradicted ? 'bg-[#FEF2F2]/30' : ''
                    }`}
                  >
                    {/* Source Paper */}
                    <td className="py-3.5 px-4 align-top w-64 shrink-0">
                      <div className="flex items-start gap-1.5 font-bold text-[#172033] mb-1">
                        <FileText size={14} className="text-[#635BDB] shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{claim.sourcePaperTitle}</span>
                      </div>
                      <span className="text-[11px] text-[#64748B] font-mono">
                        {claim.citation}
                      </span>
                    </td>

                    {/* Claim */}
                    <td className="py-3.5 px-4 align-top max-w-xs">
                      <p className="text-[#172033] font-medium leading-relaxed mb-1">
                        {claim.claim}
                      </p>
                      {isContradicted && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#E05252] bg-[#FEF2F2] px-1.5 py-0.5 rounded border border-[#FEE2E2]">
                          <AlertTriangle size={10} /> Disputed finding
                        </span>
                      )}
                    </td>

                    {/* Methodology */}
                    <td className="py-3.5 px-4 align-top text-[#64748B] max-w-xs leading-relaxed">
                      {claim.methodology}
                    </td>

                    {/* Evidence Strength */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        claim.evidenceStrength === 'Strong Empirical'
                          ? 'bg-[#F0FDF4] text-[#16A37A] border-[#BBF7D0]'
                          : claim.evidenceStrength === 'Contested'
                          ? 'bg-[#FEF2F2] text-[#E05252] border-[#FEE2E2]'
                          : 'bg-[#EEEDFC] text-[#635BDB] border-[#D5D1F7]'
                      }`}>
                        <CheckCircle2 size={11} />
                        {claim.evidenceStrength}
                      </span>
                    </td>

                    {/* Limitations */}
                    <td className="py-3.5 px-4 align-top text-[#64748B] max-w-xs leading-relaxed">
                      {claim.limitations}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
