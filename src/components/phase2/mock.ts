/**
 * Phase 2 — MOCK DATA ONLY.
 *
 * These screens are UI previews for the PRD's Phase 2 features (jury, scoring,
 * results, certificates, attendance, analytics, live updates). Nothing here is
 * read from or written to the database yet. When the backend lands, replace
 * these exports with API calls and keep the shapes as the contract.
 *
 * Names are deliberately generic placeholders — do not ship invented juror or
 * college names to production (PRD section 7).
 */
import { EXPO_PROJECT_CATEGORIES, type ExpoProjectCategory } from '@/lib/nexus/constants';
import { PRIZE_PARTS } from '@/data/prizes';

export type Juror = {
  id: string;
  name: string;
  email: string;
  designation: string;
  categories: ExpoProjectCategory[];
  status: 'invited' | 'active';
};

export type MockProject = {
  id: string;
  code: string;
  title: string;
  category: ExpoProjectCategory;
  college: string;
  team: string[];
  table: string;
};

/** Placeholder rubric — the organising team still has to confirm the real criteria. */
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

/** Exhibition slot from the PRD: 7 min presentation + 3 min Q&A. */
export const SLOT = { presentSeconds: 7 * 60, qaSeconds: 3 * 60 };

export const JURORS: Juror[] = [
  { id: 'j1', name: 'Mock Juror 01', email: 'juror01@example.com', designation: 'Industry · Placeholder', categories: ['AI, IoT & Intelligent Systems', 'Open Innovation'], status: 'active' },
  { id: 'j2', name: 'Mock Juror 02', email: 'juror02@example.com', designation: 'Faculty · Placeholder', categories: ['Sustainability & Environment', 'Energy & Resource Management'], status: 'active' },
  { id: 'j3', name: 'Mock Juror 03', email: 'juror03@example.com', designation: 'Industry · Placeholder', categories: ['Smart Infrastructure & Mobility', 'AI, IoT & Intelligent Systems'], status: 'active' },
  { id: 'j4', name: 'Mock Juror 04', email: 'juror04@example.com', designation: 'Faculty · Placeholder', categories: ['Healthcare & Social Innovation', 'Open Innovation'], status: 'invited' },
];

const titles: [string, ExpoProjectCategory][] = [
  ['Smart bin fill-level network', 'Sustainability & Environment'],
  ['Campus water leak detector', 'Energy & Resource Management'],
  ['Adaptive traffic signal model', 'Smart Infrastructure & Mobility'],
  ['Crop disease detection app', 'AI, IoT & Intelligent Systems'],
  ['Low-cost fall alert wearable', 'Healthcare & Social Innovation'],
  ['Solar panel dust monitor', 'Energy & Resource Management'],
  ['Bus arrival predictor', 'Smart Infrastructure & Mobility'],
  ['Sign language translator glove', 'Healthcare & Social Innovation'],
  ['E-waste sorting assistant', 'Sustainability & Environment'],
  ['Classroom energy dashboard', 'AI, IoT & Intelligent Systems'],
  ['Offline-first disaster mesh chat', 'Open Innovation'],
  ['Air quality street map', 'Sustainability & Environment'],
];

export const PROJECTS: MockProject[] = titles.map(([title, category], i) => ({
  id: `p${i + 1}`,
  code: `EXPO-${String(i + 1).padStart(3, '0')}`,
  title,
  category,
  college: `Sample College ${String.fromCharCode(65 + (i % 8))}`,
  team: Array.from({ length: 2 + (i % 3) }, (_, k) => `Student ${i + 1}.${k + 1}`),
  table: `T${String(i + 1).padStart(2, '0')}`,
}));

/** projectId → jurorIds */
export const ASSIGNMENTS: Record<string, string[]> = Object.fromEntries(
  PROJECTS.map((p) => [p.id, JURORS.filter((j) => j.categories.includes(p.category)).map((j) => j.id).slice(0, 2)]),
);

/** Deterministic fake scores so the previews look filled in. */
function fakeScore(seed: number): Scores {
  const v = (n: number) => 5 + ((seed * 7 + n * 3) % 6);
  return { innovation: v(1), relevance: v(2), technical: v(3), demo: v(4), presentation: v(5) };
}

/** projectId → jurorId → scores (some missing = still pending). */
export const SCORES: Record<string, Record<string, Scores>> = Object.fromEntries(
  PROJECTS.map((p, i) => [
    p.id,
    Object.fromEntries((ASSIGNMENTS[p.id] ?? []).filter((_, k) => i < 9 || k === 0).map((jid, k) => [jid, fakeScore(i + k)])),
  ]),
);

export const total = (s: Scores) => CRITERIA.reduce((acc, c) => acc + s[c.id], 0);

export type Ranked = MockProject & { average: number; scored: number; assigned: number };

export function rankProjects(): Ranked[] {
  return PROJECTS.map((p) => {
    const entries = Object.values(SCORES[p.id] ?? {});
    const average = entries.length ? entries.reduce((a, s) => a + total(s), 0) / entries.length : 0;
    return { ...p, average, scored: entries.length, assigned: ASSIGNMENTS[p.id]?.length ?? 0 };
  }).sort((a, b) => b.average - a.average);
}

/** Maps the real prize list onto the mock ranking. */
export function mockWinners() {
  const ranked = rankProjects();
  const [first, second, third, ...rest] = ranked;
  const taken = new Set<string>();
  // One award per project: each special award goes to the best remaining project on that criterion.
  const byCriterion = (id: CriterionId) => {
    const pick = rest
      .filter((p) => !taken.has(p.id))
      .map((p) => ({ p, v: Object.values(SCORES[p.id] ?? {}).reduce((a, s) => a + s[id], 0) }))
      .sort((a, b) => b.v - a.v)[0]?.p;
    if (pick) taken.add(pick.id);
    return pick;
  };
  const picks = [first, second, third, byCriterion('innovation'), byCriterion('relevance')];
  return PRIZE_PARTS.map((prize, i) => ({ prize, project: picks[i] }));
}

export type Attendance = {
  code: string;
  college: string;
  expected: number;
  checkedIn: number;
  time: string | null;
};

export const ATTENDANCE: Attendance[] = Array.from({ length: 10 }, (_, i) => {
  const expected = 3 + (i % 3);
  const checkedIn = i < 6 ? expected : i < 8 ? expected - 1 : 0;
  return {
    code: `NEXUS26-${String(1001 + i)}`,
    college: `Sample College ${String.fromCharCode(65 + i)}`,
    expected,
    checkedIn,
    time: checkedIn ? `09:${String(2 + i * 3).padStart(2, '0')} AM` : null,
  };
});

export type LiveUpdate = { id: string; time: string; tag: 'Now' | 'Notice' | 'Venue' | 'Results'; text: string; pinned?: boolean };

export const LIVE_UPDATES: LiveUpdate[] = [
  { id: 'u5', time: '11:42 AM', tag: 'Now', text: 'Student Branch Showcase is underway in the main auditorium. Presenters, please stay near the stage.', pinned: true },
  { id: 'u4', time: '11:20 AM', tag: 'Notice', text: 'Expo teams: set up at your assigned table by 1:45 PM. Table numbers are on your registration summary.' },
  { id: 'u3', time: '10:31 AM', tag: 'Now', text: 'Industry Panel Discussion has started — "From Skills to Startups".' },
  { id: 'u2', time: '9:40 AM', tag: 'Venue', text: 'Wi-Fi details are at the help desk near registration.' },
  { id: 'u1', time: '9:02 AM', tag: 'Notice', text: 'Registration and breakfast are open. Collect your badge at the desk.' },
];

export type CertificateKind = 'Participation' | 'Branch Showcase' | 'Expo Winner' | 'Special Award';

export type MockCertificate = { id: string; name: string; college: string; kind: CertificateKind; detail: string };

/** What a lookup by registration ID returns in the preview. */
export function mockCertificatesFor(code: string): MockCertificate[] {
  const c = code.trim().toUpperCase() || 'NEXUS26-1001';
  return [
    { id: `${c}-01`, name: 'Student 1.1', college: 'Sample College A', kind: 'Participation', detail: 'for participating' },
    { id: `${c}-02`, name: 'Student 1.2', college: 'Sample College A', kind: 'Branch Showcase', detail: 'for presenting at the Student Branch Showcase' },
    { id: `${c}-03`, name: 'Student 1.1', college: 'Sample College A', kind: 'Expo Winner', detail: 'for winning the Student Project Expo' },
  ];
}

export const CERT_BATCHES: { kind: CertificateKind; count: number; status: 'Generated' | 'Draft' | 'Not started' }[] = [
  { kind: 'Participation', count: 112, status: 'Generated' },
  { kind: 'Branch Showcase', count: 31, status: 'Generated' },
  { kind: 'Expo Winner', count: 11, status: 'Draft' },
  { kind: 'Special Award', count: 6, status: 'Not started' },
];

export const CATEGORY_COUNTS = EXPO_PROJECT_CATEGORIES.map((c) => ({ category: c, count: PROJECTS.filter((p) => p.category === c).length }));
