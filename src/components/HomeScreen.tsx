import React, { useState } from 'react';
import { SCENARIO_PRESETS, CATEGORIES } from '../data/presets';
import { ScenarioCategory, ScenarioPreset, DifficultyLevel } from '../types';
import { DealDebateLogo } from './DealDebateLogo';
import { 
  Briefcase, 
  Users, 
  UserCheck, 
  TrendingUp, 
  Home, 
  ArrowRight, 
  X,
  Sliders,
  ChevronRight,
  Sparkles,
  Zap,
  Flame,
  Check
} from 'lucide-react';

interface HomeScreenProps {
  onStart: (
    scenario: string, 
    opponentRole: string, 
    dealSize: string, 
    category: ScenarioCategory,
    userRole?: string,
    difficulty?: DifficultyLevel
  ) => Promise<void>;
  isLoading: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStart, isLoading }) => {
  // Quick setup modal state
  const [activePreset, setActivePreset] = useState<ScenarioPreset | null>(null);
  const [setupScenario, setSetupScenario] = useState('');
  const [setupUserRole, setSetupUserRole] = useState('');
  const [setupOpponentRole, setSetupOpponentRole] = useState('');
  const [setupStakes, setSetupStakes] = useState('');
  // Default difficulty is EASY (Practice mode) for students!
  const [setupDifficulty, setSetupDifficulty] = useState<DifficultyLevel>('EASY');

  // Custom scenario builder state
  const [customScenario, setCustomScenario] = useState('');
  const [customCategory, setCustomCategory] = useState<ScenarioCategory>('NEGOTIATION');
  const [customUserRole, setCustomUserRole] = useState('');
  const [customOpponentRole, setCustomOpponentRole] = useState('');
  const [customStakes, setCustomStakes] = useState('');
  const [customDifficulty, setCustomDifficulty] = useState<DifficultyLevel>('EASY');
  const [showCustomDetails, setShowCustomDetails] = useState(false);

  // Open the quick setup step when any card is clicked
  const handleCardClick = (preset: ScenarioPreset) => {
    setActivePreset(preset);
    setSetupScenario(preset.scenario);
    setSetupUserRole(preset.defaultUserRole);
    setSetupOpponentRole(preset.defaultOpponentRole);
    setSetupStakes(preset.defaultStakes);
    setSetupDifficulty('EASY'); // Default is always EASY for student practice
  };

  // Launch with customized details from modal
  const handleStartCustomized = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activePreset || !setupScenario.trim() || isLoading) return;

    onStart(
      setupScenario.trim(),
      setupOpponentRole.trim() || activePreset.opponentRole,
      setupStakes.trim(),
      activePreset.category,
      setupUserRole.trim() || activePreset.defaultUserRole,
      setupDifficulty
    );
  };

  // Launch immediately with sensible defaults (Skip and Start)
  const handleSkipAndStart = () => {
    if (!activePreset || isLoading) return;

    onStart(
      activePreset.scenario,
      activePreset.defaultOpponentRole,
      activePreset.defaultStakes,
      activePreset.category,
      activePreset.defaultUserRole,
      setupDifficulty // Uses selected difficulty (default EASY)
    );
  };

  // Submit custom text box
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customScenario.trim() || isLoading) return;

    onStart(
      customScenario.trim(),
      customOpponentRole.trim(),
      customStakes.trim(),
      customCategory,
      customUserRole.trim(),
      customDifficulty
    );
  };

  const getCategoryIcon = (category: ScenarioCategory) => {
    switch (category) {
      case 'NEGOTIATION':
        return <Briefcase className="w-4 h-4 text-blue-400" />;
      case 'GROUP_DISCUSSION':
        return <Users className="w-4 h-4 text-blue-400" />;
      case 'INTERVIEW':
        return <UserCheck className="w-4 h-4 text-blue-400" />;
      case 'PITCHING':
        return <TrendingUp className="w-4 h-4 text-blue-400" />;
      case 'EVERYDAY_SKILLS':
        return <Home className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-200 flex flex-col font-sans">
      {/* Top Application Bar */}
      <header className="bg-[#0f1624] border-b border-slate-800/90 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <DealDebateLogo size={28} className="w-7 h-7 shrink-0" />
            <span className="font-bold text-sm text-slate-100 tracking-tight">DealDebate</span>
            <span className="text-[11px] text-slate-500 hidden sm:inline border-l border-slate-800 pl-2.5">
              Simulation Lab
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="hidden md:inline text-slate-400">Practice Mode (Easy) · Medium · Interview Prep (Hard)</span>
            <div className="h-3.5 w-px bg-slate-800 hidden md:block" />
            <span className="text-slate-300 font-medium">Student Edition</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full space-y-12">
        
        {/* BRANDING: Big bold app name at top center with professional logo */}
        <section className="flex flex-col items-center justify-center text-center pt-2 pb-2">
          <div className="flex items-center justify-center gap-3.5 sm:gap-4 mb-3">
            <DealDebateLogo size={52} className="w-11 h-11 sm:w-13 sm:h-13 shrink-0" />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-sans">
              DealDebate
            </h1>
          </div>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
            Practice high-stakes communication against adaptive AI opponents.
            Select a situation context below, customize your stakes, and practice handling objections.
          </p>
        </section>

        {/* Custom Scenario Builder Box */}
        <section className="bg-[#131b2b] border border-slate-800 rounded-lg p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Or Enter Any Custom Scenario</span>
            </h2>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 mr-1 text-[11px]">Category:</span>
              <div className="inline-flex rounded-md border border-slate-800 p-0.5 bg-[#0b0f17]">
                {(['NEGOTIATION', 'GROUP_DISCUSSION', 'INTERVIEW', 'PITCHING', 'EVERYDAY_SKILLS'] as ScenarioCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCustomCategory(cat)}
                    className={`px-2 py-1 text-[11px] rounded font-medium transition-colors ${
                      customCategory === cat
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat === 'NEGOTIATION' ? 'Negotiation' :
                     cat === 'GROUP_DISCUSSION' ? 'GD Debate' :
                     cat === 'INTERVIEW' ? 'Interview' :
                     cat === 'PITCHING' ? 'Pitching' : 'Everyday'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleCustomSubmit} className="space-y-3">
            <div>
              <textarea
                rows={2}
                value={customScenario}
                onChange={(e) => setCustomScenario(e.target.value)}
                placeholder="Type your situation context or debate motion (e.g. Negotiate contract termination terms with a vendor, or Debate: Corporate governance in AI)..."
                className="w-full bg-[#0b0f17] border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none"
              />
            </div>

            {/* Difficulty selector on custom box */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 text-[11px] font-medium">Difficulty Level:</span>
                <div className="inline-flex rounded border border-slate-800 p-0.5 bg-[#0b0f17]">
                  <button
                    type="button"
                    onClick={() => setCustomDifficulty('EASY')}
                    className={`px-2.5 py-1 text-[11px] rounded font-medium transition-colors ${
                      customDifficulty === 'EASY'
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    EASY (Practice mode)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomDifficulty('MEDIUM')}
                    className={`px-2.5 py-1 text-[11px] rounded font-medium transition-colors ${
                      customDifficulty === 'MEDIUM'
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    MEDIUM
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomDifficulty('HARD')}
                    className={`px-2.5 py-1 text-[11px] rounded font-medium transition-colors ${
                      customDifficulty === 'HARD'
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    HARD (Interview prep)
                  </button>
                </div>
              </div>

              <span className="text-[11px] text-slate-500">
                {customDifficulty === 'EASY' ? '💡 Friendly & encouraging, includes helpful hints' :
                 customDifficulty === 'MEDIUM' ? 'Standard balanced pushback' : '🔥 Brutal pressure & expert vocabulary'}
              </span>
            </div>

            {/* Optional Specific Details Accordion */}
            {showCustomDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 pb-1 border-t border-slate-800/80">
                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1">Your Role</label>
                  <input
                    type="text"
                    value={customUserRole}
                    onChange={(e) => setCustomUserRole(e.target.value)}
                    placeholder="e.g. Founder, Account Lead, Candidate"
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1">The Other Side</label>
                  <input
                    type="text"
                    value={customOpponentRole}
                    onChange={(e) => setCustomOpponentRole(e.target.value)}
                    placeholder="e.g. CFO, General Partner, Debater"
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1">Stakes / Specific Numbers</label>
                  <input
                    type="text"
                    value={customStakes}
                    onChange={(e) => setCustomStakes(e.target.value)}
                    placeholder="e.g. Contract value, % target, timeline"
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowCustomDetails(!showCustomDetails)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 self-start sm:self-auto font-medium"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{showCustomDetails ? 'Hide Role & Stakes Details' : 'Add Custom Roles & Stakes (Optional)'}</span>
              </button>

              <button
                type="submit"
                disabled={isLoading || !customScenario.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span>Start Custom Session</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </section>

        {/* 5 Grouped Categories & Cards (No hard numbers, only situation context) */}
        <div className="space-y-10">
          {CATEGORIES.map((cat) => {
            const presets = SCENARIO_PRESETS.filter(p => p.category === cat.id);

            return (
              <section key={cat.id} className="space-y-3">
                {/* Category Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 rounded bg-[#131b2b] border border-slate-800">
                      {getCategoryIcon(cat.id)}
                    </div>
                    <div>
                      <h2 className="text-xs font-bold tracking-wider uppercase text-slate-200">
                        {cat.name}
                      </h2>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 mt-1 sm:mt-0 flex items-center gap-2">
                    <span>Opponent Model:</span>
                    <span className="font-medium text-slate-300">{cat.opponentRoleDescription}</span>
                  </div>
                </div>

                {/* Flat Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {presets.map((preset) => {
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleCardClick(preset)}
                        className="bg-[#131b2b] border border-slate-800 hover:border-slate-700 hover:bg-[#162033] rounded-lg p-5 flex flex-col justify-between cursor-pointer transition-colors group text-left relative"
                      >
                        <div>
                          {/* Opponent Persona Tag */}
                          <div className="flex items-center justify-between text-xs mb-2.5">
                            <span className="text-[11px] font-medium text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/60">
                              {preset.opponentTypeLabel}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              Configurable
                            </span>
                          </div>

                          {/* Scenario Situation Title */}
                          <h3 className="font-semibold text-sm text-slate-100 group-hover:text-white mb-2 leading-snug">
                            {preset.title}
                          </h3>

                          {/* Situation Context Description */}
                          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                            {preset.tag}
                          </p>
                        </div>

                        {/* Card Footer */}
                        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 group-hover:text-blue-400">
                          <span className="font-medium text-[11px]">
                            Click to configure & start
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

      </main>

      {/* QUICK SETUP STEP MODAL: Opens when any topic card is clicked */}
      {activePreset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#131b2b] border border-slate-800 rounded-xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative space-y-4 text-left max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/60">
                    {activePreset.category.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400">· Setup Step</span>
                </div>
                <h3 className="text-base font-bold text-slate-100">
                  Configure Simulation Details
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select your practice mode and customize parameters before starting.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActivePreset(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[#162033] transition-colors"
                title="Close setup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleStartCustomized} className="space-y-4">
              
              {/* DIFFICULTY SELECTOR (Default: EASY) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <span>Difficulty Level</span>
                    <span className="text-[10px] text-blue-400 font-normal">
                      (Default: EASY for student practice)
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* EASY BUTTON */}
                  <button
                    type="button"
                    onClick={() => setSetupDifficulty('EASY')}
                    className={`p-2.5 rounded-lg border text-left transition-colors relative ${
                      setupDifficulty === 'EASY'
                        ? 'bg-blue-950/50 border-blue-500 text-white'
                        : 'bg-[#0b0f17] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-blue-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>EASY</span>
                      </div>
                      {setupDifficulty === 'EASY' && (
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-200 mb-0.5">Practice Mode</div>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      Friendly, simple English, concedes after 2–3 good points. Includes hints!
                    </div>
                  </button>

                  {/* MEDIUM BUTTON */}
                  <button
                    type="button"
                    onClick={() => setSetupDifficulty('MEDIUM')}
                    className={`p-2.5 rounded-lg border text-left transition-colors relative ${
                      setupDifficulty === 'MEDIUM'
                        ? 'bg-blue-950/50 border-blue-500 text-white'
                        : 'bg-[#0b0f17] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-300">
                        <Zap className="w-3.5 h-3.5" />
                        <span>MEDIUM</span>
                      </div>
                      {setupDifficulty === 'MEDIUM' && (
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-200 mb-0.5">Standard</div>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      Realistic firm pushback, standard business negotiation.
                    </div>
                  </button>

                  {/* HARD BUTTON */}
                  <button
                    type="button"
                    onClick={() => setSetupDifficulty('HARD')}
                    className={`p-2.5 rounded-lg border text-left transition-colors relative ${
                      setupDifficulty === 'HARD'
                        ? 'bg-blue-950/50 border-blue-500 text-white'
                        : 'bg-[#0b0f17] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-rose-400">
                        <Flame className="w-3.5 h-3.5" />
                        <span>HARD</span>
                      </div>
                      {setupDifficulty === 'HARD' && (
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-200 mb-0.5">Interview Prep</div>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      Brutal, sharp objections, interrupts weak logic, expert vocabulary.
                    </div>
                  </button>
                </div>
              </div>

              {/* Situation / Motion */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {activePreset.category === 'GROUP_DISCUSSION' ? 'Debate Motion / Thesis' : 'Scenario Context'}
                </label>
                <textarea
                  rows={2}
                  value={setupScenario}
                  onChange={(e) => setSetupScenario(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  placeholder="Describe the motion or context..."
                  required
                />
              </div>

              {/* Roles Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Your Role
                  </label>
                  <input
                    type="text"
                    value={setupUserRole}
                    onChange={(e) => setSetupUserRole(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Account Executive, Founder, Candidate"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    The Other Side (Opponent)
                  </label>
                  <input
                    type="text"
                    value={setupOpponentRole}
                    onChange={(e) => setSetupOpponentRole(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Chief Financial Officer, Lead Debater"
                  />
                </div>
              </div>

              {/* Stakes & Numbers */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  The Stakes & Specific Numbers <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={setupStakes}
                  onChange={(e) => setSetupStakes(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. ₹50L contract, 20% discount target, seed round valuation, lease repairs"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Enter any specific currency amounts, percentages, or terms you want the opponent to challenge.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleSkipAndStart}
                  disabled={isLoading}
                  className="w-full sm:w-auto px-4 py-2 rounded border border-slate-800 bg-[#0b0f17] text-slate-300 hover:text-white hover:bg-[#162033] text-xs font-medium transition-colors"
                >
                  Skip and start with defaults
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setActivePreset(null)}
                    className="px-3 py-2 rounded text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading || !setupScenario.trim()}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors disabled:opacity-40"
                  >
                    {isLoading ? (
                      <span>Initializing Opponent...</span>
                    ) : (
                      <>
                        <span>Start Simulation ({setupDifficulty})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Corporate Trainer Footer */}
      <footer className="bg-[#0f1624] border-t border-slate-800/90 py-6 text-xs text-slate-400 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <DealDebateLogo size={20} className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-slate-300">DealDebate</span>
            <span>·</span>
            <span>Flexible Scenario Simulation Platform</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Adaptive Opponents</span>
            <span>·</span>
            <span>3 Difficulty Tiers</span>
            <span>·</span>
            <span>6-Round Assessment</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
