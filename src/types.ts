export type ScenarioCategory = 
  | 'NEGOTIATION' 
  | 'GROUP_DISCUSSION' 
  | 'INTERVIEW' 
  | 'PITCHING' 
  | 'EVERYDAY_SKILLS';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface OpponentProfile {
  name: string;
  title: string;
  company: string;
  stance: string;
  initialObjection: string;
  scenarioType?: ScenarioCategory;
  opponentTypeLabel?: string;
  userRole?: string;
  stakes?: string;
  difficulty?: DifficultyLevel;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  round: number;
  timestamp: string;
  sentiment?: string;
  currentFocus?: string;
  hint?: string;
}

export interface PillarScore {
  score: number;
  reason: string;
}

export interface WeakLineAnalysis {
  original: string;
  critique: string;
  rewrite: string;
}

export interface ReportCard {
  overallScore: number;
  overallGrade: string;
  dealOutcome: string;
  executiveSummary: string;
  persuasion: PillarScore;
  handlingObjections: PillarScore;
  concessions: PillarScore;
  closing: PillarScore;
  weakestLines: WeakLineAnalysis[];
  topTip: string;
}

export interface ScenarioPreset {
  id: string;
  category: ScenarioCategory;
  title: string;
  scenario: string;
  opponentRole: string;
  tag: string;
  opponentTypeLabel: string;
  defaultUserRole: string;
  defaultOpponentRole: string;
  defaultStakes: string;
}

export interface SessionConfig {
  scenario: string;
  userRole: string;
  opponentRole: string;
  stakes: string;
  category: ScenarioCategory;
  difficulty: DifficultyLevel;
}
