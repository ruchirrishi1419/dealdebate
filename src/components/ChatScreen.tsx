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
  ChevronDown,
  ChevronUp,
  History,
  Mic,
  MicOff
} from 'lucide-react';
import { isSpeechRecognitionSupported } from '../utils/speechDebate';

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
  onOpenHistory?: () => void;
  historyCount?: number;
  onSwitchToVoiceMode?: () => void;
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
  onOpenHistory,
  historyCount = 0,
  onSwitchToVoiceMode,
}) => {
  const [inputText, setInputText] = useState('');
  const [collapsedHints, setCollapsedHints] = useState<Record<string, boolean>>({});
  const [isMicListening, setIsMicListening] = useState(false);
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Toggle dictation mic in text mode
  const handleToggleMic = () => {
    if (isMicListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsMicListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setMicNotice('Speech recognition is not supported in this browser.');
      setTimeout(() => setMicNotice(null), 3000);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let initialText = inputText;

      recognition.onstart = () => {
        setIsMicListening(true);
        setMicNotice(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          const combined = initialText 
            ? `${initialText.trim()} ${transcript.trim()}`
            : transcript.trim();
          setInputText(combined);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Text mode mic error:', event.error);
        if (event.error === 'not-allowed') {
          setMicNotice('Microphone permission was denied.');
          setTimeout(() => setMicNotice(null), 3500);
        }
        setIsMicListening(false);
      };

      recognition.onend = () => {
        setIsMicListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to start speech recognition', err);
      setIsMicListening(false);
      setMicNotice('Unable to access microphone.');
      setTimeout(() => setMicNotice(null), 3000);
    }
  };


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
    <div className="min-h-screen bg-white text-[#111111] flex flex-col h-screen font-sans">
      {/* Top Application Header Bar: Luxury Minimal Editorial */}
      <header className="bg-white border-b border-[#e5e5e5] px-4 sm:px-8 py-3.5 shrink-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Back button & scenario info */}
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              onClick={onQuitToHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none border border-[#111111] bg-white text-[11px] uppercase tracking-wider font-medium text-[#111111] hover:bg-neutral-50 transition-colors shrink-0 active:scale-[0.99]"
              title="Return to topics"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Topics</span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="font-serif font-medium text-base text-[#111111] truncate">
                  {scenario}
                </h1>
                {/* Difficulty Mode Badge */}
                {opponent.difficulty === 'EASY' ? (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] uppercase tracking-wider font-medium bg-neutral-100 text-[#111111] border border-[#111111] shrink-0">
                    Practice (Easy)
                  </span>
                ) : opponent.difficulty === 'HARD' ? (
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-none text-[10px] uppercase tracking-wider font-medium bg-[#111111] text-white border border-[#111111] shrink-0">
                    Interview (Hard)
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-none text-[10px] uppercase tracking-wider font-medium bg-neutral-100 text-neutral-800 border border-[#e5e5e5] shrink-0">
                    Medium
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-500 font-sans flex items-center gap-1.5 truncate mt-0.5">
                <span className="font-medium text-[#111111]">DealDebate</span>
                <span>({opponent.title})</span>
                {opponent.opponentTypeLabel && (
                  <>
                    <span>·</span>
                    <span className="text-neutral-700 font-medium">{opponent.opponentTypeLabel}</span>
                  </>
                )}
                <span>·</span>
                <span className="truncate">{opponent.company}</span>
              </div>
            </div>
          </div>

          {/* Right: Round Counter, History & Status */}
          <div className="flex items-center gap-3.5 shrink-0">
            {onSwitchToVoiceMode && (
              <button
                onClick={onSwitchToVoiceMode}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-[#111111] hover:bg-neutral-50 bg-white text-[#111111] text-[11px] uppercase tracking-wider font-medium font-sans transition-colors active:scale-[0.99]"
                title="Switch to Hands-Free Voice Mode"
              >
                <Mic className="w-3.5 h-3.5 text-neutral-700" />
                <span className="hidden sm:inline">Voice Mode</span>
              </button>
            )}

            {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-[#111111] hover:bg-neutral-50 bg-white text-[#111111] text-[11px] uppercase tracking-wider font-medium font-sans transition-colors active:scale-[0.99]"
                title="View previous session transcripts & report cards"
              >
                <History className="w-3.5 h-3.5 text-neutral-600" />
                <span className="hidden sm:inline">History</span>
                {historyCount > 0 && (
                  <span className="font-mono text-[10px] bg-[#111111] text-white px-1.5 py-0.5 leading-none">
                    {historyCount}
                  </span>
                )}
              </button>
            )}

            <div className="text-right font-sans">
              <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium">
                Round
              </div>
              <div className="text-xs font-semibold text-[#111111] font-mono">
                {currentRound > totalRounds ? '6 / 6 Completed' : `${currentRound} of ${totalRounds}`}
              </div>
            </div>

            {onForceEvaluate && currentRound >= 3 && !isCompleted && !isEvaluating && (
              <button
                onClick={onForceEvaluate}
                className="text-xs text-neutral-500 hover:text-[#111111] underline underline-offset-4 transition-colors font-sans active:scale-[0.99]"
                title="End session early and evaluate rounds completed"
              >
                Conclude Early
              </button>
            )}
          </div>
        </div>

        {/* Subtle 1.5px Progress Line */}
        <div className="w-full bg-[#f0f0f0] h-[2px] mt-3.5 overflow-hidden">
          <div
            className="bg-[#111111] h-full transition-all duration-200"
            style={{ width: `${isCompleted ? 100 : progressPercent}%` }}
          />
        </div>
      </header>

      {/* Opponent Posture Information Strip */}
      <div className="bg-neutral-50 border-b border-[#e5e5e5] px-4 sm:px-8 py-2.5 shrink-0 text-xs font-sans">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-neutral-700">
          <div className="flex items-center gap-2 truncate">
            <span className="font-medium text-[#111111] shrink-0 uppercase tracking-wider text-[10px]">
              {opponent.scenarioType === 'GROUP_DISCUSSION' ? 'Stance:' :
               opponent.scenarioType === 'INTERVIEW' ? 'Interviewer Focus:' :
               opponent.scenarioType === 'PITCHING' ? 'Investor Stance:' :
               opponent.scenarioType === 'EVERYDAY_SKILLS' ? 'Counterpart Focus:' : 'Buyer Stance:'}
            </span>
            <span className="text-neutral-600 truncate">{opponent.stance}</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-neutral-500 shrink-0 ml-4">
            {opponent.stakes && (
              <span className="font-mono text-[#111111] bg-white px-2 py-0.5 border border-[#e5e5e5]">
                Stakes: {opponent.stakes}
              </span>
            )}
            <div className="flex items-center gap-1.5 text-neutral-600">
              <AlertCircle className="w-3.5 h-3.5 text-neutral-400" />
              <span className="truncate max-w-xs">{opponent.initialObjection}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-6 max-w-5xl mx-auto w-full">
        {messages.map((msg, index) => {
          const isOpponent = msg.role === 'assistant';

          return (
            <div
              key={msg.id || index}
              className={`flex flex-col ${isOpponent ? 'items-start' : 'items-end'}`}
            >
              {/* Speaker Label */}
              <div className="flex items-center gap-2 mb-1.5 px-1 text-xs text-neutral-500 font-sans">
                {isOpponent ? (
                  <>
                    <span className="font-medium text-[#111111]">DealDebate</span>
                    <span>({opponent.title})</span>
                    {msg.round && <span>· Round {msg.round} of {totalRounds}</span>}
                  </>
                ) : (
                  <>
                    <span className="font-medium text-[#111111]">
                      You {opponent.userRole ? `(${opponent.userRole})` : ''}
                    </span>
                    <span>· Round {msg.round} of {totalRounds}</span>
                  </>
                )}
                <span>·</span>
                <span className="text-[11px] text-neutral-400 font-mono">{msg.timestamp}</span>
              </div>

              {/* Message Bubble: Opponent on left in white with thin border, User on right in deep ink black */}
              <div
                className={`max-w-[88%] sm:max-w-[75%] rounded-none p-5 text-sm leading-relaxed font-sans ${
                  isOpponent
                    ? 'bg-white border border-[#e5e5e5] text-[#111111]'
                    : 'bg-[#111111] text-white border border-[#111111]'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {isOpponent && msg.currentFocus && (
                  <div className="mt-3 pt-2.5 border-t border-[#f0f0f0] text-[11px] text-neutral-500 font-sans flex items-center gap-1.5">
                    <span className="font-medium text-[#111111] uppercase tracking-wider text-[10px]">Strategic Focus:</span>
                    <span>{msg.currentFocus}</span>
                  </div>
                )}

                {/* Collapsible Hint for EASY Mode */}
                {isOpponent && msg.hint && (
                  <div className="mt-3 pt-2.5 border-t border-[#e5e5e5]">
                    <button
                      type="button"
                      onClick={() => toggleHint(msg.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-sans font-medium uppercase tracking-wider text-neutral-600 hover:text-[#111111] transition-colors active:scale-[0.98]"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                      <span>{isHintVisible(msg.id) ? 'Hide Suggested Strategy' : 'View Suggested Strategy'}</span>
                      {isHintVisible(msg.id) ? (
                        <ChevronUp className="w-3 h-3 text-neutral-600" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-neutral-600" />
                      )}
                    </button>

                    {isHintVisible(msg.id) && (
                      <div className="mt-2 p-3 rounded-none bg-neutral-50 border border-[#e5e5e5] text-xs text-neutral-800 leading-relaxed font-sans flex items-start gap-2">
                        <span className="font-medium text-[#111111] uppercase tracking-wider text-[10px] shrink-0 mt-0.5">Strategy:</span>
                        <span>{msg.hint}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Functional Opponent Typing Indicator */}
        {isOpponentTyping && (
          <div className="flex flex-col items-start font-sans">
            <div className="flex items-center gap-2 mb-1.5 px-1 text-xs text-neutral-500">
              <span className="font-medium text-[#111111]">DealDebate</span>
              <span>formulating response...</span>
            </div>
            <div className="bg-neutral-50 border border-[#e5e5e5] rounded-none px-4 py-3 text-xs text-neutral-700 flex items-center gap-2.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#111111] shrink-0" />
              <span>
                {opponent.difficulty === 'EASY' 
                  ? 'Considering your points and formulating feedback...' 
                  : 'Analyzing logic and preparing objections...'}
              </span>
            </div>
          </div>
        )}

        {/* Evaluation Loading Banner */}
        {isEvaluating && (
          <div className="my-8 bg-white border border-[#111111] rounded-none p-6 text-center font-sans">
            <div className="w-8 h-8 mx-auto mb-2.5 text-[#111111] flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <h3 className="font-serif text-xl font-normal text-[#111111] mb-1">
              Compiling Executive Assessment Sheet
            </h3>
            <p className="text-xs text-neutral-600 max-w-md mx-auto font-sans leading-relaxed">
              Evaluating all 6 interaction turns across persuasion, handling objections, concession balance, and closing. Extracting verbatim quotes and executive rewrites...
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Input Console: Pure White, Sharp Outline */}
      <div className="border-t border-[#e5e5e5] bg-white px-4 sm:px-8 py-4 shrink-0 font-sans">
        <div className="max-w-5xl mx-auto">
          {isCompleted ? (
            <div className="bg-neutral-50 border border-[#e5e5e5] rounded-none p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-[#111111] font-medium text-xs mb-0.5 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-[#111111]" />
                <span>Simulation Complete</span>
              </div>
              <p className="text-xs text-neutral-600">
                All 6 debate rounds have concluded. Reviewing formal evaluation report card...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Active Coach Hint Line above input on EASY Mode */}
              {opponent.difficulty === 'EASY' && latestHint && !isOpponentTyping && (
                <div className="mb-3 p-3 rounded-none bg-neutral-50 border border-[#e5e5e5] text-xs text-neutral-800 flex items-start gap-2.5 font-sans">
                  <Lightbulb className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-[#111111] uppercase tracking-wider text-[10px] mr-2">Coach Strategy:</span>
                    <span>{latestHint}</span>
                  </div>
                </div>
              )}

              {/* Dictation Permission / Error notice */}
              {micNotice && (
                <div className="mb-2 p-2 bg-neutral-100 border border-[#111111] text-xs text-[#111111] flex items-center gap-2 font-sans">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{micNotice}</span>
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
                      : `Round ${currentRound} of ${totalRounds}: Enter your response to DealDebate (${opponent.title})...`
                  }
                  className="w-full bg-white border border-[#e5e5e5] focus:border-[#111111] focus:outline-none rounded-none px-4 py-3.5 pr-36 text-[#111111] placeholder-neutral-400 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm resize-none font-sans"
                />

                <div className="absolute right-3.5 bottom-3.5 flex items-center gap-2">
                  {/* Small Dictation Mic Button (Requirement 4) */}
                  <button
                    type="button"
                    onClick={handleToggleMic}
                    disabled={isOpponentTyping || isEvaluating || currentRound > totalRounds}
                    title={isMicListening ? "Stop listening" : "Dictate response with microphone"}
                    className={`p-2 rounded-none border transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed ${
                      isMicListening
                        ? 'bg-[#111111] text-white border-[#111111] animate-pulse'
                        : 'bg-white hover:bg-neutral-100 text-[#111111] border-[#111111]'
                    }`}
                  >
                    {isMicListening ? (
                      <MicOff className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Mic className="w-3.5 h-3.5 text-[#111111]" />
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={!inputText.trim() || isOpponentTyping || isEvaluating || currentRound > totalRounds}
                    className="px-4 sm:px-5 py-2 rounded-none bg-[#111111] hover:bg-black text-white font-medium text-xs uppercase tracking-wider font-sans border border-[#111111] disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-[0.98] flex items-center gap-1.5"
                  >
                    <span>Send</span>
                    <CornerDownLeft className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Status Footer */}
              <div className="flex items-center justify-between mt-2.5 text-[11px] text-neutral-400 font-sans px-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono">Round {currentRound} of {totalRounds}</span>
                  <span>·</span>
                  <span>Press <kbd className="px-1.5 py-0.5 border border-[#e5e5e5] text-neutral-700 bg-neutral-50 font-mono text-[10px]">Enter</kbd> to send</span>
                  <span>·</span>
                  <span><kbd className="px-1.5 py-0.5 border border-[#e5e5e5] text-neutral-700 bg-neutral-50 font-mono text-[10px]">Shift+Enter</kbd> for newline</span>
                </div>
                <div>
                  <span className="font-mono">{inputText.length} characters</span>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
