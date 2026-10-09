import React, { useState, useEffect, useRef } from 'react';
import { 
  OpponentProfile, 
  ChatMessage 
} from '../types';
import { 
  ArrowLeft, 
  MessageSquare, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Loader2, 
  Check, 
  AlertCircle
} from 'lucide-react';
import { 
  speakText, 
  isSpeechRecognitionSupported, 
  isSpeechSynthesisSupported 
} from '../utils/speechDebate';

interface VoiceScreenProps {
  scenario: string;
  opponent: OpponentProfile;
  messages: ChatMessage[];
  currentRound: number;
  totalRounds?: number;
  isOpponentTyping: boolean;
  isEvaluating: boolean;
  onSendMessage: (text: string) => Promise<void>;
  onSwitchToTextMode: () => void;
  onQuitToHome: () => void;
}

export const VoiceScreen: React.FC<VoiceScreenProps> = ({
  scenario,
  opponent,
  messages,
  currentRound,
  totalRounds = 6,
  isOpponentTyping,
  isEvaluating,
  onSendMessage,
  onSwitchToTextMode,
  onQuitToHome,
}) => {
  // Orb states:
  // (a) idle: slow, soft breathing pulse
  // (b) speaking: DealDebate speaking, ring glows brighter, rhythmic pulse
  // (c) user_turn: mic open, gentle ripple
  const [orbState, setOrbState] = useState<'idle' | 'speaking' | 'user_turn'>('idle');
  
  // Real-time live speech transcript for the user's turn
  const [liveUserTranscript, setLiveUserTranscript] = useState('');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // References for speech lifecycle
  const recognitionRef = useRef<any>(null);
  const cancelSpeechRef = useRef<(() => void) | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpokenMessageIdRef = useRef<string | null>(null);
  const isComponentMountedRef = useRef(true);
  const transcriptBottomRef = useRef<HTMLDivElement>(null);
  const isListeningActiveRef = useRef(false);

  // Find the latest assistant message
  const assistantMessages = messages.filter((m) => m.role === 'assistant');
  const latestAssistantMessage = assistantMessages[assistantMessages.length - 1];

  // Find latest user message
  const userMessages = messages.filter((m) => m.role === 'user');
  const latestUserMessage = userMessages[userMessages.length - 1];

  // Auto-scroll transcript strip to latest
  useEffect(() => {
    transcriptBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveUserTranscript, latestAssistantMessage?.content, latestUserMessage?.content]);

  // Clean up speech synthesis & recognition on unmount
  useEffect(() => {
    isComponentMountedRef.current = true;
    return () => {
      isComponentMountedRef.current = false;
      isListeningActiveRef.current = false;
      if (cancelSpeechRef.current) {
        cancelSpeechRef.current();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  // Check speech recognition support on mount - show friendly notice if absent
  useEffect(() => {
    if (!isSpeechRecognitionSupported()) {
      setStatusNotice('Speech recognition not supported in this browser. You can tap the orb to type or switch to Text Mode.');
    }
  }, []);

  // Start Speech Recognition when it is User's Turn
  const startListening = () => {
    if (!isSpeechRecognitionSupported()) {
      setStatusNotice('Microphone speech recognition is unavailable. Tap "Done Speaking" or switch to Text Mode.');
      setOrbState('user_turn');
      return;
    }

    // Stop any existing session
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      setLiveUserTranscript('');
      let accumulatedFinal = '';

      recognition.onstart = () => {
        if (!isComponentMountedRef.current) return;
        isListeningActiveRef.current = true;
        setOrbState('user_turn');
      };

      recognition.onresult = (event: any) => {
        if (!isComponentMountedRef.current) return;
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            accumulatedFinal += ' ' + event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentText = (accumulatedFinal + ' ' + interim).trim();
        setLiveUserTranscript(currentText);

        // Reset silence timer whenever user speaks
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // When user speaks something substantial, auto-submit after 2.4s of quiet
        if (currentText.length > 5) {
          silenceTimerRef.current = setTimeout(() => {
            if (isComponentMountedRef.current && isListeningActiveRef.current) {
              handleFinishUserSpeaking(currentText);
            }
          }, 2400);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition event note:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setStatusNotice('Microphone access not granted. Tap the orb to submit or switch to Text Mode.');
        }
      };

      recognition.onend = () => {
        // If still in user_turn and hasn't submitted yet:
        if (isComponentMountedRef.current && isListeningActiveRef.current && orbState === 'user_turn') {
          if (liveUserTranscript.trim().length > 6) {
            handleFinishUserSpeaking(liveUserTranscript.trim());
          } else {
            // Keep listening seamlessly
            try {
              recognition.start();
            } catch {}
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('SpeechRecognition start notice:', err);
      setStatusNotice('Unable to start mic. You can tap the orb to submit your response.');
      setOrbState('user_turn');
    }
  };

  // Stop listening and submit user turn into the debate loop
  const handleFinishUserSpeaking = async (overrideText?: string) => {
    isListeningActiveRef.current = false;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    const submissionText = (overrideText || liveUserTranscript).trim();
    if (!submissionText || isOpponentTyping || isEvaluating) {
      // If user had nothing recorded yet, prompt gently
      if (!submissionText) {
        setStatusNotice('No speech detected yet. Speak your counter-argument or tap the orb.');
      }
      return;
    }

    setStatusNotice(null);
    setOrbState('idle');
    setLiveUserTranscript('');
    await onSendMessage(submissionText);
  };

  // Voice Debate Loop Effect: Speaks DealDebate's response aloud, then opens mic automatically
  useEffect(() => {
    if (!latestAssistantMessage) return;

    // Avoid repeating the exact same message
    if (lastSpokenMessageIdRef.current === latestAssistantMessage.id) {
      return;
    }

    lastSpokenMessageIdRef.current = latestAssistantMessage.id;

    if (isAudioMuted || !isSpeechSynthesisSupported()) {
      // If muted or speech synthesis unsupported, immediately open mic for user's turn
      setOrbState('user_turn');
      startListening();
      return;
    }

    // Set state to DealDebate speaking
    setOrbState('speaking');

    // Cancel any prior speech
    if (cancelSpeechRef.current) {
      cancelSpeechRef.current();
    }

    // Speak aloud with DealDebate voice
    cancelSpeechRef.current = speakText(latestAssistantMessage.content, {
      onStart: () => {
        if (isComponentMountedRef.current) {
          setOrbState('speaking');
        }
      },
      onEnd: () => {
        if (!isComponentMountedRef.current) return;
        // When speech finishes: DO NOT switch to text mode!
        // Automatically open the mic and stay in voice screen hands-free
        if (currentRound <= totalRounds && !isEvaluating) {
          setOrbState('user_turn');
          startListening();
        } else {
          setOrbState('idle');
        }
      },
      onError: () => {
        if (!isComponentMountedRef.current) return;
        if (currentRound <= totalRounds && !isEvaluating) {
          setOrbState('user_turn');
          startListening();
        } else {
          setOrbState('idle');
        }
      }
    });
  }, [latestAssistantMessage?.id, isAudioMuted, currentRound, totalRounds, isEvaluating]);

  // Handle manual orb tap
  const handleOrbClick = () => {
    if (orbState === 'user_turn') {
      if (liveUserTranscript.trim().length > 0) {
        handleFinishUserSpeaking();
      } else {
        // Toggle listening if empty
        startListening();
      }
    } else if (orbState === 'idle' && !isOpponentTyping && !isEvaluating) {
      setOrbState('user_turn');
      startListening();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white text-[#111111] flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* Notice / Warning Bar */}
      {statusNotice && (
        <div className="bg-neutral-100 border-b border-[#111111]/15 px-4 py-2.5 text-xs text-[#111111] flex items-center justify-between gap-2 sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#111111] shrink-0" />
            <span>{statusNotice}</span>
          </div>
          <button 
            onClick={() => setStatusNotice(null)}
            className="text-[10px] uppercase font-mono tracking-wider font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Application Header Bar - White & Black Luxury Design */}
      <header className="px-4 sm:px-8 py-4 shrink-0 flex items-center justify-between border-b border-[#111111]/10 bg-white z-20">
        {/* Left: Exit to topics & Topic info */}
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={onQuitToHome}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#111111]/25 hover:border-[#111111] text-[#111111] text-[11px] uppercase tracking-wider font-medium bg-white hover:bg-neutral-100 transition-colors shrink-0"
            title="Return to topics"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Topics</span>
          </button>

          <div className="min-w-0">
            <h1 className="font-serif font-normal text-sm sm:text-base text-[#111111] truncate max-w-xs sm:max-w-md">
              {scenario}
            </h1>
            <p className="text-[11px] text-neutral-500 font-sans flex items-center gap-1.5 truncate">
              <span className="text-[#111111] font-medium">DealDebate</span>
              <span>({opponent.title})</span>
              <span>·</span>
              <span className="text-neutral-500 uppercase tracking-wider font-mono text-[10px]">
                {opponent.difficulty || 'EASY'}
              </span>
            </p>
          </div>
        </div>

        {/* Center: Round Counter - Matches App Header Language */}
        <div className="text-center px-2">
          <div className="font-mono text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#111111]">
            Round {Math.min(currentRound, totalRounds)} of {totalRounds}
          </div>
          <div className="text-[10px] text-neutral-400 uppercase tracking-wider hidden sm:block">
            Hands-Free Voice Mode
          </div>
        </div>

        {/* Right: Switch to Text & Audio Mute */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className="p-2 border border-[#111111]/20 hover:border-[#111111] text-[#111111] bg-white hover:bg-neutral-100 transition-colors"
            title={isAudioMuted ? 'Unmute DealDebate audio' : 'Mute DealDebate audio'}
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onSwitchToTextMode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white text-[11px] uppercase tracking-wider font-medium bg-white transition-colors"
            title="Switch to Text Mode"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Text Mode</span>
          </button>
        </div>
      </header>

      {/* Center: The Black Hole Orb Interface in Premium White Theme */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative bg-white">
        <div className="relative flex flex-col items-center justify-center">
          {/* Subtle Outer Accretion Haze - Light Grayscale Shade */}
          <div 
            className={`absolute rounded-full pointer-events-none transition-all duration-700 ${
              orbState === 'speaking'
                ? 'w-72 h-72 sm:w-96 sm:h-96 bg-neutral-200/50 blur-2xl scale-110'
                : orbState === 'user_turn'
                ? 'w-64 h-64 sm:w-80 sm:h-80 bg-neutral-200/60 blur-xl scale-105'
                : 'w-56 h-56 sm:w-72 sm:h-72 bg-neutral-100/70 blur-lg'
            }`}
          />

          {/* User's Turn: Pure CSS Concentric Ripple Waves */}
          {orbState === 'user_turn' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-[#111111]/80 animate-orb-ripple-1" />
              <div className="absolute w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-[#111111]/50 animate-orb-ripple-2" />
              <div className="absolute w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-[#111111]/30 animate-orb-ripple-3" />
            </div>
          )}

          {/* Pure CSS Black Hole Orb Sphere with Accretion Ring (Black Sphere, Glowing Accretion Ring) */}
          <div
            onClick={handleOrbClick}
            className={`relative rounded-full cursor-pointer transition-all duration-500 flex items-center justify-center select-none shadow-2xl ${
              orbState === 'speaking'
                ? 'w-48 h-48 sm:w-64 sm:h-64 animate-orb-speaking'
                : orbState === 'user_turn'
                ? 'w-48 h-48 sm:w-64 sm:h-64 scale-105 shadow-[0_0_0_3px_#111111,0_15px_40px_rgba(0,0,0,0.3)]'
                : 'w-48 h-48 sm:w-64 sm:h-64 animate-orb-idle'
            }`}
            style={{
              backgroundColor: '#0a0a0a',
              border:
                orbState === 'speaking'
                  ? '3px solid #111111'
                  : orbState === 'user_turn'
                  ? '2px solid #111111'
                  : '1.5px solid #262626',
            }}
            title={
              orbState === 'user_turn'
                ? 'Microphone is listening - speak your argument (tap to submit)'
                : orbState === 'speaking'
                ? 'DealDebate is speaking'
                : 'Standby - Tap to speak'
            }
          >
            {/* Center Horizon Circle */}
            <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-[#0d0d0d] flex flex-col items-center justify-center p-3 text-center pointer-events-none shadow-[inset_0_0_25px_rgba(255,255,255,0.06)] border border-neutral-800/80">
              {orbState === 'speaking' ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1 h-6">
                    <span className="w-1 h-3 bg-white animate-pulse" />
                    <span className="w-1 h-5 bg-white animate-pulse delay-75" />
                    <span className="w-1 h-2.5 bg-white animate-pulse delay-150" />
                    <span className="w-1 h-6 bg-white animate-pulse delay-100" />
                    <span className="w-1 h-4 bg-white animate-pulse delay-200" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-300">
                    DealDebate
                  </span>
                </div>
              ) : orbState === 'user_turn' ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-white animate-ping" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white font-semibold">
                    Listening
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-neutral-600" />
                  <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">
                    {isOpponentTyping || isEvaluating ? 'Formulating' : 'Standby'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Subtitle Status Indicator */}
          <div className="mt-8 text-center px-4 max-w-sm">
            <p className="text-xs uppercase tracking-widest font-mono text-neutral-600 font-medium">
              {orbState === 'speaking' && 'DealDebate is speaking...'}
              {orbState === 'user_turn' && 'Microphone open · Speak your counter-argument'}
              {orbState === 'idle' &&
                (isEvaluating
                  ? 'Compiling 6-round evaluation report...'
                  : isOpponentTyping
                  ? 'DealDebate is formulating rebuttal...'
                  : 'Ready · Waiting for input')}
            </p>

            {/* Quick Touch Action when User is speaking */}
            {orbState === 'user_turn' && liveUserTranscript.trim().length > 0 && (
              <button
                onClick={() => handleFinishUserSpeaking()}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#111111] text-white text-[11px] uppercase tracking-wider font-sans bg-[#111111] hover:bg-neutral-800 transition-colors shadow-sm"
              >
                <Check className="w-3 h-3" />
                <span>Done Speaking (Submit Turn)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Live Transcript Strip - White Theme with Black & Gray Tones */}
      <div className="bg-neutral-50/90 border-t border-[#111111]/15 px-4 sm:px-8 py-4 sm:py-5 shrink-0 z-20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-2 border-b border-[#111111]/10 pb-1.5">
            <span className="font-semibold text-[#111111]">Live Debate Transcript</span>
            <span className="text-neutral-500">
              {orbState === 'user_turn' ? '● Recording Speech' : 'Hands-Free Sync'}
            </span>
          </div>

          <div className="space-y-3 max-h-40 sm:max-h-52 overflow-y-auto pr-1">
            {/* DealDebate's latest spoken line */}
            {latestAssistantMessage && (
              <div className="border-l-2 border-[#111111] pl-3 py-0.5 bg-white p-2.5 border-t border-r border-b border-neutral-200">
                <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 font-semibold mb-0.5">
                  DealDebate ({opponent.title})
                </div>
                <p className="text-xs sm:text-sm text-[#111111] font-sans leading-relaxed">
                  "{latestAssistantMessage.content}"
                </p>
              </div>
            )}

            {/* User's current / latest speech exchange */}
            {orbState === 'user_turn' ? (
              <div className="border-l-2 border-[#111111] pl-3 py-0.5 bg-white p-2.5 border-t border-r border-b border-neutral-200 animate-in fade-in">
                <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-[#111111] font-semibold mb-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#111111] animate-pulse" />
                    You (Speaking)
                  </span>
                  {liveUserTranscript.trim().length > 0 && (
                    <button
                      onClick={() => handleFinishUserSpeaking()}
                      className="text-[9px] text-[#111111] hover:underline lowercase tracking-normal font-mono"
                    >
                      [tap to submit]
                    </button>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-[#111111] font-sans leading-relaxed italic">
                  {liveUserTranscript || 'Listening to your voice... Speak your response.'}
                </p>
              </div>
            ) : latestUserMessage && (
              <div className="border-l-2 border-neutral-400 pl-3 py-0.5 bg-white p-2.5 border-t border-r border-b border-neutral-200">
                <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 font-semibold mb-0.5">
                  You
                </div>
                <p className="text-xs sm:text-sm text-neutral-700 font-sans leading-relaxed">
                  "{latestUserMessage.content}"
                </p>
              </div>
            )}

            {/* Waiting indicator when generating rebuttal */}
            {isOpponentTyping && (
              <div className="flex items-center gap-2 text-xs text-neutral-600 italic pt-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#111111]" />
                <span>DealDebate is considering your argument...</span>
              </div>
            )}

            {/* Evaluation ongoing notice */}
            {isEvaluating && (
              <div className="flex items-center gap-2 text-xs text-[#111111] pt-1 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#111111]" />
                <span>Compiling final 6-round evaluation report...</span>
              </div>
            )}

            <div ref={transcriptBottomRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
