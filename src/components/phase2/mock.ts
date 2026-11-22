/**
 * Jury system — MOCK DATA ONLY (UI phase).
 *
 * Nothing here talks to the database yet. The backend team can replace the
 * store in `juryStore.ts` with API calls and keep these shapes as the contract.
 */
import type { ExpoProjectCategory } from '@/lib/nexus/constants';

export type PanelId = 1 | 2;

export type Juror = {
  id: string;
  name: string;
  designation: string;
  email: string;
  panel: PanelId;
  username: string;
  password: string;
};

export type Team = {
  id: string;
  code: string;
  title: string;
  category: ExpoProjectCategory;
  college: string;
  members: string[];
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
export const total = (s: Scores) => CRITERIA.reduce((acc, c) => acc + s[c.id], 0);
export const blankScores = (): Scores => ({ innovation: 0, relevance: 0, technical: 0, demo: 0, presentation: 0 });

/** Each team: 5 min presentation, then 5 min Q&A. */
export const SLOT = { presentSeconds: 5 * 60, qaSeconds: 5 * 60 };
export const SLOT_TOTAL = SLOT.presentSeconds + SLOT.qaSeconds;

export const PANEL_NAMES: Record<PanelId, string> = { 1: 'Panel 1', 2: 'Panel 2' };

/** Panel 1 as given by the organising team; Panel 2 names still to be confirmed. */
export const SEED_JURORS: Juror[] = [
  { id: 'j1', name: 'Dr. Krishnaraj', designation: 'Jury · Panel 1', email: '', panel: 1, username: 'krishnaraj', password: 'nexus-k7q2' },
  { id: 'j2', name: 'Dr. Sujay Kumar', designation: 'Jury · Panel 1', email: '', panel: 1, username: 'sujay', password: 'nexus-s4m9' },
  { id: 'j3', name: 'Vineetha Pais', designation: 'Jury · Panel 1', email: '', panel: 1, username: 'vineetha', password: 'nexus-v8d3' },
  { id: 'j4', name: 'Juror 4 (TBC)', designation: 'Jury · Panel 2', email: '', panel: 2, username: 'juror4', password: 'nexus-p2a1' },
  { id: 'j5', name: 'Juror 5 (TBC)', designation: 'Jury · Panel 2', email: '', panel: 2, username: 'juror5', password: 'nexus-p2b6' },
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

export const TEAMS: Team[] = titles.map(([title, category], i) => ({
  id: `t${i + 1}`,
  code: `EXPO-${String(i + 1).padStart(3, '0')}`,
  title,
  category,
  college: `Sample College ${String.fromCharCode(65 + (i % 8))}`,
  members: Array.from({ length: 2 + (i % 3) }, (_, k) => `Student ${i + 1}.${k + 1}`),
}));

/** Short readable password for new jurors, e.g. nexus-h3k8. */
export function makePassword() {
  const c = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += c[Math.floor(Math.random() * c.length)];
  return `nexus-${s}`;
}

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
