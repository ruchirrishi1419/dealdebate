import React, { useState } from 'react';
import { SavedSessionRecord } from '../types';
import { 
  X, 
  FileText, 
  ArrowRight, 
  Trash2, 
  ChevronRight, 
  ArrowLeft, 
  Check, 
  Copy,
  Printer,
  Sparkles,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: SavedSessionRecord[];
  onSelectRecord: (record: SavedSessionRecord) => void;
  onClearHistory: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  history,
  onSelectRecord,
  onClearHistory,
}) => {
  const [activeRecord, setActiveRecord] = useState<SavedSessionRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'report' | 'transcript'>('report');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyRecordToClipboard = (record: SavedSessionRecord) => {
    const report = record.reportCard;
    const text = `# ARCHIVED PERFORMANCE EVALUATION SHEET
Date: ${record.completedAt}
Scenario: ${record.scenario}
Format: ${record.category}
Opponent: DealDebate (${record.opponent.title} at ${record.opponent.company})
Outcome: ${report.dealOutcome}
Composite Score: ${report.overallScore}/10 (Grade: ${report.overallGrade})

## Executive Summary
${report.executiveSummary}

## Formal Scorecard
- Persuasion (${report.persuasion.score}/10): ${report.persuasion.reason}
- Handling Objections (${report.handlingObjections.score}/10): ${report.handlingObjections.reason}
- Concessions (${report.concessions.score}/10): ${report.concessions.reason}
- Closing (${report.closing.score}/10): ${report.closing.reason}

## 6-Round Transcript
${record.messages
  .map(
    (m) =>
      `[${m.role === 'assistant' ? `DealDebate (${record.opponent.title})` : 'You'} - Round ${m.round} (${m.timestamp})]:\n${m.content}`
  )
  .join('\n\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pillarsForRecord = (record: SavedSessionRecord) => [
    { name: 'Persuasion', pillar: record.reportCard.persuasion },
    { name: 'Handling Objections', pillar: record.reportCard.handlingObjections },
    { name: 'Concessions', pillar: record.reportCard.concessions },
    { name: 'Closing', pillar: record.reportCard.closing },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Background Overlay */}
      <div 
        className="fixed inset-0 bg-black/40 transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white border-l border-[#111111] flex flex-col shadow-none">
          
          {/* Header */}
          <div className="px-6 sm:px-8 py-5 border-b border-[#e5e5e5] flex items-center justify-between bg-white shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium">
                  Current Session
                </span>
                <span className="text-xs text-neutral-300">·</span>
                <span className="text-[10px] uppercase tracking-widest font-mono text-[#111111]">
                  {history.length} {history.length === 1 ? 'Record' : 'Records'}
                </span>
              </div>
              <h2 className="font-serif text-2xl font-normal text-[#111111] tracking-tight">
                {activeRecord ? 'Archived Assessment' : 'Simulation Archives'}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {activeRecord && (
                <button
                  onClick={() => setActiveRecord(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none border border-[#e5e5e5] text-xs uppercase tracking-wider text-neutral-600 hover:text-[#111111] hover:border-[#111111] transition-colors active:scale-[0.99]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>All Records</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-none border border-transparent hover:border-[#111111] text-neutral-500 hover:text-[#111111] transition-colors active:scale-[0.98]"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            
            {/* VIEW 1: RECORD DETAIL (Report Card or Transcript) */}
            {activeRecord ? (
              <div className="space-y-6">
                {/* Record Header Strip */}
                <div className="border border-[#111111] p-5 space-y-3 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#e5e5e5] pb-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium">
                        {activeRecord.completedAt} · {activeRecord.category}
                      </span>
                      <h3 className="font-serif text-xl font-normal text-[#111111] mt-0.5">
                        {activeRecord.scenario}
                      </h3>
                      <div className="text-xs text-neutral-600 mt-1 font-sans">
                        Counterpart: <span className="font-medium text-[#111111]">DealDebate</span> ({activeRecord.opponent.title}) · Tier: <span className="uppercase text-[11px] font-mono">{activeRecord.opponent.difficulty || 'EASY'}</span>
                      </div>
                    </div>

                    <div className="border border-[#111111] p-3 text-center sm:text-right shrink-0 min-w-[110px] bg-neutral-50">
                      <div className="text-[10px] uppercase tracking-widest text-neutral-400">Score</div>
                      <div className="text-2xl font-serif text-[#111111] font-normal my-0.5">
                        {activeRecord.reportCard.overallScore} <span className="text-xs text-neutral-500 font-sans">/ 10</span>
                      </div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#111111]">
                        Grade {activeRecord.reportCard.overallGrade}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <div className="text-neutral-500">
                      Outcome: <span className="font-semibold text-[#111111]">{activeRecord.reportCard.dealOutcome}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyRecordToClipboard(activeRecord)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none border border-[#111111] bg-white text-xs uppercase tracking-wider font-medium text-[#111111] hover:bg-neutral-50 transition-colors active:scale-[0.99]"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-[#111111]" /> : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={() => {
                          onSelectRecord(activeRecord);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-none bg-[#111111] hover:bg-black text-white text-xs uppercase tracking-wider font-medium border border-[#111111] transition-colors active:scale-[0.99]"
                      >
                        <span>Open Full Assessment</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-Tabs: Report Card vs Complete Transcript */}
                <div className="flex border-b border-[#111111]">
                  <button
                    onClick={() => setActiveTab('report')}
                    className={`px-5 py-2.5 text-xs uppercase tracking-wider font-medium font-sans border-b-2 transition-colors -mb-[1px] ${
                      activeTab === 'report'
                        ? 'border-[#111111] text-[#111111] bg-neutral-50'
                        : 'border-transparent text-neutral-500 hover:text-[#111111]'
                    }`}
                  >
                    Executive Evaluation Sheet
                  </button>
                  <button
                    onClick={() => setActiveTab('transcript')}
                    className={`px-5 py-2.5 text-xs uppercase tracking-wider font-medium font-sans border-b-2 transition-colors -mb-[1px] ${
                      activeTab === 'transcript'
                        ? 'border-[#111111] text-[#111111] bg-neutral-50'
                        : 'border-transparent text-neutral-500 hover:text-[#111111]'
                    }`}
                  >
                    Full Transcript ({activeRecord.messages.length} turns)
                  </button>
                </div>

                {/* Tab A: Report Card Details */}
                {activeTab === 'report' && (
                  <div className="space-y-6">
                    {/* Executive Debrief */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-widest text-[#111111] mb-2">
                        Executive Debrief
                      </h4>
                      <div className="bg-neutral-50 border border-[#e5e5e5] p-4 text-xs text-neutral-800 leading-relaxed">
                        "{activeRecord.reportCard.executiveSummary}"
                      </div>
                    </div>

                    {/* 4 Pillars Breakdown */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-widest text-[#111111] mb-2">
                        Core Competency Scores
                      </h4>
                      <div className="border border-[#111111] overflow-hidden divide-y divide-[#e5e5e5] text-xs">
                        {pillarsForRecord(activeRecord).map((p, idx) => (
                          <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-neutral-50/70 transition-colors">
                            <div className="flex-1">
                              <span className="font-semibold uppercase tracking-wider text-[#111111] block mb-1">
                                {p.name}
                              </span>
                              <p className="text-neutral-600 leading-relaxed text-xs">{p.pillar.reason}</p>
                            </div>
                            <div className="font-mono text-sm font-bold border border-[#111111] bg-neutral-100 px-2.5 py-1 text-center shrink-0">
                              {p.pillar.score}/10
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Weakest Statement Rewrites */}
                    {activeRecord.reportCard.weakestLines && activeRecord.reportCard.weakestLines.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-widest text-[#111111] mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Diagnostic Audit & Executive Rewrites</span>
                        </h4>
                        <div className="space-y-3">
                          {activeRecord.reportCard.weakestLines.map((item, idx) => (
                            <div key={idx} className="border border-[#e5e5e5] p-4 space-y-2 text-xs">
                              <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                                Audit #{idx + 1}
                              </div>
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">Original Quote:</span>
                                <div className="p-2 border border-[#e5e5e5] bg-neutral-50 italic text-neutral-700 font-mono text-[11px] mt-0.5">
                                  "{item.original}"
                                </div>
                              </div>
                              <p className="text-neutral-600 text-xs">{item.critique}</p>
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-[#111111] font-semibold block">Executive Rewrite:</span>
                                <div className="p-2 border border-[#111111] bg-neutral-100 text-[#111111] font-medium text-xs mt-0.5">
                                  "{item.rewrite}"
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Strategic Directive */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-widest text-[#111111] mb-2 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Key Directive for Future Sessions</span>
                      </h4>
                      <div className="border border-[#111111] bg-white p-4 text-xs text-[#111111] font-medium leading-relaxed">
                        {activeRecord.reportCard.topTip}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab B: Chronological Transcript */}
                {activeTab === 'transcript' && (
                  <div className="space-y-3">
                    {activeRecord.messages.map((m, i) => (
                      <div
                        key={m.id || i}
                        className={`p-4 border text-xs leading-relaxed ${
                          m.role === 'assistant'
                            ? 'bg-neutral-50 border-[#e5e5e5] text-neutral-800'
                            : 'bg-white border-[#111111] text-[#111111]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-neutral-400 mb-1.5 font-medium">
                          <span className="font-semibold text-[#111111]">
                            {m.role === 'assistant'
                              ? `DealDebate (${activeRecord.opponent.title})`
                              : `You (${activeRecord.opponent.userRole || 'Candidate'})`}
                          </span>
                          <span className="font-mono">Round {m.round} · {m.timestamp}</span>
                        </div>
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* VIEW 2: LIST OF ALL SAVED SESSIONS */
              <div className="space-y-6">
                {history.length === 0 ? (
                  <div className="text-center py-16 px-4 space-y-3 border border-[#e5e5e5] bg-neutral-50">
                    <FileText className="w-8 h-8 text-neutral-400 mx-auto" />
                    <h3 className="font-serif text-xl font-normal text-[#111111]">
                      No Simulation Records Yet
                    </h3>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                      Complete a 6-round negotiation, group discussion, or interview to automatically archive your full transcript and evaluation sheet here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-neutral-500 pb-2 border-b border-[#e5e5e5]">
                      <span className="uppercase tracking-widest text-[10px]">Archived Sessions</span>
                      <button
                        onClick={onClearHistory}
                        className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-neutral-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear History</span>
                      </button>
                    </div>

                    <div className="space-y-3.5">
                      {history.map((record) => (
                        <div
                          key={record.id}
                          className="border border-[#e5e5e5] hover:border-[#111111] p-5 bg-white transition-colors cursor-pointer group space-y-3"
                          onClick={() => setActiveRecord(record)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] uppercase tracking-wider border border-[#e5e5e5] px-1.5 py-0.5 bg-neutral-50 font-sans text-neutral-600">
                                  {record.category}
                                </span>
                                <span className="text-[10px] uppercase tracking-wider font-mono text-neutral-400">
                                  {record.completedAt}
                                </span>
                              </div>
                              <h4 className="font-serif text-base font-normal text-[#111111] group-hover:text-black leading-snug">
                                {record.scenario}
                              </h4>
                            </div>

                            <div className="border border-[#111111] px-2.5 py-1 text-center shrink-0 bg-neutral-50">
                              <span className="font-serif text-base font-normal text-[#111111]">
                                {record.reportCard.overallScore}
                              </span>
                              <span className="text-[10px] text-neutral-500 font-sans">/10</span>
                              <div className="text-[9px] font-semibold text-[#111111] uppercase tracking-wider">
                                {record.reportCard.overallGrade}
                              </div>
                            </div>
                          </div>

                          <div className="text-xs text-neutral-500 flex items-center justify-between pt-2 border-t border-[#f0f0f0]">
                            <div className="truncate">
                              <span>DealDebate ({record.opponent.title})</span>
                              <span> · </span>
                              <span className="text-[#111111] font-medium">{record.reportCard.dealOutcome}</span>
                            </div>

                            <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-neutral-400 group-hover:text-[#111111] shrink-0 font-medium">
                              <span>Review</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 sm:px-8 border-t border-[#e5e5e5] bg-white flex items-center justify-between text-xs text-neutral-500 shrink-0">
            <span>Session storage active</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-none border border-[#111111] bg-white text-[#111111] hover:bg-neutral-50 uppercase tracking-wider font-medium text-xs transition-colors active:scale-[0.99]"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
