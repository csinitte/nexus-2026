'use client';

/**
 * Jury system state — MOCK, browser-only.
 *
 * Saved in localStorage and broadcast between tabs, so the admin page and the
 * jury portal stay in sync on one computer for demos (open /admin/jury in one
 * tab and /jury in another). The backend team replaces this file with API
 * calls + realtime; components only use `useJury()` and `jury.*` actions.
 */
import { useSyncExternalStore } from 'react';
import {
  SEED_JURORS,
  TEAMS,
  blankScores,
  makePassword,
  makeUsername,
  total,
  type Juror,
  type PanelId,
  type Scores,
} from './mock';

export type Evaluation = { scores: Scores; comment: string; at: number };

export type PanelSession = {
  teamId: string | null;
  /** epoch ms when the current run started, if running */
  startedAt: number | null;
  /** seconds already elapsed before the current run */
  accumulated: number;
  running: boolean;
};

export type JuryState = {
  jurors: Juror[];
  /** presentation order per panel (team ids) */
  order: Record<PanelId, string[]>;
  session: Record<PanelId, PanelSession>;
  /** teamId -> jurorId -> evaluation */
  evals: Record<string, Record<string, Evaluation>>;
  finalists: string[];
  finalsLocked: boolean;
};

const KEY = 'nexus-jury-demo-v1';
const CHANNEL = 'nexus-jury';

const emptySession = (): PanelSession => ({ teamId: null, startedAt: null, accumulated: 0, running: false });

export const initialState = (): JuryState => ({
  jurors: SEED_JURORS,
  order: { 1: [], 2: [] },
  session: { 1: emptySession(), 2: emptySession() },
  evals: {},
  finalists: [],
  finalsLocked: false,
});

const SERVER_STATE = initialState();
let state: JuryState | null = null;
const listeners = new Set<() => void>();
let channel: BroadcastChannel | null = null;

function load(): JuryState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initialState(), ...(JSON.parse(raw) as JuryState) };
  } catch {
    /* storage blocked or corrupt — fall back to seed */
  }
  return initialState();
}

function ensure(): JuryState {
  if (state) return state;
  state = load();
  try {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = () => {
      state = load();
      listeners.forEach((l) => l());
    };
  } catch {
    /* BroadcastChannel unsupported — storage event below still works */
  }
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    state = load();
    listeners.forEach((l) => l());
  });
  return state;
}

function set(update: (s: JuryState) => JuryState) {
  state = update(ensure());
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  channel?.postMessage('changed');
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  ensure();
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useJury(): JuryState {
  return useSyncExternalStore(subscribe, ensure, () => SERVER_STATE);
}

/** Seconds elapsed on a panel's current team at time `now`. */
export function elapsedOf(s: PanelSession, now: number) {
  return s.accumulated + (s.running && s.startedAt && now ? Math.max(0, now - s.startedAt) / 1000 : 0);
}

export function averageOf(st: JuryState, teamId: string) {
  const list = Object.values(st.evals[teamId] ?? {});
  return list.length ? list.reduce((a, e) => a + total(e.scores), 0) / list.length : 0;
}

export function panelOf(st: JuryState, teamId: string): PanelId | null {
  if (st.order[1].includes(teamId)) return 1;
  if (st.order[2].includes(teamId)) return 2;
  return null;
}

function shuffle<T>(a: T[]) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export const jury = {
  addJuror(input: { name: string; designation: string; email: string; panel: PanelId }) {
    let created: Juror | null = null;
    set((s) => {
      const juror: Juror = {
        id: `j${Date.now()}`,
        ...input,
        username: makeUsername(input.name, s.jurors.map((j) => j.username)),
        password: makePassword(),
      };
      created = juror;
      return { ...s, jurors: [...s.jurors, juror] };
    });
    return created as Juror | null;
  },
  removeJuror(id: string) {
    set((s) => ({ ...s, jurors: s.jurors.filter((j) => j.id !== id) }));
  },
  resetPassword(id: string) {
    set((s) => ({ ...s, jurors: s.jurors.map((j) => (j.id === id ? { ...j, password: makePassword() } : j)) }));
  },
  setJurorPanel(id: string, panel: PanelId) {
    set((s) => ({ ...s, jurors: s.jurors.map((j) => (j.id === id ? { ...j, panel } : j)) }));
  },

  /** Shuffle every team and split them evenly across the two panels. */
  randomAssign() {
    set((s) => {
      const ids = shuffle(TEAMS.map((t) => t.id));
      const half = Math.ceil(ids.length / 2);
      return { ...s, order: { 1: ids.slice(0, half), 2: ids.slice(half) }, session: { 1: emptySession(), 2: emptySession() } };
    });
  },
  moveTeam(teamId: string, to: PanelId) {
    set((s) => {
      const from: PanelId = to === 1 ? 2 : 1;
      if (!s.order[from].includes(teamId)) return s;
      return { ...s, order: { ...s.order, [from]: s.order[from].filter((t) => t !== teamId), [to]: [...s.order[to], teamId] } };
    });
  },
  clearAssignments() {
    set((s) => ({ ...s, order: { 1: [], 2: [] }, session: { 1: emptySession(), 2: emptySession() } }));
  },

  selectTeam(panel: PanelId, teamId: string) {
    set((s) => ({ ...s, session: { ...s.session, [panel]: { ...emptySession(), teamId } } }));
  },
  start(panel: PanelId) {
    set((s) => {
      const cur = s.session[panel];
      if (!cur.teamId || cur.running) return s;
      return { ...s, session: { ...s.session, [panel]: { ...cur, running: true, startedAt: Date.now() } } };
    });
  },
  pause(panel: PanelId) {
    set((s) => {
      const cur = s.session[panel];
      if (!cur.running) return s;
      return {
        ...s,
        session: { ...s.session, [panel]: { ...cur, running: false, startedAt: null, accumulated: elapsedOf(cur, Date.now()) } },
      };
    });
  },
  resetTimer(panel: PanelId) {
    set((s) => ({ ...s, session: { ...s.session, [panel]: { ...emptySession(), teamId: s.session[panel].teamId } } }));
  },
  /** Move to the next team in this panel's order. */
  next(panel: PanelId) {
    set((s) => {
      const order = s.order[panel];
      const i = s.session[panel].teamId ? order.indexOf(s.session[panel].teamId!) : -1;
      const teamId = order[i + 1] ?? null;
      return { ...s, session: { ...s.session, [panel]: { ...emptySession(), teamId } } };
    });
  },

  submitEval(teamId: string, jurorId: string, scores: Scores, comment: string) {
    set((s) => ({
      ...s,
      evals: { ...s.evals, [teamId]: { ...(s.evals[teamId] ?? {}), [jurorId]: { scores, comment, at: Date.now() } } },
    }));
  },

  toggleFinalist(teamId: string) {
    set((s) =>
      s.finalsLocked
        ? s
        : { ...s, finalists: s.finalists.includes(teamId) ? s.finalists.filter((t) => t !== teamId) : [...s.finalists, teamId] },
    );
  },
  setFinalsLocked(locked: boolean) {
    set((s) => ({ ...s, finalsLocked: locked }));
  },

  /** Demo helper: fill believable scores + comments wherever a judge hasn't scored yet. */
  fillSampleScores() {
    const notes = [
      'Clear problem statement, demo worked end to end.',
      'Good idea — needs real-world testing data.',
      'Strong Q&A, every member could explain their part.',
      'Hardware prototype was impressive for the time given.',
      'Presentation ran long; core idea is solid.',
      '',
    ];
    set((s) => {
      const evals = { ...s.evals };
      ([1, 2] as PanelId[]).forEach((p) => {
        const panelJurors = s.jurors.filter((j) => j.panel === p);
        s.order[p].forEach((teamId, ti) => {
          evals[teamId] = { ...(evals[teamId] ?? {}) };
          const seed = Number(teamId.replace(/\D/g, '')) || ti;
          panelJurors.forEach((j, ji) => {
            if (evals[teamId][j.id]) return; // never overwrite a real submission
            const base = 4 + ((seed * 7 + ji * 3) % 6);
            const sc = blankScores();
            (Object.keys(sc) as (keyof Scores)[]).forEach((k, ki) => (sc[k] = Math.min(10, base + ((ki * 5 + seed + ji) % 4))));
            evals[teamId][j.id] = { scores: sc, comment: notes[(seed + ji) % notes.length], at: Date.now() };
          });
        });
      });
      return { ...s, evals };
    });
  },
  resetDemo() {
    set(() => initialState());
  },
};
