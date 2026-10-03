import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '2mb' }));

export type ScenarioCategory = 
  | 'NEGOTIATION' 
  | 'GROUP_DISCUSSION' 
  | 'INTERVIEW' 
  | 'PITCHING' 
  | 'EVERYDAY_SKILLS';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  round?: number;
}

interface OpponentProfile {
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

// Safely get Gemini AI client instance
function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Robust JSON extraction from Gemini response text
function extractJson<T>(rawText: string | undefined): T | null {
  if (!rawText) return null;
  const trimmed = rawText.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // Strip markdown code fences
    const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim()) as T;
      } catch {
        // continue
      }
    }

    // Try finding outer braces
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as T;
      } catch {
        // continue
      }
    }
  }
  return null;
}

// Infer category from scenario keywords if not provided
function inferCategory(scenario: string, category?: string): ScenarioCategory {
  if (
    category === 'NEGOTIATION' || 
    category === 'GROUP_DISCUSSION' || 
    category === 'INTERVIEW' || 
    category === 'PITCHING' || 
    category === 'EVERYDAY_SKILLS'
  ) {
    return category;
  }
  const s = scenario.toLowerCase();

  // Pitching
  if (s.includes('pitch') || s.includes('investor') || s.includes('startup') || s.includes('business idea') || s.includes('seed')) {
    return 'PITCHING';
  }

  // Interview
  if (s.includes('interview') || s.includes('tell me about yourself') || s.includes('candidate') || s.includes('weakness')) {
    return 'INTERVIEW';
  }

  // Everyday skills
  if (s.includes('landlord') || s.includes('boss') || s.includes('politely') || s.includes('fix something') || s.includes('disagree with')) {
    return 'EVERYDAY_SKILLS';
  }

  // Group discussion
  if (
    s.includes('crypto') ||
    s.includes('wfh') ||
    s.includes('work from home') ||
    s.includes('office') ||
    s.includes('ban') ||
    s.includes('create more jobs') ||
    s.includes('group discussion') ||
    s.includes('gd') ||
    s.includes('debate') ||
    s.includes('vs')
  ) {
    return 'GROUP_DISCUSSION';
  }

  return 'NEGOTIATION';
}

// Realistic contextual fallback generator matching the exact scenario type
function generateFallbackPersona(
  scenario: string, 
  role?: string, 
  dealSize?: string, 
  category?: ScenarioCategory,
  difficulty: DifficultyLevel = 'EASY'
): { opponent: OpponentProfile; openingLine: string; hint?: string } {
  const sLower = scenario.toLowerCase();
  const cat = category || inferCategory(scenario);

  // --- EASY MODE: Friendly, simple, encouraging, with hints ---
  if (difficulty === 'EASY') {
    let opponentTitle = 'Collaborative Project Lead';
    let opponentTypeLabel = 'Friendly Counterpart';

    if (cat === 'GROUP_DISCUSSION') {
      opponentTitle = 'Discussion Panelist';
      opponentTypeLabel = 'Friendly Debater';
    } else if (cat === 'INTERVIEW') {
      opponentTitle = 'Supportive Hiring Manager';
      opponentTypeLabel = 'Encouraging Interviewer';
    } else if (cat === 'PITCHING') {
      opponentTitle = 'Angel Mentor & Investor';
      opponentTypeLabel = 'Helpful Investor';
    } else if (cat === 'EVERYDAY_SKILLS') {
      opponentTitle = 'Property Manager';
      opponentTypeLabel = 'Reasonable Landlord';
    } else {
      opponentTitle = 'Department Director';
      opponentTypeLabel = 'Cooperative Buyer';
    }

    return {
      opponent: {
        name: 'DealDebate',
        title: role || opponentTitle,
        company: 'Partnership Group',
        stance: 'Open-minded, friendly, and willing to agree once simple logical points are explained.',
        initialObjection: 'Keeping the plan simple, predictable, and fair for both sides.',
        scenarioType: cat,
        opponentTypeLabel,
        difficulty: 'EASY'
      },
      openingLine: `Thanks for talking with me today! I'm really open to your idea${dealSize ? ` regarding ${dealSize}` : ''}, but my main goal is making sure this is simple and doesn't create unexpected problems. Could you explain in simple terms what the main benefit is for both of us?`,
      hint: `Acknowledge their goal warmly and give one clear, simple reason why your proposal benefits both sides.`
    };
  }

  // --- 1. GROUP DISCUSSION (Opponent: Debater) ---
  if (cat === 'GROUP_DISCUSSION') {
    if (sLower.includes('crypto')) {
      return {
        opponent: {
          name: 'DealDebate',
          title: 'Senior Policy Debater & Monetary Analyst',
          company: 'National Economic Forum GD Panel',
          stance: 'Strongly argues for sovereign capital controls, warning of systemic financial contagion and unregulated retail speculation.',
          initialObjection: 'Threats to monetary sovereignty, illicit capital flight, and lack of consumer protection.',
          scenarioType: 'GROUP_DISCUSSION' as ScenarioCategory,
          opponentTypeLabel: 'Opposing Debater',
          difficulty
        },
        openingLine: `Before we entertain legalization or light-touch regulation, we have to acknowledge that cryptocurrency poses catastrophic risks to India's monetary sovereignty and foreign exchange reserves. Millions of unsophisticated retail investors are being exposed to extreme asset volatility with zero underlying collateral or legal recourse. Why should our central bank endorse an unregulated shadow currency that facilitates capital flight?`
      };
    }

    if (sLower.includes('wfh') || sLower.includes('work from home') || sLower.includes('office')) {
      return {
        opponent: {
          name: 'DealDebate',
          title: 'People Strategy Debater & Operations Lead',
          company: 'B-School Executive Round Table',
          stance: 'Defends in-person office collaboration, arguing remote work degrades organizational culture, mentoring, and serendipitous innovation.',
          initialObjection: 'Erosion of team cohesion, onboarding friction, and long-term creative stagnancy.',
          scenarioType: 'GROUP_DISCUSSION' as ScenarioCategory,
          opponentTypeLabel: 'Opposing Debater',
          difficulty
        },
        openingLine: `The productivity gains of remote work are largely illusory and short-lived; you cannot sustain cross-functional innovation or build high-trust company culture through Zoom Brady-bunch grids. Early-career professionals are stagnating without spontaneous osmosis, and cross-departmental alignment has suffered drastically. How do you propose solving the severe decline in tacit knowledge transfer when employees remain permanently siloed at home?`
      };
    }

    if (sLower.includes('job') || sLower.includes('ai')) {
      return {
        opponent: {
          name: 'DealDebate',
          title: 'Labor Economics Debater & Tech Critic',
          company: 'Global Policy Debate Series',
          stance: 'Argues AI automates cognitive labor exponentially faster than human retraining can absorb displaced workers.',
          initialObjection: 'Rapid white-collar obsolescence and acute structural employment friction.',
          scenarioType: 'GROUP_DISCUSSION' as ScenarioCategory,
          opponentTypeLabel: 'Opposing Debater',
          difficulty
        },
        openingLine: `Historical analogies to the steam engine or personal computers fall completely flat because generative AI replaces cognitive analytical reasoning rather than manual labor, compressing the disruption timeline from decades into months. Millions of knowledge workers—from paralegals and financial analysts to software engineers—face structural redundancy before new employment ecosystems can possibly emerge. Where exactly are displaced mid-career professionals supposed to transition overnight?`
      };
    }

    return {
      opponent: {
        name: 'DealDebate',
        title: 'Lead Debater & Panelist',
        company: 'Premier B-School GD Caucus',
        stance: 'Rigorous counter-debater who actively probes weak assumptions, statistical blindspots, and systemic unintended consequences.',
        initialObjection: 'Challenging underlying premises and highlighting operational trade-offs.',
        scenarioType: 'GROUP_DISCUSSION' as ScenarioCategory,
        opponentTypeLabel: 'Opposing Debater',
        difficulty
      },
      openingLine: `I strongly challenge the premise you are putting forward on this topic. When you examine the systemic empirical evidence, the trade-offs and unintended externalities far outweigh the short-term benefits you've outlined. What verifiable data points can you offer to refute the significant structural downsides of your stance?`
    };
  }

  // --- 2. INTERVIEW (Opponent: Interviewer) ---
  if (cat === 'INTERVIEW') {
    if (sLower.includes('tell me about yourself')) {
      return {
        opponent: {
          name: 'DealDebate',
          title: 'Executive Hiring Director',
          company: 'Vertex Global Leadership',
          stance: 'Probes for concise executive presence, distinct competitive positioning, and self-awareness without rehearsed monologues.',
          initialObjection: 'Filtering out generic career chronological lists to test authentic leadership identity.',
          scenarioType: 'INTERVIEW' as ScenarioCategory,
          opponentTypeLabel: 'Executive Interviewer',
          difficulty
        },
        openingLine: `I've read through your resume and career history, but I want to understand what actually drives your decision-making. Tell me about yourself: what is the single through-line that connects your major career leaps, and why does this specific challenge align with your trajectory right now?`
      };
    }

    if (sLower.includes('weakness')) {
      return {
        opponent: {
          name: 'DealDebate',
          title: 'VP of Talent & People',
          company: 'Apex Horizon Capital',
          stance: 'Cuts through cliché answers like "perfectionist" to evaluate genuine vulnerability, operational self-awareness, and mitigation systems.',
          initialObjection: 'Testing whether the candidate has genuine blindspot awareness and accountability mechanisms.',
          scenarioType: 'INTERVIEW' as ScenarioCategory,
          opponentTypeLabel: 'Executive Interviewer',
          difficulty
        },
        openingLine: `Please skip the rehearsed answers like 'I care too much' or 'I work too hard'—I want genuine executive self-awareness. What is your single biggest professional weakness or operational blind spot, and what concrete friction did it create in your most recent team?`
      };
    }

    // Defend best candidate
    return {
      opponent: {
        name: 'DealDebate',
        title: 'Managing Director & Panel Lead',
        company: 'Meridian Capital Partners',
        stance: 'Exacting executive interviewer who cuts through buzzwords, drills into failure management, and probes behavioral resilience.',
        initialObjection: 'Testing depth of real accountability versus rehearsed resume bullet points.',
        scenarioType: 'INTERVIEW' as ScenarioCategory,
        opponentTypeLabel: 'Senior Interviewer',
        difficulty
      },
      openingLine: `Your CV looks impressive on paper, but frankly, every finalist in this round has great pedigree and claims outsized impact. What specifically differentiates your execution capability from the other three candidates we interviewed this morning, and why should we take a risk on your leadership?`
    };
  }

  // --- 3. PITCHING (Opponent: Investor) ---
  if (cat === 'PITCHING') {
    if (sLower.includes('2 minute') || sLower.includes('startup')) {
      return {
        opponent: {
          name: 'DealDebate',
          title: 'Founding Partner',
          company: 'Nexus Seed Capital',
          stance: 'Impatient, high-velocity investor looking for immediate clarity on market problem severity, distribution edge, and monetization velocity.',
          initialObjection: 'Vague problem sizing and lack of proprietary unfair distribution channel.',
          scenarioType: 'PITCHING' as ScenarioCategory,
          opponentTypeLabel: 'Venture Partner',
          difficulty
        },
        openingLine: `I have back-to-back partner meetings today, so let's get straight to the point: what urgent, painful problem does your startup solve, and what is your proprietary distribution channel that keeps customer acquisition costs from devouring your margins? Give me your 2-minute pitch.`
      };
    }

    return {
      opponent: {
        name: 'DealDebate',
        title: 'General Partner',
        company: 'Apex Horizon Ventures',
        stance: 'Skeptical early-stage investor who aggressively tests unit economics, customer acquisition friction, and defensibility against incumbents.',
        initialObjection: 'Unproven customer acquisition moats and excessive vulnerability to fast-follower tech giants.',
        scenarioType: 'PITCHING' as ScenarioCategory,
        opponentTypeLabel: 'Skeptical Investor',
        difficulty
      },
      openingLine: `Your pitch deck outlines an attractive total addressable market, but I see virtually zero structural moat against well-capitalized incumbents who can duplicate your core workflow in a single release cycle. On top of that, your CAC-to-LTV payback math looks deeply unrealistic in today's paid acquisition climate. Why should our fund write a seed check before you demonstrate true customer lock-in?`
    };
  }

  // --- 4. EVERYDAY SKILLS (Opponent: Landlord, Boss, Recruiter) ---
  if (cat === 'EVERYDAY_SKILLS') {
    if (sLower.includes('landlord') || sLower.includes('fix') || sLower.includes('apartment') || sLower.includes('rent')) {
      return {
        opponent: {
          name: 'DealDebate',
          title: 'Property Owner & Landlord',
          company: 'Highland Residential Management',
          stance: 'Reluctant, budget-averse landlord who deflects maintenance requests, delays repairs, and questions the severity of the issue.',
          initialObjection: 'Avoids costly vendor call-outs and insists routine wear-and-tear is tenant responsibility.',
          scenarioType: 'EVERYDAY_SKILLS' as ScenarioCategory,
          opponentTypeLabel: 'Reluctant Landlord',
          difficulty
        },
        openingLine: `Look, I received your message about the issue, but our maintenance contractor charges emergency rates and the building was inspected just four months ago. Most tenants manage minor plumbing or appliance quirks themselves without needing expensive call-outs. Why can't this wait until our regular quarterly vendor visit next month?`
      };
    }

    if (sLower.includes('boss') || sLower.includes('disagree') || sLower.includes('politely')) {
      return {
        opponent: {
          name: 'DealDebate',
          title: 'Vice President & Direct Manager',
          company: 'Enterprise Strategy Group',
          stance: 'Senior manager who prefers alignment over disruption, values strategic discipline, and pushes back on last-minute plan revisions.',
          initialObjection: 'Wants solid data before altering a strategy that has already been approved by executive stakeholders.',
          scenarioType: 'EVERYDAY_SKILLS' as ScenarioCategory,
          opponentTypeLabel: 'Direct Boss',
          difficulty
        },
        openingLine: `I hear that you have concerns about the Q3 project roadmap, but this rollout strategy was already cleared with the leadership committee two weeks ago. Reopening the plan now introduces major delivery risk and delays our milestones. If you want to challenge this direction, what specific data or operational blocker are you seeing that the rest of the team missed?`
      };
    }

    // Negotiating salary with new employer
    return {
      opponent: {
        name: 'DealDebate',
        title: 'Senior Talent Acquisition Lead',
        company: 'Vanguard Global Talent',
        stance: 'Recruiter working with strict compensation band ceilings who wants to close the hire quickly without inflating offer packages.',
        initialObjection: 'Compensation bands are calibrated against internal equity, and requests for higher base require tradeoffs.',
        scenarioType: 'EVERYDAY_SKILLS' as ScenarioCategory,
        opponentTypeLabel: 'Hiring Recruiter',
        difficulty
      },
      openingLine: `We are thrilled to extend this offer and believe you will do great work with the team, but the compensation package we outlined reflects the top percentile of our budget band for this tier. We want to wrap up this search this week. What specific benchmark or consideration makes you feel an adjustment is necessary before signing?`
    };
  }

  // --- 5. NEGOTIATION (Opponent: CFO, Manager, Vendor) ---
  if (sLower.includes('salary') || sLower.includes('manager')) {
    return {
      opponent: {
        name: 'DealDebate',
        title: 'Senior Engineering Director',
        company: 'CloudMatrix Technologies',
        stance: 'Strict manager managing tight departmental budget bands who requires undeniable, quantified business justification.',
        initialObjection: 'Fixed compensation band limits and fairness across the existing engineering peer group.',
        scenarioType: 'NEGOTIATION' as ScenarioCategory,
        opponentTypeLabel: 'Division Manager',
        difficulty
      },
      openingLine: `I appreciate you scheduling this, but as you know, our division is under strict guidance from leadership to cap compensation adjustments at standard merit increases this cycle. ${dealSize ? `An adjustment of ${dealSize}` : 'An out-of-cycle compensation increase'} would disrupt equity across your entire peer band. What extraordinary, revenue-impacting outcomes did you drive this past quarter that justify overriding established HR bands?`
    };
  }

  if (sLower.includes('vendor') || sLower.includes('pricing') || sLower.includes('supplier')) {
    return {
      opponent: {
        name: 'DealDebate',
        title: 'VP of Commercial Accounts',
        company: 'Apex Component Solutions',
        stance: 'Commercial vendor lead defending gross margins against client procurement squeezes; highlights inflation and service SLA costs.',
        initialObjection: 'Upstream supply chain inflation and maintaining dedicated account support levels.',
        scenarioType: 'NEGOTIATION' as ScenarioCategory,
        opponentTypeLabel: 'Supplier Executive',
        difficulty
      },
      openingLine: `${dealSize ? `Your request for ${dealSize}` : 'A major pricing concession'} is completely detached from the reality of our current cost baseline, especially when raw input and freight expenses have risen 12% over the last year. We already provide dedicated technical account management and priority delivery that your team depends on daily. Why should our business subsidize your budget cuts by taking a loss on this contract?`
    };
  }

  // Default: Enterprise Software Deal with CFO
  return {
    opponent: {
      name: 'DealDebate',
      title: 'Chief Financial Officer',
      company: 'Apex Enterprise Group',
      stance: 'Capital preservation hawk; operating under strict quarterly IT capex austerity measures.',
      initialObjection: 'Unsubstantiated ROI and excessive upfront cash outlay versus existing legacy systems.',
      scenarioType: 'NEGOTIATION' as ScenarioCategory,
      opponentTypeLabel: 'Hesitant CFO',
      difficulty
    },
    openingLine: `I only have fifteen minutes, and to be blunt, your ${dealSize ? `${dealSize}` : 'software'} proposal is facing severe headwinds against our mandate to cut discretionary IT spend. We already have functional legacy workflows, so unless you can prove immediate hard-dollar payback within two quarters, I cannot justify approving this. Why should this be our priority right now?`
  };
}

// Fallback turns based on scenario category and difficulty
function generateFallbackTurn(
  round: number, 
  userMessage: string, 
  opponentName: string, 
  isFinal: boolean, 
  category?: ScenarioCategory,
  difficulty: DifficultyLevel = 'EASY'
): { reply: string; sentiment: string; currentFocus: string; hint?: string } {
  const cat = category || 'NEGOTIATION';

  // --- EASY MODE: Gives in after 2-3 good answers, simple English, friendly tone, helpful hints ---
  if (difficulty === 'EASY') {
    if (isFinal || round >= 3) {
      return {
        reply: `You've made a really sensible and clear point here! The way you explained it makes complete sense, and I'm very happy to agree with your proposal. Let's move forward together!`,
        sentiment: 'supportive',
        currentFocus: 'Agreement reached & confirmed',
        hint: `Confirm the agreement and thank them for collaborating with you.`
      };
    }

    const easyResponses = [
      {
        reply: `That sounds like a good direction! My main concern is just making sure this doesn't create unexpected work or extra costs for us. Could you explain simply how we keep things smooth?`,
        hint: `Reassure them in simple words: mention that the transition will be gradual and supported step-by-step.`
      },
      {
        reply: `I appreciate you clarifying that! If we agree to this, what is the single biggest win our team will notice right away?`,
        hint: `Highlight one concrete, practical benefit that makes their daily work easier.`
      }
    ];

    const chosen = easyResponses[(round - 1) % easyResponses.length];
    return {
      reply: chosen.reply,
      sentiment: 'friendly',
      currentFocus: 'Simple clarification',
      hint: chosen.hint
    };
  }

  // --- HARD MODE: Brutal, demanding, sharp vocabulary ---
  if (difficulty === 'HARD') {
    if (isFinal) {
      return {
        reply: `We have scrutinized your assertions across every round, and while you demonstrated tenacity, your risk-adjusted metrics remain precarious. Unless you agree to an immediate 15% discount and indemnify our downside risk, we are terminating this discussion.`,
        sentiment: 'hardline',
        currentFocus: 'Definitive ultimatum & contractual leverage'
      };
    }

    const hardResponses = [
      `Your premise collapses the moment we stress-test it against real-world volatility. What empirical benchmark justifies our absorption of your execution risk?`,
      `You are deflecting from the primary fiscal vulnerability. Give me verified unit metrics, not optimistic assertions that gloss over downstream churn.`,
      `Your competitor guarantees 99.9% operational uptime with full liquidated damages at this identical price point. Why should our executive committee accept your inferior terms?`
    ];

    return {
      reply: hardResponses[(round - 1) % hardResponses.length],
      sentiment: 'aggressive',
      currentFocus: 'Scrutinizing systemic flaws & competitive alternatives'
    };
  }

  // --- MEDIUM MODE: Standard realistic behavior ---
  if (cat === 'GROUP_DISCUSSION') {
    if (isFinal) {
      return {
        reply: `To synthesize our discussion, while your arguments raised interesting perspectives, the fundamental vulnerabilities regarding regulation and operational scale remain unresolved. A balanced consensus must prioritize systemic risk containment rather than unmitigated adoption. Let's see if the broader panel agrees on where the boundary line should be drawn.`,
        sentiment: 'calculating',
        currentFocus: 'Synthesis & core systemic trade-offs'
      };
    }
    const gdResponses = [
      `You're treating the issue as an isolated hypothetical, but in the real world, unintended secondary consequences will destabilize the entire framework. What regulatory mechanism ensures your proposed model doesn't create larger socio-economic vulnerabilities?`,
      `That argument sounds persuasive in isolation, but empirical case studies in international markets prove the exact opposite outcome occurred under similar circumstances. How do you account for that clear contradiction in your thesis?`,
      `You've highlighted the upside for early adopters, but you are completely glossing over who pays the economic cost when the transition fails. In any sound group discussion, we must address the most vulnerable stakeholders first.`,
      `I concede you made a fair point regarding short-term momentum, but long-term sustainability is where your argument breaks down. What happens when market liquidity dries up or enforcement resources are overwhelmed?`
    ];
    return {
      reply: gdResponses[(round - 1) % gdResponses.length],
      sentiment: 'skeptical',
      currentFocus: 'Challenging empirical validity & systemic risk'
    };
  }

  if (cat === 'INTERVIEW') {
    if (isFinal) {
      return {
        reply: `I appreciate your composure through these tough questions today; you've defended your positioning with solid conviction. We have two other candidates to review this afternoon, but I'll make sure our hiring committee assesses your core differentiators closely before our final decision.`,
        sentiment: 'calculating',
        currentFocus: 'Final assessment & candidate differentiation'
      };
    }
    const interviewResponses = [
      `Anyone can recite textbook answers, but I need to see how you execute when resources are constrained and team morale is sinking. Give me specific operational metrics, not high-level philosophy.`,
      `That sounds fine on paper, but your assumptions about speed and cross-functional buy-in seem overly optimistic. What was the single biggest friction point you encountered in that initiative?`,
      `You've highlighted your technical strengths, but I'm looking for where you rely on complementary leadership. When a market dispute arises, how do you handle being overruled by executive peers?`,
      `I'm still looking for greater depth on your personal contribution. What specific decision did you make that nobody else on that project was willing to champion?`
    ];
    return {
      reply: interviewResponses[(round - 1) % interviewResponses.length],
      sentiment: 'guarded',
      currentFocus: 'Drilling down into depth and authenticity'
    };
  }

  if (cat === 'PITCHING') {
    if (isFinal) {
      return {
        reply: `I appreciate your hustle and the clarity of your vision today. I'm going to take this to our Monday investment committee with some reservations around CAC expansion, but if your data room checks out, we'll schedule a partner meeting next week.`,
        sentiment: 'calculating',
        currentFocus: 'Partner meeting criteria & data room diligence'
      };
    }
    const pitchResponses = [
      `Your top-line market projections look attractive, but how does your unit economics hold up once paid acquisition costs inevitably spike by 30% next quarter?`,
      `What stops a well-capitalized competitor with existing enterprise distribution from building this exact workflow into their core suite and bundling it for free?`,
      `Your current churn numbers look acceptable for early adopters, but what happens when you scale into mainstream, price-sensitive enterprise accounts?`,
      `You're asking for capital, but your milestone roadmap doesn't clearly show how this runway gets you to default-alive profitability. Walk me through the exact capital allocation.`
    ];
    return {
      reply: pitchResponses[(round - 1) % pitchResponses.length],
      sentiment: 'skeptical',
      currentFocus: 'Scrutinizing unit economics, churn, and defensibility'
    };
  }

  if (cat === 'EVERYDAY_SKILLS') {
    if (isFinal) {
      return {
        reply: `Alright, I hear your points and respect the professional way you've laid this out. I cannot approve everything you asked for right now, but I will authorize the primary request starting next week if we agree on the parameters we've discussed. Let's get this in writing today.`,
        sentiment: 'calculating',
        currentFocus: 'Final mutual agreement & terms confirmation'
      };
    }
    const everydayResponses = [
      `I understand your frustration, but there are contractual procedures and budget constraints on our side that you aren't accounting for here.`,
      `If we make an exception for this specific issue, it sets an unsustainable precedent across the rest of the organization or building. What compromise can you offer on the timing?`,
      `You're asking for an immediate resolution, but you haven't provided verifiable documentation of when this issue began. Why wasn't this raised during our initial review?`,
      `I can look into partial support, but our standard policy requires shared responsibility for this type of adjustment. How willing are you to meet halfway?`
    ];
    return {
      reply: everydayResponses[(round - 1) % everydayResponses.length],
      sentiment: 'skeptical',
      currentFocus: 'Enforcing policy boundaries and exploring compromises'
    };
  }

  // Negotiation turns (MEDIUM)
  if (isFinal) {
    return {
      reply: `I've considered your points throughout this discussion, but I cannot sign off on these terms as currently configured. If you can formalize the SLA guarantees and trim another 8% off the total commitment, I will present a conditional pilot to the board next month. Otherwise, we will keep our current processes in place.`,
      sentiment: 'hardline',
      currentFocus: 'Final board review conditions & price compromise'
    };
  }

  const responses = [
    `That sounds appealing in a slide deck, but you're asking us to take on substantial upfront execution risk while your margins remain protected. How do we ensure we aren't left holding the bag if milestones slip?`,
    `You're asking for our commitment, but you haven't addressed our core constraint around budget allocation for this quarter. What specific flexibility can you offer on the commercial terms or milestone payments?`,
    `Our technical committee reviewed similar proposals last month, and your competitors are offering 24/7 dedicated support and migration credits at this exact price point. What makes your solution worth paying a premium?`,
    `I appreciate the value proposition, but my directive is to minimize operational disruption and cut capital outlays. If you want us to move forward, you need to bring something more tangible to the table regarding risk sharing.`
  ];

  return {
    reply: responses[(round - 1) % responses.length],
    sentiment: 'skeptical',
    currentFocus: 'Scrutinizing risk allocation & competitive alternatives'
  };
}

// Fallback report card evaluator
function generateFallbackReport(scenario: string, opponent: OpponentProfile, history: ChatTurn[], category?: ScenarioCategory) {
  const userMessages = history.filter(h => h.role === 'user').map(h => h.content);
  const sample1 = userMessages[0] || 'We believe this stance is justified by our unique value proposition.';
  const sample2 = userMessages[Math.min(1, userMessages.length - 1)] || 'We can offer flexibility if we align on terms.';
  const sampleLast = userMessages[userMessages.length - 1] || 'We hope we can reach an agreement that works for both sides.';

  const weakQuote1 = sample2.length > 10 ? sample2 : sample1;
  const weakQuote2 = sampleLast.length > 10 ? sampleLast : sample1;

  const cat = category || opponent.scenarioType || inferCategory(scenario);

  let outcome = 'Conditional Pilot Term Sheet under Review with 10% Margin Concession';
  if (cat === 'GROUP_DISCUSSION') {
    outcome = 'GD Panel Consensus Reached: Stood Out as Thought Leader with Strong Rebuttals';
  } else if (cat === 'INTERVIEW') {
    outcome = 'Advanced to Final Executive Partner Round with Recommendation';
  } else if (cat === 'PITCHING') {
    outcome = 'Term Sheet Diligence Approved for Partner Meeting Review';
  } else if (cat === 'EVERYDAY_SKILLS') {
    outcome = 'Favorable Resolution Reached with Formal Commitment';
  }

  return {
    overallScore: 8.0,
    overallGrade: 'B+',
    dealOutcome: outcome,
    executiveSummary: `You demonstrated clear reasoning, persistent composure, and articulate defense throughout all 6 rounds with ${opponent.name}. Your foundational arguments were sound, though sharpening your quantitative proof earlier would have defused skepticism faster.`,
    persuasion: {
      score: 8,
      reason: `When you stated "${sample1.slice(0, 100)}...", you established strong logical framing, though grounding it in concrete metrics or third-party benchmarks would have made your argument bulletproof.`
    },
    handlingObjections: {
      score: 8,
      reason: `You maintained poise under tough pushback. In responses like "${sample2.slice(0, 90)}...", you addressed the surface objection, but could have isolated ${opponent.name}'s underlying concerns more decisively.`
    },
    concessions: {
      score: 7,
      reason: `You held your core position well without unraveling, but occasionally signaled soft flexibility without demanding equal conceptual or commercial concessions in return.`
    },
    closing: {
      score: 8,
      reason: `In Round 6, when you stated "${sampleLast.slice(0, 100)}...", you delivered a cohesive wrap-up that maintained forward momentum and established a clear basis for decision.`
    },
    weakestLines: [
      {
        original: weakQuote1.slice(0, 120),
        critique: 'This line ceded tactical initiative by appearing slightly defensive rather than reframing the dialogue around mutual upside.',
        rewrite: 'Let us ground this in verified outcomes: our framework eliminates this operational bottleneck while preserving margin and compliance.'
      },
      {
        original: weakQuote2.slice(0, 120),
        critique: 'Ending with tentative or hopeful framing transfers command of the discussion over to your opponent.',
        rewrite: 'Based on the evidence we have established across these core pillars, the highest-ROI decision is to greenlight this phased implementation immediately.'
      }
    ],
    topTip: cat === 'GROUP_DISCUSSION' 
      ? 'Acknowledge the opponent’s valid nuance in one clause before pivoting immediately with a higher-order principle ("The Agree & Pivot Rule").'
      : cat === 'INTERVIEW'
      ? 'Anchor answers in the "Situation-Action-Quantified Impact" formula to leave zero room for follow-up skepticism.'
      : cat === 'PITCHING'
      ? 'Always answer investor questions with traction data first, followed by unit economic justification.'
      : 'Never grant a concession without immediately attaching a reciprocal demand ("The If/Then Rule of Negotiation").'
  };
}

// 1. Initialize Negotiation / Debate / Interview / Pitch / Everyday
app.post('/api/negotiation/init', async (req: Request, res: Response) => {
  const { scenario, opponentRole, dealSize, stakes, userRole, category, difficulty } = req.body;
  if (!scenario || typeof scenario !== 'string' || scenario.trim() === '') {
    res.status(400).json({ error: 'Scenario description is required.' });
    return;
  }

  const cleanScenario = scenario.trim();
  const cat = inferCategory(cleanScenario, category);
  const cleanRole = typeof opponentRole === 'string' ? opponentRole.trim() : '';
  const cleanUserRole = typeof userRole === 'string' ? userRole.trim() : '';
  const cleanDealSize = typeof stakes === 'string' && stakes.trim() 
    ? stakes.trim() 
    : typeof dealSize === 'string' ? dealSize.trim() : '';
  const diff: DifficultyLevel = difficulty === 'HARD' ? 'HARD' : difficulty === 'MEDIUM' ? 'MEDIUM' : 'EASY';

  try {
    const ai = getAiClient();
    if (!ai) {
      console.warn('GEMINI_API_KEY not configured. Serving intelligent fallback simulation.');
      const fallback = generateFallbackPersona(cleanScenario, cleanRole, cleanDealSize, cat, diff);
      if (cleanUserRole && fallback.opponent) {
        fallback.opponent.userRole = cleanUserRole;
      }
      if (cleanDealSize && fallback.opponent) {
        fallback.opponent.stakes = cleanDealSize;
      }
      fallback.opponent.difficulty = diff;
      res.json(fallback);
      return;
    }

    let roleGuidance = '';
    if (cat === 'GROUP_DISCUSSION') {
      roleGuidance = `This is a GROUP DISCUSSION (GD) / DEBATE topic. The opponent MUST be an articulate rival debater or fellow panelist discussing the user's motion/thesis.`;
    } else if (cat === 'INTERVIEW') {
      roleGuidance = `This is an EXECUTIVE JOB INTERVIEW. The opponent MUST be a hiring interviewer or panel lead evaluating candidate fit.`;
    } else if (cat === 'PITCHING') {
      roleGuidance = `This is a VENTURE PITCH / INVESTOR DEFENSE. The opponent MUST be a venture capital investor or angel evaluating the startup.`;
    } else if (cat === 'EVERYDAY_SKILLS') {
      roleGuidance = `This is an EVERYDAY WORKPLACE OR LIFE NEGOTIATION. The opponent MUST be a real-world stakeholder (such as a landlord, boss, or recruiter).`;
    } else {
      roleGuidance = `This is a COMMERCIAL NEGOTIATION scenario. The opponent MUST be an executive buyer, CFO, or vendor.`;
    }

    let diffGuidance = '';
    if (diff === 'EASY') {
      diffGuidance = `DIFFICULTY: EASY (Practice Mode for Students).
- Tone: Friendly, polite, supportive, and encouraging. Never rude or intimidating.
- Vocabulary: Simple, accessible, everyday English.
- Pushback: Formulate a simple, straightforward objection.
- Attitude: Highly cooperative and willing to concede if the user makes even one clear logical point.
- HINT REQUIREMENT: You MUST include "hint": a 1-sentence helpful suggestion advising the student on how they can respond to this opening objection.`;
    } else if (diff === 'HARD') {
      diffGuidance = `DIFFICULTY: HARD (Interview Prep / Executive Gauntlet).
- Tone: Brutal, demanding, high-pressure, skeptical.
- Vocabulary: Sophisticated, expert-level corporate and analytical vocabulary.
- Pushback: Sharp, aggressive objections, pounce on any weak logic, attack unproven assumptions.
- Attitude: Absolutely NO easy concessions.`;
    } else {
      diffGuidance = `DIFFICULTY: MEDIUM (Standard Business Simulation).
- Tone: Professional, realistic, firm.
- Vocabulary: Standard business English.
- Pushback: Standard commercial pushback, evaluating balanced trade-offs.`;
    }

    const prompt = `You are an elite simulation engine for MBA and business students practicing communication.

CUSTOMIZED SESSION INPUTS:
- CATEGORY: ${cat}
- SCENARIO / MOTION: "${cleanScenario}"
${cleanUserRole ? `- USER ROLE: "${cleanUserRole}"` : ''}
${cleanRole ? `- OPPONENT / OTHER SIDE: "${cleanRole}"` : ''}
${cleanDealSize ? `- STAKES / SPECIFIC NUMBERS / CONSTRAINTS: "${cleanDealSize}"` : ''}

${roleGuidance}
${diffGuidance}

MANDATORY ADAPTATION RULES:
1. "opponent": An opponent persona strictly matching these customized parameters:
   - "name": MUST strictly be "DealDebate" (never use a human personal name like Priya, Rohit, etc.)
   - "title": appropriate title reflecting "${cleanRole || 'Opponent'}"
   - "company": realistic organization, property management firm, B-school panel, or venture fund
   - "stance": their posture specifically addressing the user's role ("${cleanUserRole || 'advocate'}") and proposal
   - "initialObjection": their primary concern or counter-thesis
   - "scenarioType": "${cat}"
   - "opponentTypeLabel": appropriate label (e.g. "Opposing Debater", "Executive Interviewer", "Skeptical Investor", "Reluctant Landlord", "Direct Boss", or "Hesitant CFO")
   - "userRole": "${cleanUserRole}"
   - "stakes": "${cleanDealSize}"
   - "difficulty": "${diff}"

2. "openingLine": The opening remark spoken by the opponent to kick off the interaction.
   CRITICAL REQUIREMENTS:
   - LENGTH: EXACTLY 2 to 3 sentences long.
   - BRANDING & NAME RULE: You MUST NEVER introduce yourself with a human personal name (e.g., NEVER say "I am Priya", "My name is...", "Hello, I am Rohit"). Jump straight into the dialogue and objection in character.
   - It MUST adapt directly to the user's role ("${cleanUserRole || 'candidate/advocate'}"), directly address the motion/scenario ("${cleanScenario}"), and ${cleanDealSize ? `explicitly address or incorporate the stakes/numbers ("${cleanDealSize}")` : 'raise a relevant consideration'}.
   - Respect the difficulty level (${diff}): ${diff === 'EASY' ? 'friendly, simple English, gentle objection' : diff === 'HARD' ? 'brutal, aggressive pushback' : 'firm professional pushback'}.

3. "hint": ${diff === 'EASY' ? 'A 1-sentence encouraging tip for the student on how to respond to this opening line.' : 'null or empty string.'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an adversarial simulation engine for students. Return strictly valid JSON conforming to the schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            opponent: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                title: { type: Type.STRING },
                company: { type: Type.STRING },
                stance: { type: Type.STRING },
                initialObjection: { type: Type.STRING },
                scenarioType: { type: Type.STRING },
                opponentTypeLabel: { type: Type.STRING },
                userRole: { type: Type.STRING },
                stakes: { type: Type.STRING },
                difficulty: { type: Type.STRING }
              },
              required: ['name', 'title', 'company', 'stance', 'initialObjection']
            },
            openingLine: {
              type: Type.STRING,
              description: 'Opponent opening remark in 2-3 sentences.'
            },
            hint: {
              type: Type.STRING,
              description: '1-sentence hint for the student in EASY mode.'
            }
          },
          required: ['opponent', 'openingLine']
        }
      }
    });

    const parsed = extractJson<{ opponent: OpponentProfile; openingLine: string; hint?: string }>(response.text);
    if (parsed && parsed.opponent && parsed.openingLine) {
      if (!parsed.opponent.scenarioType) parsed.opponent.scenarioType = cat;
      parsed.opponent.name = 'DealDebate';
      if (cleanUserRole) parsed.opponent.userRole = cleanUserRole;
      if (cleanDealSize) parsed.opponent.stakes = cleanDealSize;
      parsed.opponent.difficulty = diff;
      res.json(parsed);
      return;
    }

    console.warn('Failed to parse Gemini init response. Using fallback.');
    const fallback = generateFallbackPersona(cleanScenario, cleanRole, cleanDealSize, cat, diff);
    if (cleanUserRole && fallback.opponent) {
      fallback.opponent.userRole = cleanUserRole;
    }
    if (cleanDealSize && fallback.opponent) {
      fallback.opponent.stakes = cleanDealSize;
    }
    fallback.opponent.difficulty = diff;
    res.json(fallback);
  } catch (err: unknown) {
    console.error('Error during /api/negotiation/init call:', err);
    const fallback = generateFallbackPersona(cleanScenario, cleanRole, cleanDealSize, cat, diff);
    if (cleanUserRole && fallback.opponent) {
      fallback.opponent.userRole = cleanUserRole;
    }
    if (cleanDealSize && fallback.opponent) {
      fallback.opponent.stakes = cleanDealSize;
    }
    fallback.opponent.difficulty = diff;
    res.json(fallback);
  }
});

// 2. Negotiation / Debate Round Reply
app.post('/api/negotiation/reply', async (req: Request, res: Response) => {
  const { scenario, opponent, history, currentRound, userMessage, category, difficulty } = req.body;
  if (!userMessage || typeof userMessage !== 'string') {
    res.status(400).json({ error: 'userMessage is required' });
    return;
  }

  const roundNum = Number(currentRound) || 1;
  const isFinalRound = roundNum >= 6;
  const cat: ScenarioCategory = category || opponent?.scenarioType || inferCategory(scenario);
  const diff: DifficultyLevel = difficulty === 'HARD' ? 'HARD' : difficulty === 'MEDIUM' ? 'MEDIUM' : (opponent?.difficulty || 'EASY');

  try {
    const ai = getAiClient();
    if (!ai) {
      console.warn('GEMINI_API_KEY not configured. Serving realistic fallback turn.');
      res.json(generateFallbackTurn(roundNum, userMessage, opponent?.name || 'Opponent', isFinalRound, cat, diff));
      return;
    }

    const transcriptContext = (history as ChatTurn[] || [])
      .map((t) => `${t.role === 'user' ? 'STUDENT' : (opponent?.name || 'OPPONENT').toUpperCase()}: ${t.content}`)
      .join('\n');

    let dynamicRules = '';
    if (diff === 'EASY') {
      dynamicRules = `DIFFICULTY: EASY (Practice Mode for Students).
- Tone: Friendly, encouraging, polite, collaborative. Use clear, easy conversational English.
- Concessions: Never interrupt. If the student makes even ONE clear logical point, CONCEDE and agree warmly!
- By Round 3 or later: Enthusiastically concede the deal/debate! Praise their logic and accept their proposal (e.g. "That's a very fair point, and I appreciate how simply you explained it. I agree, let's move forward!").
- Hint: You MUST provide "hint": a 1-sentence practical suggestion advising the student on how to answer your response.`;
    } else if (diff === 'HARD') {
      dynamicRules = `DIFFICULTY: HARD (Interview Prep / Executive Gauntlet).
- Tone: Brutal, demanding, aggressive, high-pressure.
- Vocabulary: Expert-level vocabulary and terminology.
- Objections: Dissect weak logic, interrupt poor reasoning, point out fallacies, demand rigorous proof.
- Concessions: Absolutely NO easy concessions. Make them fight for every inch.`;
    } else {
      dynamicRules = `DIFFICULTY: MEDIUM (Standard Business Simulation).
- Tone: Professional, firm, realistic pushback. Requires balanced trade-offs.`;
    }

    const prompt = `SCENARIO: ${scenario}
CATEGORY: ${cat}
DIFFICULTY: ${diff}
OPPONENT: ${opponent?.name || 'Opponent'} (${opponent?.title || 'Decision Maker'} at ${opponent?.company || 'Company'})
STANCE: ${opponent?.stance || 'Counterpart'}
PROGRESS: Round ${roundNum} of 6. ${isFinalRound ? 'THIS IS THE FINAL 6TH ROUND. Provide your concluding response.' : ''}

TRANSCRIPT SO FAR:
${transcriptContext}

LATEST STUDENT STATEMENT:
"${userMessage}"

RULES:
1. Stay 100% in character as DealDebate in the role of ${opponent?.title || 'the counterpart'}.
2. LENGTH REQUIREMENT: You MUST reply in EXACTLY 2 to 4 sentences.
3. BRANDING & NAME RULE: You MUST NEVER use, mention, or introduce yourself with any human personal name (such as Priya, Rohit, David, etc.).
4. ${dynamicRules}
5. ${isFinalRound ? 'Deliver your final verdict/conclusion on the debate/interview/deal. Keep to 2-4 sentences.' : 'Deliver your response.'}
6. ${diff === 'EASY' ? 'Provide a helpful 1-sentence "hint" for the student on how to respond.' : 'Set "hint" to null.'}
7. Do NOT break character or offer AI coaching in the dialogue itself.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an opponent in a student simulation. Return strictly valid JSON.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'Opponent dialogue strictly in 2 to 4 sentences.'
            },
            sentiment: {
              type: Type.STRING,
              description: 'One of: supportive, friendly, skeptical, guarded, hardline, calculating, defensive'
            },
            currentFocus: {
              type: Type.STRING,
              description: 'Short phrase describing the response focus.'
            },
            hint: {
              type: Type.STRING,
              description: '1-sentence hint for the student in EASY mode.'
            }
          },
          required: ['reply', 'sentiment', 'currentFocus']
        }
      }
    });

    const parsed = extractJson<{ reply: string; sentiment: string; currentFocus: string; hint?: string }>(response.text);
    if (parsed && parsed.reply) {
      res.json(parsed);
      return;
    }

    res.json(generateFallbackTurn(roundNum, userMessage, opponent?.name || 'Opponent', isFinalRound, cat, diff));
  } catch (err: unknown) {
    console.error('Error during /api/negotiation/reply:', err);
    res.json(generateFallbackTurn(roundNum, userMessage, opponent?.name || 'Opponent', isFinalRound, cat, diff));
  }
});

// 3. Generate Report Card after 6 Rounds
app.post('/api/negotiation/evaluate', async (req: Request, res: Response) => {
  const { scenario, opponent, history, category } = req.body;
  if (!history || !Array.isArray(history) || history.length === 0) {
    res.status(400).json({ error: 'Valid negotiation history is required' });
    return;
  }

  const cat: ScenarioCategory = category || opponent?.scenarioType || inferCategory(scenario);

  try {
    const ai = getAiClient();
    if (!ai) {
      console.warn('GEMINI_API_KEY not configured. Generating detailed fallback report.');
      res.json(generateFallbackReport(scenario, opponent, history, cat));
      return;
    }

    const transcript = (history as ChatTurn[])
      .map((t, i) => `[Turn ${i + 1} - ${t.role === 'user' ? 'STUDENT' : 'OPPONENT'} (Round ${t.round || Math.ceil((i + 1) / 2)})]:\n"${t.content}"`)
      .join('\n\n');

    let coachingContext = '';
    if (cat === 'GROUP_DISCUSSION') {
      coachingContext = `This was a GROUP DISCUSSION debate. Evaluate how well the student articulated logical arguments, defended premises against the rival debater, acknowledged nuance, and synthesized conclusions.`;
    } else if (cat === 'INTERVIEW') {
      coachingContext = `This was an EXECUTIVE JOB INTERVIEW. Evaluate how well the student framed achievements, handled drill-down scrutiny from the interviewer, demonstrated depth, and closed with authority.`;
    } else if (cat === 'PITCHING') {
      coachingContext = `This was a VENTURE CAPITAL PITCH. Evaluate how well the student presented traction, defended unit economics and moats, handled investor skepticism, and maintained investor interest.`;
    } else if (cat === 'EVERYDAY_SKILLS') {
      coachingContext = `This was a REAL-WORLD WORKPLACE / LIFE NEGOTIATION. Evaluate clarity, assertiveness, emotional regulation, boundary setting, and constructive problem-solving.`;
    } else {
      coachingContext = `This was a COMMERCIAL NEGOTIATION. Evaluate value framing, price defense, reciprocal concessions, and closing momentum against the CFO/executive buyer.`;
    }

    const prompt = `You are a world-class executive communication and negotiation professor evaluating a student's 6-round performance.

SCENARIO: "${scenario}"
CATEGORY: ${cat}
OPPONENT: ${opponent?.name} (${opponent?.title} at ${opponent?.company})
${coachingContext}

FULL 6-ROUND TRANSCRIPT:
${transcript}

EVALUATION CRITERIA (MANDATORY REQUIREMENTS):
1. Scores out of 10 for each of these 4 pillars:
   - "persuasion": Framing, clarity of value/thesis, logical conviction.
   - "handlingObjections": Rebutting counter-arguments, answering tough interview drills, or defusing pushbacks.
   - "concessions": Holding the line, trading reciprocal concessions, acknowledging nuance without losing leverage.
   - "closing": Synthesis, conviction in final statements, driving to a clear decision or agreement.
   MANDATORY REQUIREMENT FOR EVERY PILLAR REASON:
   Each pillar's "reason" MUST QUOTE what the student actually said in quotes (e.g. When you argued "..." you demonstrated...). Be analytical, objective, and constructive.

2. The student's 2 WEAKEST LINES rewritten better:
   - Identify the 2 single weakest statements the student uttered.
   - Quote their exact words in "original".
   - In "critique", explain why it compromised their authority, leverage, or logic.
   - In "rewrite", provide the polished executive rephrase.

3. 1 TOP TIP:
   - Exactly ONE high-leverage strategic insight tailored specifically to their habits in this scenario.

4. OVERALL OUTCOME & GRADE:
   - "dealOutcome": Realistic outcome (e.g., "Term sheet signed at ₹46L", "GD Panel Consensus Reached", "Shortlisted for Final Partner Interview", "Landlord Agreed to Maintenance Schedule").
   - "overallScore": 1.0 to 10.0 score.
   - "overallGrade": e.g., A, A-, B+, B, C+.
   - "executiveSummary": 2-3 sentence overview.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an executive communications evaluator. Quote the student verbatim and return strictly valid JSON matching the schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            overallGrade: { type: Type.STRING },
            dealOutcome: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            persuasion: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER },
                reason: { type: Type.STRING }
              },
              required: ['score', 'reason']
            },
            handlingObjections: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER },
                reason: { type: Type.STRING }
              },
              required: ['score', 'reason']
            },
            concessions: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER },
                reason: { type: Type.STRING }
              },
              required: ['score', 'reason']
            },
            closing: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER },
                reason: { type: Type.STRING }
              },
              required: ['score', 'reason']
            },
            weakestLines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  critique: { type: Type.STRING },
                  rewrite: { type: Type.STRING }
                },
                required: ['original', 'critique', 'rewrite']
              }
            },
            topTip: { type: Type.STRING }
          },
          required: [
            'overallScore',
            'overallGrade',
            'dealOutcome',
            'executiveSummary',
            'persuasion',
            'handlingObjections',
            'concessions',
            'closing',
            'weakestLines',
            'topTip'
          ]
        }
      }
    });

    const parsed = extractJson<any>(response.text);
    if (parsed && parsed.overallScore && parsed.persuasion && parsed.weakestLines) {
      res.json(parsed);
      return;
    }

    res.json(generateFallbackReport(scenario, opponent, history, cat));
  } catch (err: unknown) {
    console.error('Error during /api/negotiation/evaluate:', err);
    res.json(generateFallbackReport(scenario, opponent, history, cat));
  }
});

// Production vs Development server setup
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`DealDebate server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
