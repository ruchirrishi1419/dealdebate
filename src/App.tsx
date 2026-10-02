import React, { useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { ChatScreen } from './components/ChatScreen';
import { ReportCardScreen } from './components/ReportCardScreen';
import { OpponentProfile, ChatMessage, ReportCard, ScenarioCategory, DifficultyLevel } from './types';
import { AlertCircle, X } from 'lucide-react';

export default function App() {
  const [screen, setScreen] = useState<'home' | 'chat' | 'report'>('home');
  const [scenario, setScenario] = useState('');
  const [category, setCategory] = useState<ScenarioCategory>('NEGOTIATION');
  const [opponent, setOpponent] = useState<OpponentProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isOpponentTyping, setIsOpponentTyping] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [reportCard, setReportCard] = useState<ReportCard | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatTimestamp = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Start negotiation from Home Screen
  const handleStartNegotiation = async (
    scenarioText: string,
    role: string,
    dealSize: string,
    selectedCategory: ScenarioCategory = 'NEGOTIATION',
    userRole?: string,
    difficulty: DifficultyLevel = 'EASY'
  ) => {
    setIsInitializing(true);
    setErrorMessage(null);
    setScenario(scenarioText);
    setCategory(selectedCategory);

    try {
      const res = await fetch('/api/negotiation/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scenario: scenarioText, 
          opponentRole: role, 
          dealSize,
          stakes: dealSize,
          userRole: userRole || '',
          category: selectedCategory,
          difficulty
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Failed to start negotiation');
      }

      const data = await res.json();
      if (!data || !data.opponent || !data.openingLine) {
        throw new Error('Unable to initialize opponent persona. Please try again.');
      }

      const oppProfile: OpponentProfile = data.opponent;
      if (userRole) oppProfile.userRole = userRole;
      if (dealSize) oppProfile.stakes = dealSize;
      oppProfile.difficulty = difficulty;
      const opening: string = data.openingLine;

      setOpponent(oppProfile);
      setMessages([
        {
          id: 'turn-0',
          role: 'assistant',
          content: opening,
          round: 1,
          timestamp: formatTimestamp(),
          hint: data.hint || undefined
        }
      ]);
      setCurrentRound(1);
      setReportCard(null);
      setScreen('chat');
    } catch (err: unknown) {
      console.error('Initialization error:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Unable to connect to opponent simulation. Please check your connection and try again.'
      );
    } finally {
      setIsInitializing(false);
    }
  };

  // Trigger evaluation
  const triggerEvaluation = async (
    activeScenario: string,
    activeOpponent: OpponentProfile,
    allMessages: ChatMessage[]
  ) => {
    setIsEvaluating(true);
    setErrorMessage(null);

    try {
      const historyPayload = allMessages.map((m) => ({
        role: m.role,
        content: m.content,
        round: m.round
      }));

      const res = await fetch('/api/negotiation/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: activeScenario,
          opponent: activeOpponent,
          history: historyPayload,
          category
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to evaluate negotiation rounds');
      }

      const report: ReportCard = await res.json();
      setReportCard(report);
      // Automatically transition to report card
      setScreen('report');
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Evaluation generation encountered an issue.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // User sends a message during a negotiation round
  const handleSendMessage = async (text: string) => {
    if (!opponent || isOpponentTyping || isEvaluating || currentRound > 6) return;

    const userTurn: ChatMessage = {
      id: `turn-u-${Date.now()}`,
      role: 'user',
      content: text,
      round: currentRound,
      timestamp: formatTimestamp()
    };

    const updatedWithUser = [...messages, userTurn];
    setMessages(updatedWithUser);
    setIsOpponentTyping(true);
    setErrorMessage(null);

    try {
      const historyPayload = updatedWithUser.map((m) => ({
        role: m.role,
        content: m.content,
        round: m.round
      }));

      const res = await fetch('/api/negotiation/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          opponent,
          history: historyPayload,
          currentRound,
          userMessage: text,
          category,
          difficulty: opponent.difficulty || 'EASY'
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Opponent failed to respond');
      }

      const data = await res.json();
      const oppTurn: ChatMessage = {
        id: `turn-a-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        round: currentRound,
        timestamp: formatTimestamp(),
        sentiment: data.sentiment,
        currentFocus: data.currentFocus,
        hint: data.hint || undefined
      };

      const finalMessagesForRound = [...updatedWithUser, oppTurn];
      setMessages(finalMessagesForRound);
      setIsOpponentTyping(false);

      if (currentRound < 6) {
        setCurrentRound((prev) => prev + 1);
      } else {
        // Round 6 has concluded!
        // Disable input and automatically trigger report card evaluation
        await triggerEvaluation(scenario, opponent, finalMessagesForRound);
      }
    } catch (err: unknown) {
      console.error(err);
      setIsOpponentTyping(false);
      setErrorMessage(err instanceof Error ? err.message : 'Error receiving opponent response.');
    }
  };

  // Early evaluate if requested by user
  const handleForceEvaluate = () => {
    if (opponent && messages.length >= 2) {
      triggerEvaluation(scenario, opponent, messages);
    }
  };

  // Restart same scenario
  const handleRestartSame = async () => {
    if (scenario) {
      handleStartNegotiation(
        scenario, 
        opponent?.title || '', 
        opponent?.stakes || '', 
        category,
        opponent?.userRole || '',
        opponent?.difficulty || 'EASY'
      );
    } else {
      setScreen('home');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] font-sans text-slate-200">
      {/* Global Error Banner */}
      {errorMessage && (
        <div className="bg-red-950/80 border-b border-red-800/80 px-4 py-2.5 text-xs text-red-200 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 hover:bg-red-900/60 rounded text-red-400 hover:text-red-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Screen Router */}
      {screen === 'home' && (
        <HomeScreen
          onStart={handleStartNegotiation}
          isLoading={isInitializing}
        />
      )}

      {screen === 'chat' && opponent && (
        <ChatScreen
          scenario={scenario}
          opponent={opponent}
          messages={messages}
          currentRound={currentRound}
          totalRounds={6}
          isOpponentTyping={isOpponentTyping}
          isEvaluating={isEvaluating}
          onSendMessage={handleSendMessage}
          onQuitToHome={() => setScreen('home')}
          onForceEvaluate={messages.length >= 4 ? handleForceEvaluate : undefined}
        />
      )}

      {screen === 'report' && opponent && reportCard && (
        <ReportCardScreen
          scenario={scenario}
          opponent={opponent}
          report={reportCard}
          messages={messages}
          onRestartSame={handleRestartSame}
          onNewScenario={() => {
            setReportCard(null);
            setMessages([]);
            setOpponent(null);
            setScreen('home');
          }}
        />
      )}
    </div>
  );
}
