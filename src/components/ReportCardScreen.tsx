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
Opponent: DealDebate (${opponent.title} at ${opponent.company})
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
    <div className="min-h-screen bg-white text-[#111111] font-sans py-12 sm:py-16 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Action Bar: Editorial Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e5e5]">
          <button
            onClick={onNewScenario}
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium text-neutral-500 hover:text-[#111111] transition-colors active:scale-[0.99]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Topic Library</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-none border border-[#111111] bg-white text-[#111111] hover:bg-neutral-50 text-xs uppercase tracking-wider font-medium transition-colors active:scale-[0.99]"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#111111]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Copy Report</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-none border border-[#111111] bg-white text-[#111111] hover:bg-neutral-50 text-xs uppercase tracking-wider font-medium transition-colors active:scale-[0.99]"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-500" />
              <span>Print Record</span>
            </button>
            <button
              onClick={onRestartSame}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-none bg-[#111111] hover:bg-black text-white text-xs uppercase tracking-wider font-medium transition-colors border border-[#111111] active:scale-[0.99]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Scenario</span>
            </button>
          </div>
        </div>

        {/* The Formal Evaluation Sheet (Luxury Editorial Monograph Style) */}
        <div className="bg-white border border-[#111111] rounded-none p-8 sm:p-12 space-y-10 shadow-none">
          
          {/* Document Header */}
          <div className="border-b border-[#111111] pb-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium">
                  Evaluation Record · Archival Transcript
                </span>
                <h1 className="text-3xl sm:text-4xl font-serif font-normal text-[#111111] tracking-tight mt-1.5">
                  Executive Communication Assessment
                </h1>
                <p className="text-xs text-neutral-600 mt-1.5 font-sans">
                  Session audit across 6 interactive debate rounds against specialized AI counterpart
                </p>
              </div>

              {/* Composite Grade Stamp */}
              <div className="border border-[#111111] rounded-none p-4 text-center sm:text-right bg-white shrink-0 min-w-[140px]">
                <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium">
                  Composite Score
                </div>
                <div className="text-3xl font-serif text-[#111111] font-normal my-0.5">
                  {report.overallScore} <span className="text-xs text-neutral-500 font-sans font-normal">/ 10</span>
                </div>
                <div className="text-xs uppercase tracking-wider font-sans font-semibold text-[#111111]">
                  Grade: {report.overallGrade}
                </div>
              </div>
            </div>

            {/* Assessment Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-5 border-t border-[#e5e5e5] text-xs">
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase tracking-widest">Scenario / Motion:</span>
                <span className="font-medium text-[#111111] truncate block mt-0.5">{scenario}</span>
                {opponent.userRole && (
                  <span className="text-[11px] text-neutral-500 block truncate">Role: {opponent.userRole}</span>
                )}
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase tracking-widest">Counterpart:</span>
                <span className="font-medium text-[#111111] block mt-0.5">DealDebate</span>
                <span className="text-[11px] text-neutral-500 block truncate">{opponent.title}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase tracking-widest">Format / Tier:</span>
                <span className="font-medium text-[#111111] block mt-0.5">
                  {opponent.scenarioType === 'GROUP_DISCUSSION' ? 'Group Discussion' :
                   opponent.scenarioType === 'INTERVIEW' ? 'Executive Interview' :
                   opponent.scenarioType === 'PITCHING' ? 'Venture Pitch' :
                   opponent.scenarioType === 'EVERYDAY_SKILLS' ? 'Everyday Workplace' : 'Commercial Deal'}
                </span>
                <span className="text-[11px] text-neutral-500 block truncate">
                  Difficulty: {opponent.difficulty === 'EASY' ? 'Easy (Practice)' : opponent.difficulty === 'HARD' ? 'Hard (Interview)' : 'Medium'}
                </span>
                {opponent.stakes && (
                  <span className="text-[11px] text-neutral-700 block truncate font-mono">Stakes: {opponent.stakes}</span>
                )}
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase tracking-widest">Assessed Outcome:</span>
                <span className="font-semibold text-[#111111] block mt-0.5 uppercase tracking-wide text-xs">{report.dealOutcome}</span>
              </div>
            </div>
          </div>

          {/* 1. Evaluator Executive Debrief */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#111111] mb-3">
              1. Evaluator Executive Debrief
            </h2>
            <div className="bg-neutral-50 border border-[#e5e5e5] rounded-none p-5 text-sm text-neutral-800 leading-relaxed font-sans">
              "{report.executiveSummary}"
            </div>
          </div>

          {/* 2. Core Competency Assessment Table */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#111111] mb-3">
              2. Core Competency Assessment (Scores Out of 10)
            </h2>

            <div className="border border-[#111111] rounded-none overflow-hidden font-sans">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-100 border-b border-[#111111] text-[#111111] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4 w-44">Competency Pillar</th>
                    <th className="py-3 px-3 w-20 text-center">Score</th>
                    <th className="py-3 px-4">Evidence & Verbatim Analysis (Quoting Student)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5e5]">
                  {pillars.map((p, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-[#111111] text-xs uppercase tracking-wide">{p.name}</div>
                        <div className="text-[11px] text-neutral-500 mt-0.5 leading-snug">{p.definition}</div>
                      </td>
                      <td className="py-3.5 px-3 align-top text-center font-mono">
                        <span className="inline-block px-2.5 py-1 rounded-none text-xs font-bold bg-neutral-100 border border-[#111111] text-[#111111]">
                          {p.score}/10
                        </span>
                      </td>
                      <td className="py-3.5 px-4 align-top text-neutral-700 leading-relaxed">
                        {p.evidence}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Diagnostic Audit: Weakest Turns & Rewrites */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#111111] mb-3 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-neutral-500" />
              <span>3. Diagnostic Audit: 2 Weakest Turns & Recommended Executive Rewrites</span>
            </h2>

            <div className="space-y-4">
              {report.weakestLines.map((item, idx) => (
                <div key={idx} className="border border-[#e5e5e5] rounded-none p-5 text-xs space-y-3.5 bg-white font-sans">
                  <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-2">
                    <span className="font-semibold text-[#111111] uppercase tracking-wider text-[11px]">Turn Audit #{idx + 1}</span>
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400">Verbatim statement review</span>
                  </div>

                  {/* Student quote */}
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest block mb-1">
                      Verbatim Statement Made:
                    </span>
                    <div className="p-3 rounded-none bg-neutral-50 border border-[#e5e5e5] text-neutral-800 font-mono text-xs italic">
                      "{item.original}"
                    </div>
                  </div>

                  {/* Diagnostic */}
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest block mb-1">
                      Tactical Deficit / Failure Mode:
                    </span>
                    <p className="text-neutral-700 leading-relaxed">{item.critique}</p>
                  </div>

                  {/* Recommended Rephrase */}
                  <div>
                    <span className="text-[10px] font-semibold text-[#111111] uppercase tracking-widest block mb-1">
                      Recommended Executive Rephrase:
                    </span>
                    <div className="p-3 rounded-none bg-neutral-100 border border-[#111111] text-[#111111] font-medium leading-relaxed">
                      "{item.rewrite}"
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Strategic Directive */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#111111] mb-3 flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-neutral-500" />
              <span>4. Strategic Directive for Subsequent Sessions</span>
            </h2>
            <div className="border border-[#111111] bg-white rounded-none p-5 text-sm text-[#111111] leading-relaxed font-sans font-medium">
              {report.topTip}
            </div>
          </div>

          {/* Full Chronological Transcript Accordion */}
          <div className="border-t border-[#e5e5e5] pt-5">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full flex items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-[#111111] hover:text-black py-1 transition-colors active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-neutral-400" />
                <span>Complete 6-Round Session Transcript ({messages.length} total turns)</span>
              </div>
              <div className="flex items-center gap-1 text-neutral-500 text-[10px] uppercase tracking-widest">
                <span>{showTranscript ? 'Collapse' : 'Expand'}</span>
                {showTranscript ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showTranscript && (
              <div className="mt-4 space-y-3 pt-2 max-h-96 overflow-y-auto pr-1 font-sans">
                {messages.map((m, i) => (
                  <div
                    key={m.id || i}
                    className={`p-3.5 rounded-none text-xs leading-relaxed border ${
                      m.role === 'assistant'
                        ? 'bg-neutral-50 border-[#e5e5e5] text-neutral-800'
                        : 'bg-white border-[#111111] text-[#111111]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-neutral-400 mb-1 font-medium">
                      <span>{m.role === 'assistant' ? `DealDebate (${opponent.title})` : 'You (Candidate)'}</span>
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
        <div className="flex items-center justify-between pt-2 pb-12 text-xs">
          <button
            onClick={onNewScenario}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-none border border-[#111111] bg-white text-[#111111] hover:bg-neutral-50 uppercase tracking-wider font-medium transition-colors active:scale-[0.99]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Select Another Topic</span>
          </button>

          <button
            onClick={onRestartSame}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-none bg-[#111111] hover:bg-black text-white font-medium uppercase tracking-wider border border-[#111111] transition-colors active:scale-[0.99]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Repeat Current Scenario</span>
          </button>
        </div>

      </div>
    </div>
  );
};
