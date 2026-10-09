import React, { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { ChatScreen } from './components/ChatScreen';
import { VoiceScreen } from './components/VoiceScreen';
import { ReportCardScreen } from './components/ReportCardScreen';
import { HistorySidebar } from './components/HistorySidebar';
import { ModeSelectionModal } from './components/ModeSelectionModal';
import { OpponentProfile, ChatMessage, ReportCard, ScenarioCategory, DifficultyLevel, SavedSessionRecord } from './types';
import { AlertCircle, X } from 'lucide-react';
import { ensureVoicesLoaded } from './utils/speechDebate';

interface PendingDebateConfig {
  scenarioText: string;
  role: string;
  dealSize: string;
  selectedCategory: ScenarioCategory;
  userRole?: string;
  difficulty: DifficultyLevel;
}

export default function App() {
  const [screen, setScreen] = useState<'home' | 'chat' | 'voice' | 'report'>('home');
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

  // Mode Selection Modal state
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [pendingConfig, setPendingConfig] = useState<PendingDebateConfig | null>(null);

  // Session history records (persisted across page reloads in current browser session)
  const [savedRecords, setSavedRecords] = useState<SavedSessionRecord[]>(() => {
    try {
      const raw = sessionStorage.getItem('dealdebate_session_records');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load session history from storage', e);
    }
    return [];
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Preload and lock in DealDebate's voice on application mount
  useEffect(() => {
    ensureVoicesLoaded();
  }, []);

  const formatTimestamp = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Called when user picks a topic and difficulty on HomeScreen: prompts Mode Selection popup
  const handlePromptModeSelection = async (
    scenarioText: string,
    role: string,
    dealSize: string,
    selectedCategory: ScenarioCategory = 'NEGOTIATION',
    userRole?: string,
    difficulty: DifficultyLevel = 'EASY'
  ) => {
    setPendingConfig({
      scenarioText,
      role,
      dealSize,
      selectedCategory,
      userRole,
      difficulty
    });
    setIsModeModalOpen(true);
  };

  // Execute debate initialization with selected mode ('text' | 'voice')
  const handleStartNegotiationWithMode = async (mode: 'text' | 'voice') => {
    if (!pendingConfig) return;

    const {
      scenarioText,
      role,
      dealSize,
      selectedCategory,
      userRole,
      difficulty
    } = pendingConfig;

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
      oppProfile.name = 'DealDebate';
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

      // Close mode modal and enter selected screen
      setIsModeModalOpen(false);
      setScreen(mode === 'voice' ? 'voice' : 'chat');
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
          category,
          difficulty: activeOpponent.difficulty || 'EASY'
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to evaluate negotiation rounds');
      }

      const report: ReportCard = await res.json();
      setReportCard(report);

      // Archive record into session history
      const newRecord: SavedSessionRecord = {
        id: `session-${Date.now()}`,
        scenario: activeScenario,
        category,
        opponent: activeOpponent,
        messages: allMessages,
        reportCard: report,
        completedAt: new Date().toLocaleDateString([], { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        roundsCompleted: allMessages.filter((m) => m.role === 'user').length
      };

      setSavedRecords((prev) => {
        const updated = [newRecord, ...prev];
        try {
          sessionStorage.setItem('dealdebate_session_records', JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save to sessionStorage', e);
        }
        return updated;
      });

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
    if (scenario && opponent) {
      handlePromptModeSelection(
        scenario, 
        opponent.title || '', 
        opponent.stakes || '', 
        category,
        opponent.userRole || '',
        opponent.difficulty || 'EASY'
      );
    } else {
      setScreen('home');
    }
  };

  // View a record selected from the history drawer
  const handleSelectRecord = (record: SavedSessionRecord) => {
    setScenario(record.scenario);
    setCategory(record.category);
    setOpponent(record.opponent);
    setMessages(record.messages);
    setReportCard(record.reportCard);
    setCurrentRound(record.roundsCompleted + 1);
    setScreen('report');
    setIsHistoryOpen(false);
  };

  // Clear all archived records
  const handleClearHistory = () => {
    setSavedRecords([]);
    try {
      sessionStorage.removeItem('dealdebate_session_records');
    } catch (e) {
      console.error('Failed to clear sessionStorage', e);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#111111]">
      {/* Global Error Banner */}
      {errorMessage && (
        <div className="bg-neutral-100 border-b border-[#111111] px-4 py-2.5 text-xs text-[#111111] flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <AlertCircle className="w-4 h-4 text-[#111111] shrink-0" />
            <span className="flex-1">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 hover:bg-neutral-200 rounded-none text-[#111111] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Screen Router */}
      {screen === 'home' && (
        <HomeScreen
          onStart={handlePromptModeSelection}
          isLoading={isInitializing}
          onOpenHistory={() => setIsHistoryOpen(true)}
          historyCount={savedRecords.length}
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
          onOpenHistory={() => setIsHistoryOpen(true)}
          historyCount={savedRecords.length}
          onSwitchToVoiceMode={() => setScreen('voice')}
        />
      )}

      {screen === 'voice' && opponent && (
        <VoiceScreen
          scenario={scenario}
          opponent={opponent}
          messages={messages}
          currentRound={currentRound}
          totalRounds={6}
          isOpponentTyping={isOpponentTyping}
          isEvaluating={isEvaluating}
          onSendMessage={handleSendMessage}
          onSwitchToTextMode={() => setScreen('chat')}
          onQuitToHome={() => setScreen('home')}
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
          onOpenHistory={() => setIsHistoryOpen(true)}
          historyCount={savedRecords.length}
        />
      )}

      {/* Mode Selection Modal (Requirement 1) */}
      <ModeSelectionModal
        isOpen={isModeModalOpen}
        scenario={pendingConfig?.scenarioText || ''}
        difficulty={pendingConfig?.difficulty || 'EASY'}
        isLoading={isInitializing}
        onSelectMode={handleStartNegotiationWithMode}
        onClose={() => setIsModeModalOpen(false)}
      />

      {/* Session History Sidebar Drawer */}
      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={savedRecords}
        onSelectRecord={handleSelectRecord}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
