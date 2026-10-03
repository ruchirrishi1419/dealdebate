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
  Sparkles,
  Zap,
  Flame,
  Check,
  Info
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
  // Default difficulty is EASY (Practice mode) for students
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
    setSetupDifficulty('EASY'); // Default is always EASY for practice
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
      setupDifficulty
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
        return <Briefcase className="w-3.5 h-3.5 text-[#111111]" />;
      case 'GROUP_DISCUSSION':
        return <Users className="w-3.5 h-3.5 text-[#111111]" />;
      case 'INTERVIEW':
        return <UserCheck className="w-3.5 h-3.5 text-[#111111]" />;
      case 'PITCHING':
        return <TrendingUp className="w-3.5 h-3.5 text-[#111111]" />;
      case 'EVERYDAY_SKILLS':
        return <Home className="w-3.5 h-3.5 text-[#111111]" />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] flex flex-col font-sans">
      {/* Top Luxury Editorial Header */}
      <header className="bg-white border-b border-[#e5e5e5] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DealDebateLogo size={26} className="w-6.5 h-6.5 shrink-0" />
            <span className="font-serif font-semibold text-xl tracking-tight text-[#111111]">
              DealDebate
            </span>
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 hidden sm:inline border-l border-neutral-200 pl-3">
              Edition 2026
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-sans">
            <span className="hidden md:inline text-neutral-500 tracking-wide">
              Practice Mode · Medium · Interview Prep
            </span>
            <div className="h-3 w-px bg-neutral-200 hidden md:block" />
            <span className="text-[#111111] font-medium tracking-wider uppercase text-[10px]">
              Simulations
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area with generous whitespace */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-14 sm:py-20 flex-1 w-full space-y-16">
        
        {/* BRANDING: Big bold app name at top center with Playfair Display wordmark */}
        <section className="flex flex-col items-center justify-center text-center pt-4 pb-2">
          <div className="flex items-center justify-center gap-4 mb-4">
            <DealDebateLogo size={52} className="w-13 h-13 shrink-0" />
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-normal tracking-tight text-[#111111]">
              DealDebate
            </h1>
          </div>
          {/* Requested direct one line description */}
          <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed font-sans">
            Practise negotiations, group discussions and interviews with an AI opponent.
          </p>
        </section>

        {/* Custom Scenario Builder Box (Sharp Rectangular, Thin 1px Border, No Shadow) */}
        <section className="bg-white border border-[#e5e5e5] rounded-none p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0f0f0] pb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#111111] font-sans flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#111111]" />
              <span>Custom Simulation Workspace</span>
            </h2>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-neutral-500 mr-1 text-[11px] uppercase tracking-wider">Format:</span>
              <div className="inline-flex border border-[#e5e5e5] p-0.5 bg-neutral-50">
                {(['NEGOTIATION', 'GROUP_DISCUSSION', 'INTERVIEW', 'PITCHING', 'EVERYDAY_SKILLS'] as ScenarioCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCustomCategory(cat)}
                    className={`px-3 py-1 text-[11px] font-sans uppercase tracking-wider transition-colors active:scale-[0.99] ${
                      customCategory === cat
                        ? 'bg-[#111111] text-white font-medium'
                        : 'text-neutral-600 hover:text-[#111111]'
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

          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div>
              <textarea
                rows={2}
                value={customScenario}
                onChange={(e) => setCustomScenario(e.target.value)}
                placeholder="Enter any negotiation context, commercial problem, or debate motion to challenge DealDebate..."
                className="w-full bg-white border border-[#e5e5e5] focus:border-[#111111] focus:outline-none rounded-none p-3.5 text-sm text-[#111111] placeholder-neutral-400 transition-colors resize-none font-sans"
              />
            </div>

            {/* Difficulty selector on custom box */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#f0f0f0]">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-neutral-500 text-[11px] uppercase tracking-wider font-medium">Difficulty:</span>
                <div className="inline-flex border border-[#e5e5e5] p-0.5 bg-white">
                  <button
                    type="button"
                    onClick={() => setCustomDifficulty('EASY')}
                    className={`px-3 py-1 text-[11px] uppercase tracking-wider font-sans transition-colors active:scale-[0.99] ${
                      customDifficulty === 'EASY'
                        ? 'bg-[#111111] text-white font-medium'
                        : 'text-neutral-600 hover:text-[#111111]'
                    }`}
                  >
                    EASY (Practice)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomDifficulty('MEDIUM')}
                    className={`px-3 py-1 text-[11px] uppercase tracking-wider font-sans transition-colors active:scale-[0.99] ${
                      customDifficulty === 'MEDIUM'
                        ? 'bg-[#111111] text-white font-medium'
                        : 'text-neutral-600 hover:text-[#111111]'
                    }`}
                  >
                    MEDIUM
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomDifficulty('HARD')}
                    className={`px-3 py-1 text-[11px] uppercase tracking-wider font-sans transition-colors active:scale-[0.99] ${
                      customDifficulty === 'HARD'
                        ? 'bg-[#111111] text-white font-medium'
                        : 'text-neutral-600 hover:text-[#111111]'
                    }`}
                  >
                    HARD (Interview)
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-neutral-500 font-sans">
                {customDifficulty === 'EASY' ? 'Friendly posture · suggested coaching hints provided' :
                 customDifficulty === 'MEDIUM' ? 'Standard balanced commercial pushback' : 'Intense resistance · sharp objections & rigorous vocabulary'}
              </div>
            </div>

            {/* Optional Specific Details Accordion */}
            {showCustomDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#f0f0f0]">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-medium mb-1">Your Role</label>
                  <input
                    type="text"
                    value={customUserRole}
                    onChange={(e) => setCustomUserRole(e.target.value)}
                    placeholder="e.g. Founder, Account Executive, Candidate"
                    className="w-full bg-white border border-[#e5e5e5] focus:border-[#111111] focus:outline-none rounded-none px-3 py-2 text-xs text-[#111111] font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-medium mb-1">The Counterpart</label>
                  <input
                    type="text"
                    value={customOpponentRole}
                    onChange={(e) => setCustomOpponentRole(e.target.value)}
                    placeholder="e.g. CFO, General Partner, Debater"
                    className="w-full bg-white border border-[#e5e5e5] focus:border-[#111111] focus:outline-none rounded-none px-3 py-2 text-xs text-[#111111] font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-medium mb-1">Stakes / Specifics</label>
                  <input
                    type="text"
                    value={customStakes}
                    onChange={(e) => setCustomStakes(e.target.value)}
                    placeholder="e.g. Target budget, 15% discount, hiring level"
                    className="w-full bg-white border border-[#e5e5e5] focus:border-[#111111] focus:outline-none rounded-none px-3 py-2 text-xs text-[#111111] font-sans"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomDetails(!showCustomDetails)}
                className="text-xs text-neutral-600 hover:text-[#111111] flex items-center gap-1.5 self-start sm:self-auto font-sans transition-colors active:scale-[0.99]"
              >
                <Sliders className="w-3.5 h-3.5 text-neutral-500" />
                <span>{showCustomDetails ? 'Hide Parameters' : 'Specify Roles & Parameters (Optional)'}</span>
              </button>

              <button
                type="submit"
                disabled={isLoading || !customScenario.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-none bg-[#111111] hover:bg-black text-white font-medium text-xs uppercase tracking-wider font-sans border border-[#111111] disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-[0.99]"
              >
                <span>Launch Simulation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </section>

        {/* 5 Grouped Categories & Cards (Minimal Luxury Editorial Grid) */}
        <div className="space-y-14">
          {CATEGORIES.map((cat) => {
            const presets = SCENARIO_PRESETS.filter(p => p.category === cat.id);

            return (
              <section key={cat.id} className="space-y-4">
                {/* Category Header */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-3 border-b border-[#111111]">
                  <div className="flex items-center gap-3">
                    <div className="p-1 border border-[#e5e5e5] bg-neutral-50">
                      {getCategoryIcon(cat.id)}
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl font-normal text-[#111111] tracking-tight">
                        {cat.name}
                      </h2>
                    </div>
                  </div>

                  <div className="text-xs text-neutral-500 font-sans mt-1 sm:mt-0 tracking-wide">
                    <span>Opponent Posture: </span>
                    <span className="font-medium text-[#111111]">{cat.opponentRoleDescription}</span>
                  </div>
                </div>

                {/* Flat Rectangular Cards Grid: Pure White, Thin 1px Border, No Shadow */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {presets.map((preset) => {
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleCardClick(preset)}
                        className="bg-white border border-[#e5e5e5] hover:border-[#111111] rounded-none p-6 flex flex-col justify-between cursor-pointer transition-colors group text-left relative active:scale-[0.99]"
                      >
                        <div>
                          {/* Opponent Persona Tag */}
                          <div className="flex items-center justify-between text-xs mb-3">
                            <span className="text-[10px] uppercase tracking-wider text-neutral-500 border border-[#e5e5e5] px-2 py-0.5 bg-neutral-50 font-sans">
                              {preset.opponentTypeLabel}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-sans">
                              Adaptive
                            </span>
                          </div>

                          {/* Scenario Situation Title */}
                          <h3 className="font-serif text-lg font-medium text-[#111111] group-hover:text-black mb-2.5 leading-snug">
                            {preset.title}
                          </h3>

                          {/* Situation Context Description */}
                          <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                            {preset.tag}
                          </p>
                        </div>

                        {/* Card Footer */}
                        <div className="mt-6 pt-3.5 border-t border-[#f0f0f0] flex items-center justify-between text-xs text-neutral-400 group-hover:text-[#111111]">
                          <span className="font-sans uppercase tracking-wider text-[10px] text-neutral-500 group-hover:text-[#111111]">
                            Configure & Begin
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#111111] transition-transform" />
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

      {/* QUICK SETUP STEP MODAL: Sharp Rectangular Editorial Sheet */}
      {activePreset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white border border-[#111111] rounded-none p-6 sm:p-8 max-w-lg w-full space-y-5 text-left max-h-[92vh] overflow-y-auto font-sans">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[#e5e5e5] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] uppercase tracking-widest text-[#111111] border border-[#111111] px-2 py-0.5">
                    {activePreset.category.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-neutral-400 font-sans">· Setup</span>
                </div>
                <h3 className="font-serif text-2xl font-normal text-[#111111]">
                  Simulation Parameters
                </h3>
                <p className="text-xs text-neutral-600 mt-1 font-sans">
                  Select your practice tier and optionally refine context before starting.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActivePreset(null)}
                className="p-1.5 rounded-none text-neutral-500 hover:text-[#111111] border border-transparent hover:border-[#111111] transition-colors active:scale-[0.98]"
                title="Close setup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleStartCustomized} className="space-y-5">
              
              {/* DIFFICULTY SELECTOR (Default: EASY) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#111111] flex items-center gap-2">
                    <span>Difficulty Level</span>
                    <span className="text-[10px] text-neutral-500 font-normal lowercase tracking-normal">
                      (default: easy for student practice)
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* EASY BUTTON */}
                  <button
                    type="button"
                    onClick={() => setSetupDifficulty('EASY')}
                    className={`p-3 rounded-none border text-left transition-colors relative active:scale-[0.99] ${
                      setupDifficulty === 'EASY'
                        ? 'bg-neutral-100 border-[#111111] text-[#111111]'
                        : 'bg-white border-[#e5e5e5] text-neutral-600 hover:border-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-[#111111]">
                        <Sparkles className="w-3.5 h-3.5 text-neutral-600" />
                        <span>EASY</span>
                      </div>
                      {setupDifficulty === 'EASY' && (
                        <Check className="w-3.5 h-3.5 text-[#111111]" />
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-[#111111] mb-0.5 font-sans">Practice Mode</div>
                    <div className="text-[10px] text-neutral-600 leading-tight font-sans">
                      Encouraging posture, concessions on sound points, hints enabled.
                    </div>
                  </button>

                  {/* MEDIUM BUTTON */}
                  <button
                    type="button"
                    onClick={() => setSetupDifficulty('MEDIUM')}
                    className={`p-3 rounded-none border text-left transition-colors relative active:scale-[0.99] ${
                      setupDifficulty === 'MEDIUM'
                        ? 'bg-neutral-100 border-[#111111] text-[#111111]'
                        : 'bg-white border-[#e5e5e5] text-neutral-600 hover:border-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-[#111111]">
                        <Zap className="w-3.5 h-3.5 text-neutral-600" />
                        <span>MEDIUM</span>
                      </div>
                      {setupDifficulty === 'MEDIUM' && (
                        <Check className="w-3.5 h-3.5 text-[#111111]" />
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-[#111111] mb-0.5 font-sans">Standard</div>
                    <div className="text-[10px] text-neutral-600 leading-tight font-sans">
                      Standard enterprise firmness and realistic pushback.
                    </div>
                  </button>

                  {/* HARD BUTTON */}
                  <button
                    type="button"
                    onClick={() => setSetupDifficulty('HARD')}
                    className={`p-3 rounded-none border text-left transition-colors relative active:scale-[0.99] ${
                      setupDifficulty === 'HARD'
                        ? 'bg-neutral-100 border-[#111111] text-[#111111]'
                        : 'bg-white border-[#e5e5e5] text-neutral-600 hover:border-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-[#111111]">
                        <Flame className="w-3.5 h-3.5 text-neutral-600" />
                        <span>HARD</span>
                      </div>
                      {setupDifficulty === 'HARD' && (
                        <Check className="w-3.5 h-3.5 text-[#111111]" />
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-[#111111] mb-0.5 font-sans">Interview Prep</div>
                    <div className="text-[10px] text-neutral-600 leading-tight font-sans">
                      High pressure, sharp counter-arguments, rigorous vocabulary.
                    </div>
                  </button>
                </div>
              </div>

              {/* Situation / Motion */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-1.5">
                  {activePreset.category === 'GROUP_DISCUSSION' ? 'Motion / Thesis' : 'Scenario Context'}
                </label>
                <textarea
                  rows={2}
                  value={setupScenario}
                  onChange={(e) => setSetupScenario(e.target.value)}
                  className="w-full bg-white border border-[#e5e5e5] focus:border-[#111111] focus:outline-none rounded-none p-3 text-xs sm:text-sm text-[#111111] resize-none font-sans"
                  placeholder="Describe the context..."
                  required
                />
              </div>

              {/* Roles Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-medium mb-1">
                    Your Role
                  </label>
                  <input
                    type="text"
                    value={setupUserRole}
                    onChange={(e) => setSetupUserRole(e.target.value)}
                    className="w-full bg-white border border-[#e5e5e5] focus:border-[#111111] focus:outline-none rounded-none px-3 py-2 text-xs text-[#111111] font-sans"
                    placeholder="e.g. Account Executive, Founder"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-medium mb-1">
                    The Counterpart (Opponent)
                  </label>
                  <input
                    type="text"
                    value={setupOpponentRole}
                    onChange={(e) => setSetupOpponentRole(e.target.value)}
                    className="w-full bg-white border border-[#e5e5e5] focus:border-[#111111] focus:outline-none rounded-none px-3 py-2 text-xs text-[#111111] font-sans"
                    placeholder="e.g. Chief Financial Officer, Lead Debater"
                  />
                </div>
              </div>

              {/* Stakes & Numbers */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-medium mb-1">
                  Stakes / Numbers <span className="text-neutral-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={setupStakes}
                  onChange={(e) => setSetupStakes(e.target.value)}
                  className="w-full bg-white border border-[#e5e5e5] focus:border-[#111111] focus:outline-none rounded-none px-3 py-2 text-xs text-[#111111] font-sans"
                  placeholder="e.g. ₹50L contract, 20% discount target, valuation"
                />
                <p className="text-[11px] text-neutral-500 mt-1 font-sans">
                  Any specific amounts or criteria you enter will be factored in by DealDebate.
                </p>
              </div>

              {/* Action Buttons: Thin black outline, black fill on primary only */}
              <div className="pt-4 border-t border-[#e5e5e5] flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleSkipAndStart}
                  disabled={isLoading}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-none border border-[#111111] bg-white text-[#111111] hover:bg-neutral-50 text-xs uppercase tracking-wider font-medium font-sans transition-colors active:scale-[0.99]"
                >
                  Skip & Start Defaults
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setActivePreset(null)}
                    className="px-4 py-2.5 rounded-none border border-transparent hover:border-[#e5e5e5] text-neutral-600 hover:text-[#111111] text-xs uppercase tracking-wider font-medium font-sans transition-colors active:scale-[0.99]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading || !setupScenario.trim()}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-none bg-[#111111] hover:bg-black text-white text-xs uppercase tracking-wider font-medium font-sans border border-[#111111] transition-colors active:scale-[0.99] disabled:opacity-40"
                  >
                    {isLoading ? (
                      <span>Initializing...</span>
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

      {/* Luxury Editorial Footer */}
      <footer className="bg-white border-t border-[#e5e5e5] py-10 text-xs text-neutral-500 mt-20 font-sans">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <DealDebateLogo size={20} className="w-5 h-5 shrink-0" />
            <span className="font-serif font-semibold text-sm text-[#111111]">DealDebate</span>
            <span>—</span>
            <span>Simulation Platform for Professional Discourse</span>
          </div>

          <div className="flex items-center gap-4 text-neutral-400 text-[11px] uppercase tracking-wider">
            <span>Adaptive Opponents</span>
            <span>·</span>
            <span>3 Tiers</span>
            <span>·</span>
            <span>6-Round Assessment</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
