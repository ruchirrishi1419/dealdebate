import React, { useState } from 'react';
import { 
  ReportCard, 
  OpponentProfile, 
  ChatMessage 
} from '../types';
import { 
  ArrowLeft, 
  RotateCcw, 
  Copy, 
  Check, 
  Printer, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

interface ReportCardScreenProps {
  scenario: string;
  opponent: OpponentProfile;
  report: ReportCard;
  messages: ChatMessage[];
  onRestartSame: () => void;
  onNewScenario: () => void;
}

export const ReportCardScreen: React.FC<ReportCardScreenProps> = ({
  scenario,
  opponent,
  report,
  messages,
  onRestartSame,
  onNewScenario,
}) => {
  const [copied, setCopied] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const copyToClipboard = () => {
    const text = `# EXECUTIVE PERFORMANCE EVALUATION SHEET
Scenario: ${scenario}
Format: ${opponent.scenarioType || 'Negotiation'}
Opponent: ${opponent.name} (${opponent.title} at ${opponent.company})
Outcome: ${report.dealOutcome}
Composite Score: ${report.overallScore}/10 (Grade: ${report.overallGrade})

## Executive Summary
${report.executiveSummary}

## Formal Scorecard (Out of 10)
- Persuasion (${report.persuasion.score}/10): ${report.persuasion.reason}
- Handling Objections (${report.handlingObjections.score}/10): ${report.handlingObjections.reason}
- Concessions (${report.concessions.score}/10): ${report.concessions.reason}
- Closing (${report.closing.score}/10): ${report.closing.reason}

## Weakest Statements & Executive Rewrites
${report.weakestLines
  .map(
    (w, i) => `### Statement #${i + 1}
- What You Said: "${w.original}"
- Diagnostic Critique: ${w.critique}
- Executive Rephrase: "${w.rewrite}"`
  )
  .join('\n\n')}

## Key Strategic Directive
${report.topTip}
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const isGD = opponent.scenarioType === 'GROUP_DISCUSSION';
  const isInterview = opponent.scenarioType === 'INTERVIEW';
  const isPitch = opponent.scenarioType === 'PITCHING';

  const pillars = [
    {
      name: 'Persuasion',
      score: report.persuasion.score,
      definition: isGD
        ? 'Logical coherence, framing, and empirical data substantiation'
        : isInterview
        ? 'Value proposition framing, executive presence, and storytelling'
        : isPitch
        ? 'Market problem urgency, distribution clarity, and unit economics'
        : 'Value framing, commercial leverage, and ROI justification',
      evidence: report.persuasion.reason
    },
    {
      name: 'Handling Objections',
      score: report.handlingObjections.score,
      definition: isGD
        ? 'Rebutting counter-arguments, refuting fallacies, and poise'
        : isInterview
        ? 'Handling drill-downs, operational depth, and transparency'
        : isPitch
        ? 'Answering investor skepticism regarding moats and competition'
        : 'Neutralizing doubts, maintaining composure, and defusing price pushbacks',
      evidence: report.handlingObjections.reason
    },
    {
      name: 'Concessions',
      score: report.concessions.score,
      definition: isGD
        ? 'Recognizing trade-offs without abandoning central premise'
        : isInterview
        ? 'Intellectual honesty regarding weaknesses without surrendering authority'
        : isPitch
        ? 'Pragmatism regarding capital allocation while defending equity'
        : 'Protecting margins, trading reciprocally, and avoiding unearned giveaways',
      evidence: report.concessions.reason
    },
    {
      name: 'Closing',
      score: report.closing.score,
      definition: isGD
        ? 'Synthesizing discussion and delivering memorable conclusion'
        : isInterview
        ? 'Final value pitch, demonstrating fit, and securing next steps'
        : isPitch
        ? 'Creating investor urgency and calling for term sheet review'
        : 'Deal momentum, trial closes, and securing binding next steps',
      evidence: report.closing.reason
    }
  ];

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-200 font-sans py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <button
            onClick={onNewScenario}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Topic Library</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-800 bg-[#131b2b] text-slate-300 hover:bg-[#162033] hover:text-white text-xs font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-blue-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Report</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-800 bg-[#131b2b] text-slate-300 hover:bg-[#162033] hover:text-white text-xs font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print Sheet</span>
            </button>
            <button
              onClick={onRestartSame}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Scenario</span>
            </button>
          </div>
        </div>

        {/* The Formal Evaluation Sheet (Dark Corporate Document Style) */}
        <div className="bg-[#131b2b] border border-slate-800 rounded-lg p-6 sm:p-10 shadow-xs space-y-8">
          
          {/* Document Header */}
          <div className="border-b border-slate-800 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Performance Evaluation Record
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight mt-1">
                  Executive Communication Assessment
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Session audit across 6 interactive debate rounds against specialized AI counterpart
                </p>
              </div>

              {/* Composite Grade Stamp */}
              <div className="border border-slate-800 rounded p-3 text-center sm:text-right bg-[#0b0f17] shrink-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Composite Score
                </div>
                <div className="text-2xl font-bold text-slate-100 font-mono">
                  {report.overallScore} <span className="text-xs text-slate-500 font-normal">/ 10</span>
                </div>
                <div className="text-xs font-semibold text-blue-400 mt-0.5">
                  Grade: {report.overallGrade}
                </div>
              </div>
            </div>

            {/* Assessment Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Scenario / Motion:</span>
                <span className="font-medium text-slate-200 truncate block">{scenario}</span>
                {opponent.userRole && (
                  <span className="text-[11px] text-blue-400 block truncate">Role: {opponent.userRole}</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Assessor / Counterpart:</span>
                <span className="font-medium text-slate-200 block">{opponent.name}</span>
                <span className="text-[11px] text-slate-400 block truncate">{opponent.title}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Format / Stakes:</span>
                <span className="font-medium text-slate-200 block">
                  {opponent.scenarioType === 'GROUP_DISCUSSION' ? 'Group Discussion' :
                   opponent.scenarioType === 'INTERVIEW' ? 'Executive Interview' :
                   opponent.scenarioType === 'PITCHING' ? 'Venture Pitch' :
                   opponent.scenarioType === 'EVERYDAY_SKILLS' ? 'Everyday Workplace' : 'Commercial Deal'}
                </span>
                <span className="text-[11px] text-blue-400 block truncate">
                  Difficulty: {opponent.difficulty === 'EASY' ? 'Easy (Practice)' : opponent.difficulty === 'HARD' ? 'Hard (Interview Prep)' : 'Medium'}
                </span>
                {opponent.stakes && (
                  <span className="text-[11px] text-slate-400 block truncate font-mono">Stakes: {opponent.stakes}</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Assessed Outcome:</span>
                <span className="font-semibold text-blue-400 block">{report.dealOutcome}</span>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              1. Evaluator Executive Debrief
            </h2>
            <div className="bg-[#0b0f17] border border-slate-800 rounded p-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
              "{report.executiveSummary}"
            </div>
          </div>

          {/* 4 Pillars Formal Scorecard Table */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              2. Core Competency Assessment (Scores Out of 10)
            </h2>

            <div className="border border-slate-800 rounded overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0f1624] border-b border-slate-800 text-slate-300 font-semibold">
                    <th className="py-2.5 px-4 w-40">Competency Pillar</th>
                    <th className="py-2.5 px-3 w-20 text-center">Score</th>
                    <th className="py-2.5 px-4">Evidence & Verbatim Analysis (Quoting Student)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {pillars.map((p, idx) => (
                    <tr key={idx} className="hover:bg-[#162033]/50">
                      <td className="py-3 px-4 align-top">
                        <div className="font-semibold text-slate-200">{p.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{p.definition}</div>
                      </td>
                      <td className="py-3 px-3 align-top text-center font-mono">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-[#0b0f17] border border-slate-800 text-slate-200">
                          {p.score}/10
                        </span>
                      </td>
                      <td className="py-3 px-4 align-top text-slate-300 leading-relaxed">
                        {p.evidence}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weakest Statements & Executive Rewrites */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
              <span>3. Diagnostic Audit: 2 Weakest Turns & Recommended Executive Rewrites</span>
            </h2>

            <div className="space-y-4">
              {report.weakestLines.map((item, idx) => (
                <div key={idx} className="border border-slate-800 rounded p-4 text-xs space-y-3 bg-[#0f1624]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-300 uppercase text-[11px]">Turn Audit #{idx + 1}</span>
                    <span className="text-[11px] text-slate-400">Verbatim statement review</span>
                  </div>

                  {/* Student quote */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">
                      Verbatim Statement Made:
                    </span>
                    <div className="p-2.5 rounded bg-[#0b0f17] border border-slate-800 text-slate-300 font-mono italic">
                      "{item.original}"
                    </div>
                  </div>

                  {/* Diagnostic */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase block mb-0.5">
                      Tactical Deficit / Failure Mode:
                    </span>
                    <p className="text-slate-300 leading-relaxed">{item.critique}</p>
                  </div>

                  {/* Recommended Rephrase */}
                  <div>
                    <span className="text-[11px] font-semibold text-blue-400 uppercase block mb-1">
                      Recommended Executive Rephrase:
                    </span>
                    <div className="p-2.5 rounded bg-blue-950/40 border border-blue-900/60 text-blue-200 font-medium leading-relaxed">
                      "{item.rewrite}"
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Strategic Recommendation */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-slate-400" />
              <span>4. Strategic Directive for Subsequent Sessions</span>
            </h2>
            <div className="border border-slate-800 bg-[#0f1624] rounded p-4 text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              {report.topTip}
            </div>
          </div>

          {/* Full Chronological Transcript Accordion */}
          <div className="border-t border-slate-800 pt-4">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full flex items-center justify-between text-left text-xs font-semibold text-slate-300 hover:text-blue-400 py-1 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Complete 6-Round Session Transcript ({messages.length} total turns)</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                <span>{showTranscript ? 'Collapse' : 'Expand'}</span>
                {showTranscript ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showTranscript && (
              <div className="mt-3 space-y-3 pt-2 max-h-96 overflow-y-auto pr-1">
                {messages.map((m, i) => (
                  <div
                    key={m.id || i}
                    className={`p-3 rounded text-xs leading-relaxed border ${
                      m.role === 'assistant'
                        ? 'bg-[#0f1624] border-slate-800 text-slate-300'
                        : 'bg-blue-950/30 border-blue-900/50 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-medium">
                      <span>{m.role === 'assistant' ? `${opponent.name} (${opponent.title})` : 'You (Candidate)'}</span>
                      <span>Round {m.round}</span>
                    </div>
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-2 pb-10 text-xs">
          <button
            onClick={onNewScenario}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded border border-slate-800 bg-[#131b2b] text-slate-300 hover:bg-[#162033] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Select Another Topic</span>
          </button>

          <button
            onClick={onRestartSame}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Repeat Current Scenario</span>
          </button>
        </div>

      </div>
    </div>
  );
};
