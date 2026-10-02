import React, { useState, useRef, useEffect } from 'react';
import { 
  OpponentProfile, 
  ChatMessage 
} from '../types';
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  CornerDownLeft,
  Loader2,
  Lightbulb,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ChatScreenProps {
  scenario: string;
  opponent: OpponentProfile;
  messages: ChatMessage[];
  currentRound: number;
  totalRounds?: number;
  isOpponentTyping: boolean;
  isEvaluating: boolean;
  onSendMessage: (text: string) => Promise<void>;
  onQuitToHome: () => void;
  onForceEvaluate?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  scenario,
  opponent,
  messages,
  currentRound,
  totalRounds = 6,
  isOpponentTyping,
  isEvaluating,
  onSendMessage,
  onQuitToHome,
  onForceEvaluate,
}) => {
  const [inputText, setInputText] = useState('');
  const [collapsedHints, setCollapsedHints] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Toggle individual hint collapse
  const toggleHint = (msgId: string) => {
    setCollapsedHints(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const isHintVisible = (msgId: string) => {
    return collapsedHints[msgId] !== true; // visible by default on EASY mode
  };

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpponentTyping, isEvaluating]);

  // Focus input when available
  useEffect(() => {
    if (!isOpponentTyping && !isEvaluating && currentRound <= totalRounds) {
      textareaRef.current?.focus();
    }
  }, [currentRound, isOpponentTyping, isEvaluating, totalRounds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isOpponentTyping || isEvaluating || currentRound > totalRounds) return;
    const text = inputText.trim();
    setInputText('');
    onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isCompleted = currentRound > totalRounds || (currentRound === totalRounds && isEvaluating);
  const progressPercent = Math.min(((currentRound - 1) / totalRounds) * 100, 100);

  // Find latest assistant hint for active coach tip bar
  const latestAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
  const latestHint = latestAssistantMessage?.hint;

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-200 flex flex-col h-screen font-sans">
      {/* Top Application Header Bar */}
      <header className="bg-[#0f1624] border-b border-slate-800 px-4 sm:px-6 py-3 shrink-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Back button & scenario info */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onQuitToHome}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-800 text-xs font-medium text-slate-300 hover:bg-[#162033] hover:text-white transition-colors shrink-0"
              title="Return to scenario library"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Topics</span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-sm text-slate-100 truncate">
                  {scenario}
                </h1>
                {/* Difficulty Mode Badge */}
                {opponent.difficulty === 'EASY' ? (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/70 text-blue-300 border border-blue-800/60 shrink-0">
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    <span>Practice Mode (Easy)</span>
                  </span>
                ) : opponent.difficulty === 'HARD' ? (
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/70 text-rose-300 border border-rose-800/60 shrink-0">
                    Interview Prep (Hard)
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                    Medium
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 truncate mt-0.5">
                <span className="font-medium text-slate-300">{opponent.name}</span>
                <span>({opponent.title})</span>
                {opponent.opponentTypeLabel && (
                  <>
                    <span>·</span>
                    <span className="text-blue-400 font-medium">{opponent.opponentTypeLabel}</span>
                  </>
                )}
                <span>·</span>
                <span className="truncate">{opponent.company}</span>
              </div>
            </div>
          </div>

          {/* Right: Round Counter & Status */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Session Progress
              </div>
              <div className="text-xs font-bold text-slate-200">
                {currentRound > totalRounds ? 'Completed (6 of 6)' : `Round ${currentRound} of ${totalRounds}`}
              </div>
            </div>

            {onForceEvaluate && currentRound >= 3 && !isCompleted && !isEvaluating && (
              <button
                onClick={onForceEvaluate}
                className="text-xs text-slate-400 hover:text-blue-400 underline underline-offset-2 transition-colors"
                title="End session early and evaluate rounds completed"
              >
                Conclude Early
              </button>
            )}
          </div>
        </div>

        {/* Subtle Progress Bar */}
        <div className="w-full bg-slate-800 h-1 mt-3 overflow-hidden rounded-full">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${isCompleted ? 100 : progressPercent}%` }}
          />
        </div>
      </header>

      {/* Opponent Posture Information Strip */}
      <div className="bg-[#131b2b] border-b border-slate-800/80 px-4 sm:px-6 py-2 shrink-0 text-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-slate-200 shrink-0">
              {opponent.scenarioType === 'GROUP_DISCUSSION' ? 'Debater Stance:' :
               opponent.scenarioType === 'INTERVIEW' ? 'Interviewer Focus:' :
               opponent.scenarioType === 'PITCHING' ? 'Investor Angle:' :
               opponent.scenarioType === 'EVERYDAY_SKILLS' ? 'Counterpart Posture:' : 'Buyer Stance:'}
            </span>
            <span className="text-slate-400 truncate">{opponent.stance}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 shrink-0 ml-4">
            {opponent.stakes && (
              <span className="font-mono text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/60">
                Stakes: {opponent.stakes}
              </span>
            )}
            <div className="flex items-center gap-1.5 text-slate-400">
              <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate max-w-xs">{opponent.initialObjection}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 max-w-5xl mx-auto w-full">
        {messages.map((msg, index) => {
          const isOpponent = msg.role === 'assistant';

          return (
            <div
              key={msg.id || index}
              className={`flex flex-col ${isOpponent ? 'items-start' : 'items-end'}`}
            >
              {/* Speaker Label */}
              <div className="flex items-center gap-2 mb-1 px-1 text-xs text-slate-400">
                {isOpponent ? (
                  <>
                    <span className="font-semibold text-slate-300">{opponent.name}</span>
                    <span>({opponent.title})</span>
                    {msg.round && <span>· Round {msg.round} of {totalRounds}</span>}
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-blue-300">
                      You {opponent.userRole ? `(${opponent.userRole})` : ''}
                    </span>
                    <span>· Round {msg.round} of {totalRounds}</span>
                  </>
                )}
                <span>·</span>
                <span className="text-[11px]">{msg.timestamp}</span>
              </div>

              {/* Message Bubble: Opponent on left in dark grey, User on right in royal blue */}
              <div
                className={`max-w-[88%] sm:max-w-[75%] rounded-lg p-4 text-sm leading-relaxed ${
                  isOpponent
                    ? 'bg-[#162033] border border-slate-700/60 text-slate-200'
                    : 'bg-blue-600 text-white'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {isOpponent && msg.currentFocus && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="font-semibold text-slate-300">Focus:</span>
                    <span>{msg.currentFocus}</span>
                  </div>
                )}

                {/* Collapsible Hint for EASY Mode */}
                {isOpponent && msg.hint && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => toggleHint(msg.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-amber-200 transition-colors"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{isHintVisible(msg.id) ? 'Hide Suggested Answer' : 'Show Suggested Answer'}</span>
                      {isHintVisible(msg.id) ? (
                        <ChevronUp className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-amber-400" />
                      )}
                    </button>

                    {isHintVisible(msg.id) && (
                      <div className="mt-1.5 p-2.5 rounded bg-amber-950/40 border border-amber-800/40 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2">
                        <span className="font-semibold text-amber-300 shrink-0">💡 Strategy:</span>
                        <span>{msg.hint}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Opponent Thinking Indicator */}
        {isOpponentTyping && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-1 px-1 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">{opponent.name}</span>
              <span>is typing response...</span>
            </div>
            <div className="bg-[#162033] border border-slate-700/60 rounded-lg p-3 text-xs text-slate-400 flex items-center gap-2.5">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>
                {opponent.difficulty === 'EASY' 
                  ? 'Considering your points and formulating a friendly reply...' 
                  : 'Formulating counter-arguments and objections...'}
              </span>
            </div>
          </div>
        )}

        {/* Evaluation Loading Banner */}
        {isEvaluating && (
          <div className="my-6 bg-[#131b2b] border border-slate-700/80 rounded-lg p-5 text-center">
            <div className="w-8 h-8 mx-auto mb-2 text-blue-400 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <h3 className="font-semibold text-sm text-slate-100 mb-1">
              Generating Formal Evaluation Assessment
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Analyzing transcript across all 6 rounds for persuasion, handling objections, concessions, and closing. Extracting verbatim quotes and executive rewrites...
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Input Console */}
      <div className="border-t border-slate-800 bg-[#0f1624] px-4 sm:px-6 py-4 shrink-0">
        <div className="max-w-5xl mx-auto">
          {isCompleted ? (
            <div className="bg-[#131b2b] border border-slate-800 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-slate-200 font-semibold text-xs mb-0.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                <span>Session Rounds Complete</span>
              </div>
              <p className="text-xs text-slate-400">
                Input is closed. All {totalRounds} debate turns have completed. Reviewing scorecard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Active Coach Hint Line above input on EASY Mode */}
              {opponent.difficulty === 'EASY' && latestHint && !isOpponentTyping && (
                <div className="mb-2.5 p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/50 text-xs text-blue-200/90 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-300 mr-1.5">Coach Hint:</span>
                    <span>{latestHint}</span>
                  </div>
                </div>
              )}

              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isOpponentTyping || isEvaluating || currentRound > totalRounds}
                  rows={3}
                  placeholder={
                    currentRound === totalRounds
                      ? `Final Round ${totalRounds} of ${totalRounds}: Deliver your closing argument and call for concrete resolution...`
                      : `Round ${currentRound} of ${totalRounds}: Enter your response to ${opponent.name}...`
                  }
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-lg px-4 py-3 pr-24 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm resize-none"
                />

                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isOpponentTyping || isEvaluating || currentRound > totalRounds}
                    className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                  >
                    <span>Send</span>
                    <CornerDownLeft className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Status Footer */}
              <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 px-1">
                <div className="flex items-center gap-2">
                  <span>Round {currentRound} of {totalRounds}</span>
                  <span>·</span>
                  <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">Enter</kbd> to send</span>
                  <span>·</span>
                  <span><kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">Shift+Enter</kbd> for new line</span>
                </div>
                <div>
                  <span>{inputText.length} characters</span>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
