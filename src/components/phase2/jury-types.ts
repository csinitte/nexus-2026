export type PanelId = 1 | 2;

export type Juror = {
  id: string;
  name: string;
  designation: string;
  email: string;
  panel: PanelId;
  username: string;
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

/** Expo scoring rubric used by both panels. */
export const CRITERIA = [
  { id: 'innovation', label: 'Innovation', hint: 'Originality of the idea and approach' },
  { id: 'relevance', label: 'Theme relevance', hint: 'Fit with a sustainable, smarter future' },
  { id: 'technical', label: 'Technical depth', hint: 'Engineering quality and complexity' },
  { id: 'demo', label: 'Working demo', hint: 'How much of it actually works on the day' },
  { id: 'presentation', label: 'Presentation', hint: 'Clarity, Q&A, every member can explain it' },
] as const;

export type CriterionId = (typeof CRITERIA)[number]['id'];
export type Scores = Record<CriterionId, number>;
export const MAX_PER_CRITERION = 10;
export const MAX_TOTAL = CRITERIA.length * MAX_PER_CRITERION;
export const total = (s: Scores) => CRITERIA.reduce((acc, c) => acc + s[c.id], 0);
export const blankScores = (): Scores => ({ innovation: 0, relevance: 0, technical: 0, demo: 0, presentation: 0 });

/** Each team: 5 min presentation, then 5 min Q&A. */
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
  const base = words[0] || 'juror';
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
  me: Juror | null;
};
export type IssuedCredential = Juror & { password: string };

export const emptySession = (): PanelSession => ({
  teamId: null, startedAt: null, accumulated: 0, running: false,
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
