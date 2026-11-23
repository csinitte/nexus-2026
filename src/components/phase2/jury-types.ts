export type PanelId = 1 | 2;

export type Juror = {
  id: string;
  name: string;
  designation: string;
  email: string;
  panel: PanelId;
  username: string;
};

export type Volunteer = {
  id: string;
  name: string;
  username: string;
  panel: PanelId;
};

export type Team = {
  id: string;
  code: string;
  title: string;
  name: string | null;
  category: string;
  college: string;
  members: string[];
};

/** Official NEXUS 2026 Evaluation Rubric (7 Criteria, 100% Total). */
export const CRITERIA = [
  {
    id: 'problem_relevance',
    label: 'How relevant is the problem being addressed?',
    shortLabel: 'Problem relevance',
    weightage: 15,
    hint: 'Addresses a genuine, real-world need with clear significance and context.',
  },
  {
    id: 'innovation',
    label: 'How innovative and original is the proposed solution?',
    shortLabel: 'Innovation & originality',
    weightage: 20,
    hint: 'Originality of the idea, novelty of approach, and uniqueness versus existing solutions.',
  },
  {
    id: 'technical_depth',
    label: 'How strong is the technical implementation?',
    shortLabel: 'Technical implementation',
    weightage: 20,
    hint: 'Architecture, engineering quality, complexity, and technology stack robustness.',
  },
  {
    id: 'functionality',
    label: 'How effectively does the project function as intended?',
    shortLabel: 'Effective functionality',
    weightage: 20,
    hint: 'Operational status, stability, execution, and effectiveness of the working demo.',
  },
  {
    id: 'feasibility',
    label: 'How feasible is the solution for real-world implementation?',
    shortLabel: 'Feasibility & viability',
    weightage: 10,
    hint: 'Practicality, usability, deployment viability, cost, and operational constraints.',
  },
  {
    id: 'presentation',
    label: 'How clearly and effectively is the project presented?',
    shortLabel: 'Presentation & Q&A',
    weightage: 10,
    hint: 'Clarity, articulation, team coordination, time management, and Q&A responses.',
  },
  {
    id: 'scalability_impact',
    label: 'What is the potential for scalability and real-world impact?',
    shortLabel: 'Scalability & impact',
    weightage: 5,
    hint: 'Growth potential, long-term impact, social or commercial benefit, and broader adoption.',
  },
] as const;

export type CriterionId = (typeof CRITERIA)[number]['id'];
export type Scores = Record<CriterionId, number>;
export const MAX_PER_CRITERION = 10;
export const MAX_TOTAL = 100;

/** Calculate weighted score for a single criterion: (Obtained Marks / 10) * Weightage */
export function criterionWeightedScore(mark: number, weightage: number): number {
  const clamped = Math.max(0, Math.min(10, Number(mark) || 0));
  return Math.round(((clamped / 10) * weightage) * 100) / 100;
}

/** Calculate sum of all 7 weighted scores (Max 100). */
export function totalWeightedScore(s: Partial<Scores> | undefined | null): number {
  if (!s) return 0;
  let sum = 0;
  for (const c of CRITERIA) {
    const val = Number(s[c.id]) || 0;
    sum += (Math.max(0, Math.min(10, val)) / 10) * c.weightage;
  }
  return Math.round(sum * 100) / 100;
}

/** Alias for backward compatibility */
export const total = totalWeightedScore;

export const blankScores = (): Scores => ({
  problem_relevance: 0,
  innovation: 0,
  technical_depth: 0,
  functionality: 0,
  feasibility: 0,
  presentation: 0,
  scalability_impact: 0,
});

/** Each team: 5 min presentation, then 5 min Q&A. Total 10 min. */
export const SLOT = { presentSeconds: 5 * 60, qaSeconds: 5 * 60 };
export const SLOT_TOTAL = SLOT.presentSeconds + SLOT.qaSeconds;

export const PANEL_NAMES: Record<PanelId, string> = { 1: 'Panel 1', 2: 'Panel 2' };

/** Username from a name: "Dr. Sujay Kumar" -> "sujay". */
export function makeUsername(name: string, taken: string[]) {
  const words = name
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !['dr', 'prof', 'mr', 'ms', 'mrs'].includes(w));
  const base = words[0] || 'user';
  let u = base;
  let n = 2;
  while (taken.includes(u)) u = `${base}${n++}`;
  return u;
}

export type Evaluation = { scores: Scores; comment: string; at: number };
export type PanelSession = {
  teamId: string | null;
  startedAt: number | null;
  accumulated: number;
  running: boolean;
  volunteerId?: string | null;
  volunteerName?: string | null;
};
export type JuryProgress = {
  order: Record<PanelId, string[]>;
  session: Record<PanelId, PanelSession>;
  evals: Record<string, Record<string, Evaluation>>;
  finalists: string[];
  finalsLocked: boolean;
};
export type JuryState = JuryProgress & {
  teams: Team[];
  jurors: Juror[];
  volunteers?: Volunteer[];
  me: Juror | null;
  volunteerMe?: Volunteer | null;
};
export type IssuedCredential = Juror & { password: string };
export type IssuedVolunteerCredential = Volunteer & { password: string };

export const emptySession = (): PanelSession => ({
  teamId: null, startedAt: null, accumulated: 0, running: false, volunteerId: null, volunteerName: null,
});

export const emptyProgress = (): JuryProgress => ({
  order: { 1: [], 2: [] },
  session: { 1: emptySession(), 2: emptySession() },
  evals: {},
  finalists: [],
  finalsLocked: false,
});

export function elapsedOf(s: PanelSession, now: number) {
  return s.accumulated + (s.running && s.startedAt && now ? Math.max(0, now - s.startedAt) / 1000 : 0);
}
