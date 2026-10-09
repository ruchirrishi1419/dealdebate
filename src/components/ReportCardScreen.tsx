import React, { useState } from 'react';
import { 
  ReportCard, 
  OpponentProfile, 
  ChatMessage,
  StrengthItem,
  ImprovementItem
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
  Lightbulb,
  History,
  Trophy,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ReportCardScreenProps {
  scenario: string;
  opponent: OpponentProfile;
  report: ReportCard;
  messages: ChatMessage[];
  onRestartSame: () => void;
  onNewScenario: () => void;
  onOpenHistory?: () => void;
  historyCount?: number;
}

export const ReportCardScreen: React.FC<ReportCardScreenProps> = ({
  scenario,
  opponent,
  report,
  messages,
  onRestartSame,
  onNewScenario,
  onOpenHistory,
  historyCount = 0,
}) => {
  const [copied, setCopied] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  // Fallbacks for strengths & improvements to handle legacy sessionStorage records
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
  const fallbackSample1 = userMessages[0] || 'My opening position on this topic.';
  const fallbackSample2 = userMessages[1] || userMessages[0] || 'My second point defending my stance.';
  const fallbackSampleLast = userMessages[userMessages.length - 1] || 'My concluding remarks on this motion.';

  const displayStrengths: StrengthItem[] = report.strengths && report.strengths.length > 0
    ? report.strengths
    : [
        {
          title: 'Direct Thematic Framing',
          quote: fallbackSample1.slice(0, 90) + '...',
          explanation: report.persuasion?.reason || 'Established clear logical conviction from the opening round.'
        },
        {
          title: 'Resilience under Counter-Arguments',
          quote: fallbackSample2.slice(0, 90) + '...',
          explanation: report.handlingObjections?.reason || 'Absorbed the opponent’s skepticism directly and reframed the discussion.'
        },
        {
          title: 'Composed Final Synthesis',
          quote: fallbackSampleLast.slice(0, 90) + '...',
          explanation: report.closing?.reason || 'Delivered a coherent closing argument that reinforced your primary differentiators.'
        }
      ];

  const displayImprovements: ImprovementItem[] = report.improvements && report.improvements.length > 0
    ? report.improvements
    : (report.weakestLines || []).map((w, i) => ({
        title: i === 0 ? 'Defensive Concession' : i === 1 ? 'Under-Substantiated Claim' : 'Hesitant Closing Stance',
        quote: w.original,
        critique: w.critique,
        rewrite: w.rewrite
      }));

  // Ensure at least 3 improvements exist
  if (displayImprovements.length < 3) {
    displayImprovements.push({
      title: 'Hesitant Phrasing in Mid-Rounds',
      quote: fallbackSample2.slice(0, 75) + '...',
      critique: 'Using tentative language like "I think" or "possibly" reduces argument authority under pressure.',
      rewrite: 'The empirical track record on this topic is definitive: the comparative evidence consistently demonstrates this outcome.'
    });
  }

  // Clean quotes helper to avoid awkward double quotation marks
  const cleanQuote = (q?: string) => {
    if (!q) return '';
    return q.replace(/^["'“”]+|["'“”]+$/g, '').trim();
  };

  const verdictText = report.verdict || `Debate Evaluation: ${report.dealOutcome}. Score ${report.overallScore}/10.`;
  const cleanVerdict = cleanQuote(verdictText);
  const isUserWin = report.winner === 'USER' || cleanVerdict.toLowerCase().includes('victory for user') || cleanVerdict.toLowerCase().includes('victory for student');
  const isOpponentWin = report.winner === 'OPPONENT' || cleanVerdict.toLowerCase().includes('victory for dealdebate') || cleanVerdict.toLowerCase().includes('victory for opponent');
  const winner = isUserWin ? 'USER' : isOpponentWin ? 'OPPONENT' : (report.winner || (report.overallScore >= 7.5 ? 'USER' : 'OPPONENT'));

  const copyToClipboard = () => {
    const text = `# PERFORMANCE EVALUATION RECORD: DEALDEBATE
Topic: ${scenario}
Format: ${opponent.scenarioType || 'Debate'}
Counterpart: DealDebate (${opponent.title} at ${opponent.company})
Score: ${report.overallScore}/10 (Grade: ${report.overallGrade})
Winner: ${winner === 'USER' ? 'User' : winner === 'OPPONENT' ? 'DealDebate' : 'Draw'}

## Verdict
${verdictText}

## 3 Key Strengths (With Quoted Moments)
${displayStrengths
  .map(
    (s, i) => `### ${i + 1}. ${s.title}
- What You Said: "${s.quote}"
- Impact: ${s.explanation}`
  )
  .join('\n\n')}

## 3 Concrete Improvements (With Rewritten Examples)
${displayImprovements
  .slice(0, 3)
  .map(
    (imp, i) => `### ${i + 1}. ${imp.title}
- What You Said: "${imp.quote}"
- Deficit: ${imp.critique}
- Rewritten Example: "${imp.rewrite}"`
  )
  .join('\n\n')}

## Core Competency Scores (Out of 10)
- Persuasion: ${report.persuasion.score}/10 — ${report.persuasion.reason}
- Handling Objections: ${report.handlingObjections.score}/10 — ${report.handlingObjections.reason}
- Concessions: ${report.concessions.score}/10 — ${report.concessions.reason}
- Closing: ${report.closing.score}/10 — ${report.closing.reason}

## Strategic Directive
${report.topTip}
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const pillars = [
    { name: 'Persuasion', score: report.persuasion.score, reason: report.persuasion.reason },
    { name: 'Handling Objections', score: report.handlingObjections.score, reason: report.handlingObjections.reason },
    { name: 'Concessions', score: report.concessions.score, reason: report.concessions.reason },
    { name: 'Closing', score: report.closing.score, reason: report.closing.reason },
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
            {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-none border border-[#111111] bg-white text-[#111111] hover:bg-neutral-50 text-xs uppercase tracking-wider font-medium transition-colors active:scale-[0.99]"
                title="View previous session transcripts & report cards"
              >
                <History className="w-3.5 h-3.5 text-neutral-600" />
                <span>History</span>
                {historyCount > 0 && (
                  <span className="font-mono text-[10px] bg-[#111111] text-white px-1.5 py-0.5 leading-none">
                    {historyCount}
                  </span>
                )}
              </button>
            )}

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

        {/* The Clean, Impressive Results Sheet (Luxury Black-and-White Editorial) */}
        <div className="bg-white border border-[#111111] rounded-none p-6 sm:p-10 space-y-9 shadow-none">
          
          {/* 1. Header & Big Overall Scorecard Bar */}
          <div className="border-b border-[#111111] pb-7 space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold border border-[#e5e5e5] px-2 py-0.5 bg-neutral-50">
                    {opponent.scenarioType || 'Simulation'}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                    6-Round Evaluation
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-normal text-[#111111] tracking-tight leading-tight">
                  {scenario}
                </h1>

                <div className="text-xs text-neutral-600 font-sans flex flex-wrap items-center gap-2 pt-1">
                  <span>Opponent: <strong className="text-[#111111] font-medium">DealDebate</strong> ({opponent.title})</span>
                  <span>·</span>
                  <span>Difficulty: <strong className="text-[#111111] font-mono text-[11px] uppercase">{opponent.difficulty || 'EASY'}</strong></span>
                  {opponent.stakes && (
                    <>
                      <span>·</span>
                      <span className="font-mono text-neutral-700 bg-neutral-50 px-1.5 py-0.5 border border-[#e5e5e5]">Stakes: {opponent.stakes}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Big Overall Score Display */}
              <div className="border border-[#111111] p-5 text-center bg-neutral-50 shrink-0 min-w-[160px] self-start md:self-auto">
                <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">
                  Overall Score
                </div>
                <div className="text-4xl sm:text-5xl font-serif text-[#111111] font-normal my-1">
                  {report.overallScore} <span className="text-sm text-neutral-500 font-sans font-normal">/ 10</span>
                </div>
                <div className="inline-block border border-[#111111] px-2.5 py-0.5 text-xs uppercase tracking-wider font-semibold font-mono bg-white text-[#111111]">
                  Grade: {report.overallGrade}
                </div>
              </div>

            </div>

            {/* 2. One-Line Verdict Banner (Clear & High-Impact) */}
            <div className="border border-[#111111] p-4 sm:p-5 bg-neutral-50 text-[#111111]">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Official Simulation Verdict
                </span>
                <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border font-semibold ${
                  winner === 'USER' 
                    ? 'bg-[#111111] text-white border-[#111111]' 
                    : winner === 'OPPONENT' 
                    ? 'bg-neutral-200 text-[#111111] border-[#111111]' 
                    : 'bg-white text-[#111111] border-[#111111]'
                }`}>
                  {winner === 'USER' ? '★ Decision: User Won' : winner === 'OPPONENT' ? 'Decision: DealDebate Edge' : 'Decision: Balanced Draw'}
                </span>
              </div>
              <p className="text-sm sm:text-base font-serif text-[#111111] leading-relaxed">
                "{cleanVerdict}"
              </p>
            </div>
          </div>

          {/* 3. 3 Specific Strengths (With Quoted Moments) */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#111111] flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#111111]" />
                <span>3 Key Strengths (With Quoted Moments)</span>
              </h2>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400">Verbatim audit</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {displayStrengths.slice(0, 3).map((item, idx) => (
                <div 
                  key={idx} 
                  className="border border-[#111111] p-4 sm:p-5 bg-white flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-widest font-mono text-neutral-400">
                      Strength #{idx + 1}
                    </div>
                    <h3 className="font-serif text-base font-medium text-[#111111] leading-snug">
                      {item.title}
                    </h3>
                    <div className="p-2.5 border border-[#e5e5e5] bg-neutral-50 text-[11px] font-mono text-neutral-700 italic leading-relaxed">
                      "{cleanQuote(item.quote)}"
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 leading-relaxed font-sans pt-1 border-t border-[#f0f0f0]">
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 4. 3 Concrete Improvements (With Quoted Moments & Rewritten Examples) */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#111111] flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-neutral-500" />
                <span>3 Concrete Improvements (With Rewritten Examples)</span>
              </h2>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400">Tactical upgrades</span>
            </div>

            <div className="space-y-4">
              {displayImprovements.slice(0, 3).map((item, idx) => (
                <div 
                  key={idx} 
                  className="border border-[#e5e5e5] hover:border-[#111111] p-5 bg-white space-y-3 transition-colors"
                >
                  <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 border border-[#111111] bg-neutral-50 font-semibold text-[#111111]">
                        #{idx + 1}
                      </span>
                      <h3 className="font-serif text-base font-medium text-[#111111]">
                        {item.title}
                      </h3>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-mono">
                      Opportunity for Growth
                    </span>
                  </div>

                  {/* Quoted Moment & Critique */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold block mb-1">
                        What You Said (Quoted Moment):
                      </span>
                      <div className="p-3 border border-[#e5e5e5] bg-neutral-50 font-mono text-[11px] text-neutral-700 italic leading-relaxed">
                        "{cleanQuote(item.quote)}"
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold block mb-1">
                        Tactical Critique:
                      </span>
                      <p className="text-neutral-600 leading-relaxed pt-1">
                        {item.critique}
                      </p>
                    </div>
                  </div>

                  {/* Rewritten Example */}
                  <div className="pt-2 border-t border-[#f0f0f0]">
                    <span className="text-[10px] uppercase tracking-widest text-[#111111] font-bold block mb-1">
                      Rewritten Example (What You Could Have Said):
                    </span>
                    <div className="p-3 bg-neutral-100 border border-[#111111] text-[#111111] font-sans font-medium text-xs sm:text-sm leading-relaxed">
                      "{cleanQuote(item.rewrite)}"
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Core Competency Scores (At-a-Glance Grid, Not Wall of Text) */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#111111]">
              Core Competency Breakdown (Scores Out of 10)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-sans">
              {pillars.map((p, idx) => (
                <div key={idx} className="border border-[#111111] p-4 bg-white flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-2">
                    <span className="font-semibold text-xs uppercase tracking-wider text-[#111111]">{p.name}</span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 border border-[#111111] text-[#111111]">
                      {p.score}/10
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-relaxed">
                    {p.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Strategic Takeaway Directive */}
          <div className="border border-[#111111] bg-white p-5 space-y-1.5 font-sans">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#111111]">
              <Lightbulb className="w-3.5 h-3.5 text-neutral-600" />
              <span>Key Directive for Your Next Simulation</span>
            </div>
            <p className="text-sm font-medium text-[#111111] leading-relaxed">
              {report.topTip}
            </p>
          </div>

          {/* 7. Collapsible Chronological Transcript */}
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
                      <span>{m.role === 'assistant' ? `DealDebate (${opponent.title})` : 'You'}</span>
                      <span className="font-mono">Round {m.round}</span>
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
