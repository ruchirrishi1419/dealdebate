import { ScenarioPreset, ScenarioCategory } from '../types';

export interface CategoryInfo {
  id: ScenarioCategory;
  name: string;
  opponentRoleDescription: string;
  description: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'NEGOTIATION',
    name: 'Negotiation',
    opponentRoleDescription: 'Executive Buyer / CFO / Vendor',
    description: 'Commercial dealmaking, contract renegotiations, and vendor price defense.'
  },
  {
    id: 'GROUP_DISCUSSION',
    name: 'Group Discussion',
    opponentRoleDescription: 'Opposing Debater / Policy Analyst',
    description: 'B-school admissions GDs, policy debates, and counter-argument handling.'
  },
  {
    id: 'INTERVIEW',
    name: 'Interview',
    opponentRoleDescription: 'Senior Interviewer / Hiring Lead',
    description: 'Executive hiring, behavioral drill-downs, and weakness positioning.'
  },
  {
    id: 'PITCHING',
    name: 'Pitching',
    opponentRoleDescription: 'Skeptical Venture Investor / Partner',
    description: 'Venture fundraising, elevator pitches, and business model defense.'
  },
  {
    id: 'EVERYDAY_SKILLS',
    name: 'Everyday Skills',
    opponentRoleDescription: 'Landlord / Boss / Recruiter',
    description: 'Real-world workplace conversations, boundary setting, and tenant negotiations.'
  }
];

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  // 1. NEGOTIATION
  {
    id: 'cfo-software',
    category: 'NEGOTIATION',
    title: 'Sell enterprise software to a hesitant CFO',
    scenario: 'Sell enterprise software to a hesitant CFO',
    opponentRole: 'Chief Financial Officer',
    tag: 'Overcome strict capital expenditure limits and justify ROI against existing legacy workflows.',
    opponentTypeLabel: 'Hesitant CFO',
    defaultUserRole: 'Enterprise Account Executive',
    defaultOpponentRole: 'Chief Financial Officer',
    defaultStakes: 'Annual enterprise software contract'
  },
  {
    id: 'salary-hike',
    category: 'NEGOTIATION',
    title: 'Negotiate a salary increase with your manager',
    scenario: 'Negotiate a salary increase with your manager',
    opponentRole: 'Division Director',
    tag: 'Build a business case for compensation adjustment based on verified performance and impact.',
    opponentTypeLabel: 'Division Manager',
    defaultUserRole: 'Senior Team Member',
    defaultOpponentRole: 'Senior Division Director',
    defaultStakes: 'Merit compensation adjustment'
  },
  {
    id: 'vendor-price-cut',
    category: 'NEGOTIATION',
    title: 'Negotiate with a vendor over pricing',
    scenario: 'Negotiate with a vendor over pricing and contract terms',
    opponentRole: 'VP of Commercial Accounts',
    tag: 'Push for cost reduction and favorable terms while preserving service delivery standards.',
    opponentTypeLabel: 'Supplier Executive',
    defaultUserRole: 'Procurement Specialist',
    defaultOpponentRole: 'VP of Commercial Accounts',
    defaultStakes: 'Annual vendor supplier contract'
  },

  // 2. GROUP DISCUSSION
  {
    id: 'gd-crypto',
    category: 'GROUP_DISCUSSION',
    title: 'Debate: Cryptocurrency and financial sovereignty',
    scenario: 'Should India ban or regulate cryptocurrency',
    opponentRole: 'Monetary Policy Debater',
    tag: 'Debate sovereign currency stability and retail risk versus blockchain innovation and decentralized finance.',
    opponentTypeLabel: 'Opposing Debater',
    defaultUserRole: 'Lead Debate Panelist',
    defaultOpponentRole: 'Monetary Policy Analyst & Debater',
    defaultStakes: 'National regulatory framework consensus'
  },
  {
    id: 'gd-wfh-office',
    category: 'GROUP_DISCUSSION',
    title: 'Debate: Remote work vs office',
    scenario: 'Work from home vs in-person office culture',
    opponentRole: 'Organizational Strategy Debater',
    tag: 'Argue employee flexibility and focus time against spontaneous collaboration and culture erosion.',
    opponentTypeLabel: 'Opposing Debater',
    defaultUserRole: 'Workplace Strategy Panelist',
    defaultOpponentRole: 'Organizational Culture Debater',
    defaultStakes: 'Executive workplace policy directive'
  },
  {
    id: 'gd-ai-jobs',
    category: 'GROUP_DISCUSSION',
    title: 'Debate: AI and jobs',
    scenario: 'AI will create more jobs than it destroys',
    opponentRole: 'Labor Economics Debater',
    tag: 'Contend with structural employment disruption versus long-term economic productivity expansion.',
    opponentTypeLabel: 'Opposing Debater',
    defaultUserRole: 'Technology & Policy Panelist',
    defaultOpponentRole: 'Labor Economics Debater',
    defaultStakes: 'Future of work policy resolution'
  },

  // 3. INTERVIEW
  {
    id: 'interview-tell-me-about-yourself',
    category: 'INTERVIEW',
    title: 'Interview: "Tell me about yourself"',
    scenario: 'Answer "tell me about yourself" in an executive job interview',
    opponentRole: 'Executive Hiring Director',
    tag: 'Deliver a structured narrative connecting your career arc, core differentiators, and role alignment.',
    opponentTypeLabel: 'Executive Interviewer',
    defaultUserRole: 'Executive Candidate',
    defaultOpponentRole: 'Executive Hiring Director',
    defaultStakes: 'Leadership hiring evaluation'
  },
  {
    id: 'interview-best-candidate',
    category: 'INTERVIEW',
    title: "Interview: Defend why you are the best candidate",
    scenario: "Defend why you're the best candidate for this role",
    opponentRole: 'Panel Interview Lead',
    tag: 'Differentiate your operational readiness from peer finalists using verified achievements.',
    opponentTypeLabel: 'Senior Interviewer',
    defaultUserRole: 'Finalist Candidate',
    defaultOpponentRole: 'Managing Director & Panel Lead',
    defaultStakes: 'Final round hiring selection'
  },
  {
    id: 'interview-biggest-weakness',
    category: 'INTERVIEW',
    title: 'Interview: Handle "what is your biggest weakness"',
    scenario: 'Handle "what is your biggest weakness" without sounding cliché',
    opponentRole: 'VP of Talent & People',
    tag: 'Discuss an authentic developmental area and the explicit guardrails you put in place to manage it.',
    opponentTypeLabel: 'Executive Interviewer',
    defaultUserRole: 'Candidate',
    defaultOpponentRole: 'VP of Talent & People',
    defaultStakes: 'Behavioral depth evaluation'
  },

  // 4. PITCHING
  {
    id: 'pitch-investor-idea',
    category: 'PITCHING',
    title: 'Venture pitch: Defend your business idea to an investor',
    scenario: 'Defend your business idea to a skeptical venture investor',
    opponentRole: 'General Partner at Venture Fund',
    tag: 'Demonstrate defensible moats, realistic unit economics, and customer acquisition payback under scrutiny.',
    opponentTypeLabel: 'Skeptical Investor',
    defaultUserRole: 'Startup Co-Founder & CEO',
    defaultOpponentRole: 'General Partner at Venture Fund',
    defaultStakes: 'Venture investment round'
  },
  {
    id: 'pitch-startup-2min',
    category: 'PITCHING',
    title: 'Pitch your startup in 2 minutes',
    scenario: 'Pitch your startup in 2 minutes to a venture partner',
    opponentRole: 'Founding Partner & Tech Angel',
    tag: 'Hook an investor with problem urgency, proprietary distribution, and monetization clarity.',
    opponentTypeLabel: 'Venture Partner',
    defaultUserRole: 'Founding Entrepreneur',
    defaultOpponentRole: 'Founding Partner & Tech Angel',
    defaultStakes: 'Follow-up partner meeting commitment'
  },

  // 5. EVERYDAY SKILLS
  {
    id: 'everyday-landlord-repairs',
    category: 'EVERYDAY_SKILLS',
    title: 'Ask your landlord to fix something',
    scenario: 'Ask your landlord to fix an urgent maintenance issue in your apartment',
    opponentRole: 'Property Owner & Landlord',
    tag: 'Communicate overdue repairs firmly and politely, referencing habitability standards and lease terms.',
    opponentTypeLabel: 'Reluctant Landlord',
    defaultUserRole: 'Tenant',
    defaultOpponentRole: 'Property Owner & Landlord',
    defaultStakes: 'Urgent residential maintenance repair'
  },
  {
    id: 'everyday-salary-new-job',
    category: 'EVERYDAY_SKILLS',
    title: 'Negotiate salary with a new employer',
    scenario: 'Negotiate compensation with a new employer after receiving an offer letter',
    opponentRole: 'Corporate Talent Acquisition Lead',
    tag: 'Anchor your target compensation range using peer benchmarks while maintaining positive rapport.',
    opponentTypeLabel: 'Hiring Recruiter',
    defaultUserRole: 'Incoming Hire',
    defaultOpponentRole: 'Corporate Talent Acquisition Lead',
    defaultStakes: 'Employment offer compensation package'
  },
  {
    id: 'everyday-disagree-boss',
    category: 'EVERYDAY_SKILLS',
    title: 'Disagree with your boss politely',
    scenario: 'Disagree with your boss politely regarding a flawed project strategy',
    opponentRole: 'Vice President & Direct Manager',
    tag: 'Challenge a flawed strategic directive constructively using objective data rather than defensiveness.',
    opponentTypeLabel: 'Direct Boss',
    defaultUserRole: 'Senior Team Member',
    defaultOpponentRole: 'Vice President & Direct Manager',
    defaultStakes: 'Strategic project roadmap adjustment'
  }
];
