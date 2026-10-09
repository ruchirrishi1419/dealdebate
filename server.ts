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

// Helper to execute Gemini generation with model fallback (gemini-3.1-flash-lite -> gemini-3.8-flash)
async function generateGeminiContent(ai: GoogleGenAI, params: {
  contents: string;
  config: any;
}): Promise<string> {
  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  let lastError: unknown = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed, trying next candidate:`, err?.message || err);
    }
  }

  throw lastError || new Error('All Gemini models failed to generate content');
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

// Infer category from scenario keywords if not explicitly provided
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
  if (s.includes('interview') || s.includes('candidate') || s.includes('tell me about yourself') || s.includes('weakness')) {
    return 'INTERVIEW';
  }

  // Everyday skills
  if (s.includes('landlord') || s.includes('boss') || s.includes('politely') || s.includes('fix something') || s.includes('disagree with') || s.includes('neighbor')) {
    return 'EVERYDAY_SKILLS';
  }

  // Explicit commercial / business negotiation
  if (s.includes('salary') || s.includes('raise') || s.includes('vendor') || s.includes('contract negotiation') || s.includes('pricing concession') || s.includes('b2b')) {
    return 'NEGOTIATION';
  }

  // Group discussion / debates / comparisons / general custom topics
  return 'GROUP_DISCUSSION';
}

// Fallback generator strictly loyal to the user's specific topic
function generateFallbackPersona(
  scenario: string, 
  role?: string, 
  dealSize?: string, 
  category?: ScenarioCategory,
  difficulty: DifficultyLevel = 'EASY'
): { opponent: OpponentProfile; openingLine: string; hint?: string } {
  const sLower = scenario.toLowerCase();
  const cat = category || inferCategory(scenario);
  const isEasy = difficulty === 'EASY';
  const isHard = difficulty === 'HARD';

  // 1. SPORTS: Formula 1, Racing, Motorsports
  if (sLower.includes('formula 1') || sLower.includes('f1') || sLower.includes('racing') || sLower.includes('motorsport') || sLower.includes('grand prix')) {
    return {
      opponent: {
        name: 'DealDebate',
        title: role || 'FIA Technical & Race Strategy Analyst',
        company: 'F1 Paddock Analytics Forum',
        stance: 'Argues that aerodynamic package, telemetry data, and tire degradation windows determine race outcomes far more than individual driver heroics.',
        initialObjection: 'Underestimating the overwhelming dominance of constructor aero engineering over pure driver skill.',
        scenarioType: 'GROUP_DISCUSSION',
        opponentTypeLabel: 'Motorsport Analyst',
        difficulty
      },
      openingLine: isEasy
        ? `Formula 1 is thrilling, but look at the engineering data: the fastest aerodynamic package consistently wins 90% of Grand Prix races regardless of driver hype. In simple terms, why do you think driver skill matters as much as the car design?`
        : isHard
        ? `Anyone who studies telemetry knows ground-effect downforce and tire degradation windows dictate Grand Prix victories, not romanticized driver talent. Put any competent midfield driver into the championship car and they take poles. How do you defend driver primacy against undeniable aerodynamic supremacy?`
        : `Look at the telemetry over the past decade: championship outcomes are overwhelmingly dictated by the constructor's wind tunnel efficiency and engine reliability, not driver intangibles. What empirical proof do you have that driver skill can overcome a 0.5-second aero deficit?`,
      hint: isEasy ? 'Explain how driver input under changing weather or high-pressure race starts can overcome small car deficits.' : undefined
    };
  }

  // 2. SPORTS: Messi vs Ronaldo, Football, Soccer
  if (sLower.includes('messi') || sLower.includes('ronaldo') || sLower.includes('goat') || sLower.includes('football') || sLower.includes('soccer')) {
    return {
      opponent: {
        name: 'DealDebate',
        title: role || 'Senior Football Tactical Analyst',
        company: 'European Football Digest',
        stance: 'Challenges one-sided GOAT claims by weighing complete playmaking, progressive passes, and World Cup glory against raw clutch knockout goal scoring across multiple leagues.',
        initialObjection: 'Equating sheer goal tallies with total tactical game control, or vice versa.',
        scenarioType: 'GROUP_DISCUSSION',
        opponentTypeLabel: 'Football Analyst',
        difficulty
      },
      openingLine: isEasy
        ? `The Messi versus Ronaldo debate is legendary! Both have won historic trophies, but one side argues pure playmaking and World Cup success, while the other points to unmatched knockout goals across three different top leagues. What is the single most decisive reason your pick is the undisputed greatest?`
        : isHard
        ? `Before crowning a definitive GOAT, you cannot cherry-pick stats while ignoring tactical context: Ronaldo dominated the world's most physical leagues and delivered unmatched Champions League knockout clutch goals, whereas Messi's playmaking and World Cup run redefined the game. How do you objectively prove your candidate surpasses the other across all eras and metrics?`
        : `When comparing Messi and Ronaldo, fans consistently confuse emotional bias with objective football metrics. Are you prioritizing raw goal-scoring clutch factor in the Champions League, or all-around playmaking and international tournament dominance? Make your case.`,
      hint: isEasy ? 'Pick 1 or 2 specific statistical milestones (like knockout goals or playmaking assists) to anchor your argument.' : undefined
    };
  }

  // 3. ACADEMICS & COLLEGE LIFE: AI in Colleges, Higher Education, Student Policies
  if (sLower.includes('college') || sLower.includes('university') || sLower.includes('student') || sLower.includes('ai in') || sLower.includes('academic') || sLower.includes('campus')) {
    return {
      opponent: {
        name: 'DealDebate',
        title: role || 'Dean of Academic Policy & Curriculum',
        company: 'Higher Education Ethics Council',
        stance: 'Argues generative AI in university coursework fundamentally degrades critical reasoning, original synthesis, and academic integrity.',
        initialObjection: 'Cognitive atrophy and the collapse of authentic student skill assessment.',
        scenarioType: 'GROUP_DISCUSSION',
        opponentTypeLabel: 'Academic Dean',
        difficulty
      },
      openingLine: isEasy
        ? `AI in college classrooms is a major conversation right now. While AI tools help students research faster, educators worry that students might lose the ability to write and think through complex problems independently. How can universities encourage learning without students just taking the easy way out?`
        : isHard
        ? `Permitting generative AI into higher education coursework actively accelerates cognitive atrophy, converting rigorous critical synthesis into prompt outsourcing. When students rely on LLMs for analytical essays and code architecture, university credentials become meaningless paper. Why should academia endorse a tool that atrophies the exact skills we exist to cultivate?`
        : `While AI literacy is clearly a modern workplace skill, integrating AI into standard college assessments directly threatens foundational problem-solving and authentic grading. How can universities maintain accreditation standards if students outsource original analysis to algorithms?`,
      hint: isEasy ? 'Suggest a balanced policy where AI is used for brainstorming and research, while core examinations remain human.' : undefined
    };
  }

  // 4. MOVIES & POP CULTURE
  if (sLower.includes('movie') || sLower.includes('film') || sLower.includes('cinema') || sLower.includes('actor') || sLower.includes('director') || sLower.includes('marvel') || sLower.includes('dc')) {
    return {
      opponent: {
        name: 'DealDebate',
        title: role || 'Film Critic & Cultural Analyst',
        company: 'Cinema Discourse Review',
        stance: 'Scrutinizes storytelling depth, character arcs, and cinematic originality against commercial box office spectacle.',
        initialObjection: 'Confusing commercial franchise popularity with cinematic craftsmanship.',
        scenarioType: 'GROUP_DISCUSSION',
        opponentTypeLabel: 'Film Critic',
        difficulty
      },
      openingLine: isEasy
        ? `Cinema debates are always great to explore! When looking at this topic, people often debate artistic storytelling versus pure entertainment value. What is the single biggest reason behind your perspective?`
        : `Popularity at the box office is completely separate from narrative rigor, character development, and directorial vision. How do you defend your stance without relying on subjective fan nostalgia?`,
      hint: isEasy ? 'Cite one specific scene or character arc to demonstrate your point clearly.' : undefined
    };
  }

  // 5. CORPORATE & COMMERCIAL NEGOTIATION (Explicitly business topics)
  if (sLower.includes('salary') || sLower.includes('raise') || sLower.includes('compensation')) {
    return {
      opponent: {
        name: 'DealDebate',
        title: role || 'Senior Division Director',
        company: 'Operations Leadership Board',
        stance: 'Strict manager managing tight departmental budget bands who requires undeniable, quantified business justification.',
        initialObjection: 'Fixed compensation band limits and fairness across the existing peer group.',
        scenarioType: 'NEGOTIATION',
        opponentTypeLabel: 'Division Director',
        difficulty
      },
      openingLine: `I appreciate you scheduling this, but our division is under clear guidance from executive leadership to cap compensation adjustments this cycle. An out-of-cycle increase would disrupt equity across your entire peer band. What extraordinary, quantified impact did you drive this past quarter that justifies an exception?`,
      hint: difficulty === 'EASY' ? 'Highlight 2 concrete accomplishments with numbers that made your manager look great.' : undefined
    };
  }

  if (sLower.includes('vendor') || sLower.includes('pricing') || sLower.includes('discount') || sLower.includes('contract')) {
    return {
      opponent: {
        name: 'DealDebate',
        title: role || 'VP of Commercial Accounts',
        company: 'Enterprise Supply Solutions',
        stance: 'Defending contract margins against procurement squeezes while emphasizing service level quality.',
        initialObjection: 'Maintaining premium SLA support without taking a loss on pricing.',
        scenarioType: 'NEGOTIATION',
        opponentTypeLabel: 'Commercial Executive',
        difficulty
      },
      openingLine: `A major pricing concession is difficult to reconcile with our current delivery costs, especially with dedicated 24/7 technical support included. Why should we take a margin cut on this contract when our service standards save your team significant downtime?`,
      hint: difficulty === 'EASY' ? 'Offer a trade-off: a longer commitment or case study in exchange for the price adjustment.' : undefined
    };
  }

  // 6. GENERAL CUSTOM TOPIC (ANY other topic - Food, Philosophy, Politics, Life, Science)
  // NEVER fall back to CFO or enterprise software!
  const topicShort = scenario.length > 30 ? scenario.slice(0, 28) + '...' : scenario;
  return {
    opponent: {
      name: 'DealDebate',
      title: role || `Debate Specialist on ${topicShort}`,
      company: 'Topic Discourse & Review Panel',
      stance: `Constructively challenges assumptions regarding "${scenario}", raising strong counter-arguments and testing evidence.`,
      initialObjection: `Critical trade-offs and counter-evidence concerning "${scenario}".`,
      scenarioType: cat,
      opponentTypeLabel: 'Opposing Debater',
      difficulty
    },
    openingLine: isEasy
      ? `That is a really interesting perspective on "${scenario}"! There are two distinct sides to this topic, and many people feel differently. What is the single strongest argument or real-world example you have to support your stance?`
      : isHard
      ? `When examining "${scenario}", proponents almost always overlook the strongest contradictory facts and systemic downsides. What verified evidence or logical foundation proves your stance on this topic holds up under rigorous cross-examination?`
      : `When people discuss "${scenario}", they frequently rely on general assumptions rather than testing the core trade-offs. What specific evidence makes your conclusion on this topic more compelling than the counter-perspective?`,
    hint: isEasy ? 'State your position clearly and back it up with one concrete fact, statistic, or everyday example.' : undefined
  };
}

// Fallback turns based on scenario category and difficulty (strictly topic-faithful)
function generateFallbackTurn(
  round: number, 
  userMessage: string, 
  opponentTitle: string, 
  isFinal: boolean, 
  scenario: string,
  difficulty: DifficultyLevel = 'EASY'
): { reply: string; sentiment: string; currentFocus: string; hint?: string } {
  const shortSnippet = userMessage.slice(0, 60);

  // EASY MODE: Friendly, concessions after 2-3 turns
  if (difficulty === 'EASY') {
    if (isFinal || round >= 3) {
      return {
        reply: `You make an excellent point regarding "${scenario}". When you highlighted that reasoning, you effectively addressed my main doubts. I concede to your argument on this topic—well reasoned and clearly argued!`,
        sentiment: 'supportive',
        currentFocus: 'Agreement reached & points conceded',
        hint: `Thank DealDebate for the discussion and summarize your final conclusion.`
      };
    }

    const easyResponses = [
      {
        reply: `That is a thoughtful point on "${scenario}", but how do you address the common counter-argument that opponents frequently cite?`,
        hint: `Acknowledge that counter-arguments exist, then explain why your chosen evidence outweighs them.`
      },
      {
        reply: `I see where you are coming from with "${shortSnippet}"! If you had to pick the single most convincing piece of evidence for your side on "${scenario}", what would it be?`,
        hint: `Give one strong, memorable fact or specific example to seal your argument.`
      }
    ];

    const chosen = easyResponses[(round - 1) % easyResponses.length];
    return {
      reply: chosen.reply,
      sentiment: 'friendly',
      currentFocus: 'Exploring evidence and clarifying points',
      hint: chosen.hint
    };
  }

  // HARD MODE: Sharp, relentless counter-arguments
  if (difficulty === 'HARD') {
    if (isFinal) {
      return {
        reply: `We have pushed your thesis through all 6 rounds on "${scenario}". While you showed tenacity, your stance still relies on selective examples and vulnerable assumptions against verified counter-evidence. The debate remains contested.`,
        sentiment: 'hardline',
        currentFocus: 'Final verdict & critique of logical vulnerabilities'
      };
    }

    const hardResponses = [
      `Your premise on "${scenario}" collapses the moment we stress-test it against contradictory real-world evidence. What verifiable empirical facts prove your assertion isn't an isolated anomaly?`,
      `You are deflecting from the core dilemma in "${scenario}". If your stance were truly robust, it would directly resolve opposing precedent rather than sidestepping it. Defend that contradiction directly.`,
      `That argument is logically inconsistent with what you stated earlier about "${scenario}". You cannot claim universal validity while discounting documented counter-examples in the same domain.`
    ];

    return {
      reply: hardResponses[(round - 1) % hardResponses.length],
      sentiment: 'aggressive',
      currentFocus: 'Dissecting contradictions & demanding empirical proof'
    };
  }

  // MEDIUM MODE: Standard balanced pushback
  if (isFinal) {
    return {
      reply: `To conclude our debate on "${scenario}", you have defended your thesis with solid reasoning and handled key questions well. However, the opposing counter-perspective still carries substantial weight. It is a balanced resolution, and you made a strong case.`,
      sentiment: 'calculating',
      currentFocus: 'Synthesis & balanced final resolution'
    };
  }

  const mediumResponses = [
    `That sounds persuasive regarding "${scenario}", but documented cases show alternative outcomes under similar conditions. How do you reconcile that discrepancy?`,
    `You've highlighted the strongest merits of your view on "${scenario}", but you are overlooking the significant trade-offs. In an objective debate, those trade-offs cannot simply be dismissed.`,
    `I grant that your point has merit in specific contexts, but it fails as a universal standard for "${scenario}". What boundary conditions limit your conclusion?`
  ];

  return {
    reply: mediumResponses[(round - 1) % mediumResponses.length],
    sentiment: 'skeptical',
    currentFocus: 'Testing boundaries and challenging trade-offs'
  };
}

// Fallback report card evaluator matching the clear, impressive structure
function generateFallbackReport(
  scenario: string, 
  opponent: OpponentProfile, 
  history: ChatTurn[], 
  category?: ScenarioCategory,
  difficulty: DifficultyLevel = 'EASY'
) {
  const userMessages = history.filter(h => h.role === 'user').map(h => h.content);
  const sample1 = userMessages[0] || `I believe the evidence clearly supports this stance based on verified comparative records on ${scenario}.`;
  const sample2 = userMessages[Math.min(1, userMessages.length - 1)] || `While there are valid counterpoints, the fundamental impact remains decisive.`;
  const sampleLast = userMessages[userMessages.length - 1] || `In conclusion, the balance of evidence firmly establishes this position on ${scenario} as the most compelling.`;

  const quote1 = sample1.length > 100 ? sample1.slice(0, 95) + '...' : sample1;
  const quote2 = sample2.length > 100 ? sample2.slice(0, 95) + '...' : sample2;
  const quote3 = sampleLast.length > 100 ? sampleLast.slice(0, 95) + '...' : sampleLast;

  if (difficulty === 'EASY') {
    return {
      overallScore: 9.0,
      overallGrade: 'A',
      winner: 'USER' as const,
      verdict: `Great Job! You shared clear, thoughtful points on "${scenario}" and stood your ground with friendly confidence.`,
      dealOutcome: `Debate Won: Wonderful Beginner Debut`,
      executiveSummary: `You did a fantastic job in your beginner debate on "${scenario}". Your everyday examples were clear and you listened well to DealDebate (${opponent.title}).`,
      strengths: [
        {
          title: 'Clear Everyday Point',
          quote: `"${quote1}"`,
          explanation: `You stated your personal viewpoint in simple, clear words so anyone could understand your main idea right away.`
        },
        {
          title: 'Polite and Steady Response',
          quote: `"${quote2}"`,
          explanation: 'When asked a follow-up question, you stayed calm, polite, and kept explaining your reasons nicely.'
        },
        {
          title: 'Friendly Wrap-Up',
          quote: `"${quote3}"`,
          explanation: `You finished your thoughts with a neat closing statement on "${scenario}".`
        }
      ],
      improvements: [
        {
          title: 'Add One Specific Example',
          quote: `"${quote1.slice(0, 65)}..."`,
          critique: 'Sharing one simple real-life story or everyday example helps people picture your point easily.',
          rewrite: 'For example, think about how often this happens in everyday life—it really proves my point.'
        },
        {
          title: 'Keep Sentences Simple & Direct',
          quote: `"${quote2.slice(0, 65)}..."`,
          critique: 'When you hesitate, just state your main thought in one short sentence.',
          rewrite: 'I hear your point, but here is why my side still makes more practical sense.'
        },
        {
          title: 'Strong Finish',
          quote: `"${quote3.slice(0, 65)}..."`,
          critique: 'Finish with a smile and a clear summary sentence.',
          rewrite: 'Overall, that is why this is the best and most sensible way forward.'
        }
      ],
      persuasion: {
        score: 9,
        reason: `Your points were relatable and easy to follow on "${scenario}".`
      },
      handlingObjections: {
        score: 9,
        reason: `You handled every gentle question with kindness and great composure.`
      },
      concessions: {
        score: 8,
        reason: `You acknowledged the other side nicely while keeping your main opinion intact.`
      },
      closing: {
        score: 9,
        reason: `A very warm and encouraging closing argument to conclude your debate.`
      },
      weakestLines: [
        {
          original: quote2,
          critique: 'A little brief when explaining your reason.',
          rewrite: 'I hear your point, but here is why my side still makes more practical sense.'
        },
        {
          original: quote3,
          critique: 'Could end with an even more cheerful final sentence.',
          rewrite: 'Overall, that is why this is the best and most sensible way forward.'
        }
      ],
      topTip: 'Keep sharing real everyday examples—they make your arguments fun and memorable!'
    };
  }

  return {
    overallScore: difficulty === 'HARD' ? 7.8 : 8.5,
    overallGrade: difficulty === 'HARD' ? 'B+' : 'A-',
    winner: 'USER' as const,
    verdict: difficulty === 'HARD'
      ? `Victory for User under High Pressure: You withstood aggressive cross-examination on "${scenario}" and defended key logical vulnerabilities.`
      : `Victory for User: You maintained unwavering topic focus throughout all 6 rounds on "${scenario}", effectively neutralizing DealDebate's skepticism with structured reasoning.`,
    dealOutcome: `Debate Won: Persuasive Argument Sustained`,
    executiveSummary: `Across 6 intensive rounds on "${scenario}", you demonstrated solid composure, agile reframing, and consistent topic loyalty against DealDebate (${opponent.title}).`,
    strengths: [
      {
        title: 'Strong Opening Thematic Stance',
        quote: `"${quote1}"`,
        explanation: `You immediately established the analytical terms of the debate on "${scenario}" rather than letting the opponent dictate the framing.`
      },
      {
        title: 'Defused Counter-Arguments under Pressure',
        quote: `"${quote2}"`,
        explanation: 'You absorbed the opponent’s skepticism directly and pivoted back to your core thesis without becoming defensive.'
      },
      {
        title: 'Decisive Closing Synthesis',
        quote: `"${quote3}"`,
        explanation: `Your final statement wrapped up the dialogue on "${scenario}" by synthesizing your key differentiators with high conviction.`
      }
    ],
    improvements: [
      {
        title: 'Unnecessary Concession on Consistency',
        quote: `"${quote2.slice(0, 65)}..."`,
        critique: 'You acknowledged a potential flaw without immediately tying it back to a compensating strength on this topic.',
        rewrite: 'Even acknowledging those trade-offs, the net performance advantage remains overwhelmingly superior.'
      },
      {
        title: 'Over-Reliance on Generalities',
        quote: `"${quote1.slice(0, 65)}..."`,
        critique: 'Opening assertions carry significantly more weight when anchored to a specific real-world example or statistic.',
        rewrite: 'The empirical record proves this: when examined under identical conditions, the outcome consistently favors this position.'
      },
      {
        title: 'Passive Closing Phrasing',
        quote: `"${quote3.slice(0, 65)}..."`,
        critique: 'Tentative language in the final round surrenders command of the outcome.',
        rewrite: 'The evidence presented across these rounds leaves no doubt: this conclusion stands as the only logically consistent outcome.'
      }
    ],
    persuasion: {
      score: difficulty === 'HARD' ? 7 : 8,
      reason: `When you stated "${quote1.slice(0, 60)}...", you established clear conviction and thematic relevance for "${scenario}".`
    },
    handlingObjections: {
      score: difficulty === 'HARD' ? 8 : 8,
      reason: `Under direct scrutiny, you maintained poise and addressed DealDebate's objections with structured arguments.`
    },
    concessions: {
      score: difficulty === 'HARD' ? 7 : 8,
      reason: `You conceded minor nuances appropriately without surrendering the central thesis of the debate.`
    },
    closing: {
      score: difficulty === 'HARD' ? 8 : 9,
      reason: `In Round 6, you delivered a crisp, synthesized conclusion that left no unresolved vulnerabilities.`
    },
    weakestLines: [
      {
        original: quote2,
        critique: 'Appeared slightly tentative in defending against the opponent’s counter-example.',
        rewrite: 'Even acknowledging those trade-offs, the net advantage remains overwhelmingly superior.'
      },
      {
        original: quote3,
        critique: 'Could have closed with an even firmer finality.',
        rewrite: 'The evidence presented across these rounds leaves no doubt that this conclusion is definitive.'
      }
    ],
    topTip: difficulty === 'HARD'
      ? 'Under aggressive cross-examination, anchor your assertions to empirical data before making broad claims.'
      : 'Always follow a concession with an immediate "however" clause that highlights an insurmountable advantage on your side.'
  };
}

// 1. Initialize Simulation Opponent (Strict Topic Fidelity)
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
      if (cleanUserRole && fallback.opponent) fallback.opponent.userRole = cleanUserRole;
      if (cleanDealSize && fallback.opponent) fallback.opponent.stakes = cleanDealSize;
      fallback.opponent.difficulty = diff;
      res.json(fallback);
      return;
    }

    const systemInstruction = `You are DealDebate, an expert opponent and debater.

MANDATORY DIRECTIVE: 100% TOPIC FIDELITY IS STRICTLY ENFORCED.
The user has provided this exact scenario / motion / debate topic:
"${cleanScenario}"

CRITICAL RULES:
1. ABSOLUTE TOPIC LOYALTY:
   - All arguments, persona traits, examples, domain facts, and objections MUST come directly from the subject matter of "${cleanScenario}" (e.g. sports, movies, college life, food, philosophy, technology, everyday situations, etc.).
   - NEVER EVER DEFAULT TO GENERIC BUSINESS OR CORPORATE JARGON (such as CFO, enterprise software, IT capex, budget austerity, ROI, SLA, profit margins, procurement) UNLESS "${cleanScenario}" is explicitly and literally about corporate business, contracts, or procurement.
2. TAILOR THE OPPONENT DIRECTLY TO THE SUBJECT MATTER:
   - If SPORTS ("Formula 1 racing", "messi vs ronaldo", "NBA", "cricket"):
     Opponent MUST be a specialized sports analyst, tactical debater, or race strategist. The opening line MUST cite authentic sports facts, stats, rules, or player comparisons on "${cleanScenario}".
   - If MOVIES / CINEMA / POP CULTURE:
     Opponent MUST be a film critic or cultural analyst debating narrative structure, cinematography, or character arcs.
   - If COLLEGE / EDUCATION / ACADEMICS ("AI in colleges", "student life"):
     Opponent MUST be an academic dean, professor, or student affairs debater debating learning integrity, essays, critical thinking, or student welfare.
   - If FOOD / SCIENCE / PHILOSOPHY / EVERYDAY LIFE:
     Opponent MUST be an authentic domain specialist or passionate contrary debater.
   - If CORPORATE / BUSINESS (salary, contract negotiation, vendor):
     Opponent should be an executive buyer, director, or hiring manager.
3. DIFFICULTY BEHAVIOR (${diff}):
   - EASY (FOR A TOTAL BEGINNER):
     * Use very simple, everyday English.
     * Keep arguments short and uncomplicated.
     * Gentle opposition and easy rebuttals — like teaching someone their first debate!
     * Encouraging, kind, and supportive tone.
     * Provide a 1-sentence helpful coaching hint.
   - MEDIUM (BALANCED):
     * Natural, balanced arguments, medium difficulty and realistic pushback.
   - HARD (ADVANCED & AGGRESSIVE):
     * Sharp, aggressive, advanced vocabulary, strong counter-arguments.
     * Dissect logic ruthlessly, expose factual gaps, demand rigorous empirical proof.
4. BRANDING:
   - "name": MUST ALWAYS be "DealDebate" (never use a personal human name).
5. "openingLine": EXACTLY 2 to 3 sentences long. Jump straight into character and debate the exact topic "${cleanScenario}".`;

    const prompt = `TOPIC / MOTION: "${cleanScenario}"
CATEGORY: ${cat}
${cleanUserRole ? `USER ROLE: "${cleanUserRole}"` : ''}
${cleanRole ? `REQUESTED OPPONENT ROLE: "${cleanRole}"` : ''}
${cleanDealSize ? `STAKES / SPECIFICS: "${cleanDealSize}"` : ''}
DIFFICULTY: ${diff}

Generate the opponent profile and opening line. Remember: 100% topic fidelity to "${cleanScenario}", zero corporate buzzwords unless the topic is business.`;

    const rawText = await generateGeminiContent(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            opponent: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                title: { type: Type.STRING, description: 'Domain-specific title matching the topic (e.g. F1 Technical Analyst, Football Critic, Academic Dean)' },
                company: { type: Type.STRING, description: 'Domain-specific entity or forum matching the topic (e.g. F1 Technical Regulations Committee, European Football Digest, Academic Ethics Board)' },
                stance: { type: Type.STRING, description: 'Opponent counter-stance strictly focused on this topic' },
                initialObjection: { type: Type.STRING, description: 'Specific objection grounded strictly in the topic' },
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
              description: 'Opponent opening remark in 2-3 sentences strictly debating this topic.'
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

    const parsed = extractJson<{ opponent: OpponentProfile; openingLine: string; hint?: string }>(rawText);
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
    if (cleanUserRole && fallback.opponent) fallback.opponent.userRole = cleanUserRole;
    if (cleanDealSize && fallback.opponent) fallback.opponent.stakes = cleanDealSize;
    fallback.opponent.difficulty = diff;
    res.json(fallback);
  } catch (err: unknown) {
    console.error('Error during /api/negotiation/init call:', err);
    const fallback = generateFallbackPersona(cleanScenario, cleanRole, cleanDealSize, cat, diff);
    if (cleanUserRole && fallback.opponent) fallback.opponent.userRole = cleanUserRole;
    if (cleanDealSize && fallback.opponent) fallback.opponent.stakes = cleanDealSize;
    fallback.opponent.difficulty = diff;
    res.json(fallback);
  }
});

// 2. Simulation Round Reply (Strict Topic Fidelity)
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
      res.json(generateFallbackTurn(roundNum, userMessage, opponent?.title || 'Debater', isFinalRound, scenario, diff));
      return;
    }

    const transcriptContext = (history as ChatTurn[] || [])
      .map((t) => `${t.role === 'user' ? 'STUDENT' : 'DEALDEBATE'}: ${t.content}`)
      .join('\n');

    let dynamicRules = '';
    if (diff === 'EASY') {
      dynamicRules = `DIFFICULTY: EASY (FOR A TOTAL BEGINNER).
- Target audience: Total beginner debater. Teach them their first debate!
- Language: VERY SIMPLE everyday English. Avoid complex jargon.
- Arguments: Short arguments (1-2 sentences), gentle opposition, easy rebuttals that are easy to answer.
- Tone: Encouraging, kind, warm, friendly.
- Concessions: If the student gives any reasonable everyday point on "${scenario}", concede warmly! Praise their point and validate their thought.
- Hint: You MUST provide "hint": a very simple, encouraging 1-sentence tip showing the student how to respond easily.`;
    } else if (diff === 'HARD') {
      dynamicRules = `DIFFICULTY: HARD (HIGH-STAKES / ADVANCED DEBATE).
- Tone: Sharp, aggressive, uncompromising, high pressure.
- Vocabulary: Advanced, sophisticated vocabulary and domain terminology specific to "${scenario}".
- Counter-arguments: Fierce counter-arguments. Dissect weak premises, expose contradictions, point out fallacies, demand rigorous empirical verification.
- Concessions: Zero easy concessions. Challenge every assumption on this topic.
- Hint: Set hint to null.`;
    } else {
      dynamicRules = `DIFFICULTY: MEDIUM (MODERATE & BALANCED).
- Tone: Balanced, natural, professional debate.
- Arguments: Medium difficulty arguments, realistic pushback, balanced counter-points and trade-offs directly related to "${scenario}".`;
    }

    const systemInstruction = `You are DealDebate, an expert opponent debating "${scenario}".

ABSOLUTE MANDATORY DIRECTIVE: 100% TOPIC FIDELITY IS STRICTLY ENFORCED.
- You are debating: "${scenario}".
- ALL your arguments, counter-arguments, examples, analogies, and objections MUST come directly from the subject matter of "${scenario}" (e.g. sports, cinema, academic policy, everyday skills, etc.).
- NEVER default to generic corporate or business buzzwords (such as ROI, SLA, profit margins, enterprise distribution, budget cuts, software proposals) unless the topic itself is business.
- Stay 100% in character as DealDebate (${opponent?.title || 'Counterpart'}). Never use any human personal name.
- LENGTH: EXACTLY 2 to 4 sentences long.
- ${dynamicRules}`;

    const prompt = `SCENARIO / TOPIC: "${scenario}"
CATEGORY: ${cat}
DIFFICULTY: ${diff}
OPPONENT: DealDebate (${opponent?.title || 'Counterpart'} at ${opponent?.company || 'Organization'})
OPPONENT STANCE: ${opponent?.stance || 'Counter-perspective'}
PROGRESS: Round ${roundNum} of 6. ${isFinalRound ? 'THIS IS THE FINAL 6TH ROUND. Provide your concluding argument on this topic.' : ''}

TRANSCRIPT SO FAR:
${transcriptContext}

LATEST STATEMENT FROM STUDENT:
"${userMessage}"

Respond in 2 to 4 sentences directly addressing their point on "${scenario}". ${diff === 'EASY' ? 'Include a 1-sentence coaching hint.' : 'Set hint to null.'}`;

    const rawText = await generateGeminiContent(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'Opponent dialogue strictly in 2 to 4 sentences about this topic.'
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

    const parsed = extractJson<{ reply: string; sentiment: string; currentFocus: string; hint?: string }>(rawText);
    if (parsed && parsed.reply) {
      res.json(parsed);
      return;
    }

    res.json(generateFallbackTurn(roundNum, userMessage, opponent?.title || 'Debater', isFinalRound, scenario, diff));
  } catch (err: unknown) {
    console.error('Error during /api/negotiation/reply:', err);
    res.json(generateFallbackTurn(roundNum, userMessage, opponent?.title || 'Debater', isFinalRound, scenario, diff));
  }
});

// 3. Generate Report Card after 6 Rounds (Dramatically Clearer & High-Impact)
app.post('/api/negotiation/evaluate', async (req: Request, res: Response) => {
  const { scenario, opponent, history, category, difficulty } = req.body;
  if (!history || !Array.isArray(history) || history.length === 0) {
    res.status(400).json({ error: 'Valid negotiation history is required' });
    return;
  }

  const cat: ScenarioCategory = category || opponent?.scenarioType || inferCategory(scenario);
  const diff: DifficultyLevel = difficulty === 'HARD' ? 'HARD' : difficulty === 'MEDIUM' ? 'MEDIUM' : (opponent?.difficulty || 'EASY');

  try {
    const ai = getAiClient();
    if (!ai) {
      console.warn('GEMINI_API_KEY not configured. Generating detailed fallback report.');
      res.json(generateFallbackReport(scenario, opponent, history, cat, diff));
      return;
    }

    const transcript = (history as ChatTurn[])
      .map((t, i) => `[Turn ${i + 1} - ${t.role === 'user' ? 'STUDENT' : 'DEALDEBATE'} (Round ${t.round || Math.ceil((i + 1) / 2)})]:\n"${t.content}"`)
      .join('\n\n');

    let evalToneGuidance = '';
    if (diff === 'EASY') {
      evalToneGuidance = `DIFFICULTY: EASY (FOR A TOTAL BEGINNER).
- The student is a complete beginner doing their very first debate.
- Tone MUST be exceptionally KIND, SIMPLE, and ENCOURAGING.
- Use plain, friendly everyday English (no dense academic or debate jargon).
- Celebrate their effort, highlight what they did right warmly, and keep constructive critiques very gentle and simple to understand.`;
    } else if (diff === 'HARD') {
      evalToneGuidance = `DIFFICULTY: HARD (HIGH-STAKES / ADVANCED DEBATE).
- Rigorous, elite executive standards.
- Tone should be sharp, uncompromising, and analytical.
- Evaluate rhetorical precision, statistical support, logical fallacies, and rebuttal speed.`;
    } else {
      evalToneGuidance = `DIFFICULTY: MEDIUM (MODERATE & BALANCED).
- Balanced, objective, constructive feedback suitable for general debate skill improvement.`;
    }

    const systemInstruction = `You are an expert executive communication and debate judge analyzing a student's 6-round simulation on "${scenario}".
${evalToneGuidance}
Quote the student verbatim from the transcript for all strengths and improvements. Return strictly valid JSON matching the schema.`;

    const prompt = `TOPIC: "${scenario}"
DIFFICULTY: ${diff}
OPPONENT: DealDebate (${opponent?.title || 'Counterpart'})

TRANSCRIPT:
${transcript}

EVALUATION REQUIREMENTS (ALL FIELDS MANDATORY - TAILORED TO ${diff} DIFFICULTY):
1. "overallScore": Number from 1.0 to 10.0 (e.g. 8.4) evaluating overall debate effectiveness, logic, and poise.
2. "overallGrade": Letter grade string (e.g. "A+", "A", "A-", "B+", "B", "C+").
3. "winner": EXACTLY one of: "USER", "OPPONENT", "DRAW".
4. "verdict": EXACTLY ONE PUNCHY SENTENCE declaring who won the debate and why, specifically mentioning the topic "${scenario}" and the decisive argument.
   Examples:
   - "Victory for Student: Consistently out-maneuvered DealDebate by grounding Ronaldo's clutch Champions League knockout statistics while neutralizing the playmaking critique."
   - "Victory for DealDebate: Exposed key contradictions in the student's tire management argument and maintained superior empirical leverage on aerodynamic dominance."
   - "Balanced Draw: Both sides traded compelling arguments on AI college policies with equal substantiation and zero unearned concessions."
5. "dealOutcome": 3-6 word summary (e.g. "Debate Won: Persuasive Argument Sustained", "Resolution Reached with Key Concessions").
6. "executiveSummary": 2 concise sentences summarizing performance on "${scenario}".
7. "strengths": EXACTLY 3 SPECIFIC STRENGTHS.
   For each item provide:
   - "title": 2-5 words punchy label (e.g. "Mastery of Historical Records", "Tactical Pivot under Pressure", "High-Impact Closing Defense")
   - "quote": QUOTE what the student actually said verbatim from the transcript!
   - "explanation": 1-2 clear sentences explaining why this moment was effective in the debate.
8. "improvements": EXACTLY 3 CONCRETE IMPROVEMENTS.
   For each item provide:
   - "title": 2-5 words punchy label (e.g. "Unnecessary Concession on Consistency", "Vague Generalization in Round 2", "Passive Closing Call")
   - "quote": QUOTE what the student actually said verbatim from the transcript where they showed weakness or hesitation!
   - "critique": 1 concise sentence explaining the specific deficit.
   - "rewrite": A concrete executive rewrite of what they SHOULD HAVE said instead!
9. 4 Competency scores (out of 10) with quoted evidence: "persuasion", "handlingObjections", "concessions", "closing".
10. "topTip": 1 actionable strategic directive for subsequent debates on this topic.`;

    const rawText = await generateGeminiContent(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            overallGrade: { type: Type.STRING },
            winner: { type: Type.STRING, description: 'One of: USER, OPPONENT, DRAW' },
            verdict: { type: Type.STRING, description: 'One punchy sentence on who won and why.' },
            dealOutcome: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            strengths: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  quote: { type: Type.STRING, description: 'Exact verbatim quote of student.' },
                  explanation: { type: Type.STRING }
                },
                required: ['title', 'quote', 'explanation']
              },
              description: 'Exactly 3 specific strengths with quoted moments.'
            },
            improvements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  quote: { type: Type.STRING, description: 'Exact verbatim quote of student.' },
                  critique: { type: Type.STRING },
                  rewrite: { type: Type.STRING, description: 'Rewritten example of what they could have said.' }
                },
                required: ['title', 'quote', 'critique', 'rewrite']
              },
              description: 'Exactly 3 concrete improvements with rewritten examples.'
            },
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
            topTip: { type: Type.STRING }
          },
          required: [
            'overallScore',
            'overallGrade',
            'verdict',
            'dealOutcome',
            'executiveSummary',
            'strengths',
            'improvements',
            'persuasion',
            'handlingObjections',
            'concessions',
            'closing',
            'topTip'
          ]
        }
      }
    });

    const parsed = extractJson<any>(rawText);
    if (parsed && parsed.overallScore && parsed.verdict && parsed.strengths && parsed.improvements) {
      // Ensure backwards compatibility with weakestLines
      if (!parsed.weakestLines) {
        parsed.weakestLines = parsed.improvements.map((imp: any) => ({
          original: imp.quote,
          critique: imp.critique,
          rewrite: imp.rewrite
        }));
      }
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
