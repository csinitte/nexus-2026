'use client';

import { useSyncExternalStore } from 'react';
import {
  emptyProgress,
  total,
  type IssuedCredential,
  type IssuedVolunteerCredential,
  type JuryState,
  type PanelId,
  type Scores,
} from './jury-types';

export { elapsedOf } from './jury-types';
export type { JuryState, PanelSession } from './jury-types';

type Scope = 'admin' | 'portal' | 'volunteer';
type Connection = { state: JuryState; status: 'loading' | 'ready' | 'signed-out' | 'error'; error: string };
const empty: Connection = {
  state: { ...emptyProgress(), teams: [], jurors: [], volunteers: [], me: null, volunteerMe: null },
  status: 'loading',
  error: '',
};

async function request<T>(scope: string, body?: object): Promise<T> {
  const response = await fetch(`/api/jury/${scope}`, {
    cache: 'no-store',
    ...(body && { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || 'Could not reach the jury service.'), { status: response.status });
  return data as T;
}

function makeStore(scope: Scope) {
  let current = empty;
  let timer: ReturnType<typeof setInterval> | undefined;
  let reading = false;
  let generation = 0;
  let pending = 0;
  let queue = Promise.resolve();
  const listeners = new Set<() => void>();

  function publish(next: Connection) {
    current = next;
    for (const listener of listeners) listener();
  }

  function handle(error: unknown) {
    const status = (error as { status?: number })?.status;
    const message = error instanceof Error ? error.message : 'Could not reach the jury service.';
    if (status === 401) publish({ ...empty, status: 'signed-out' });
    else if (status === 403 || current.status !== 'ready') publish({ ...empty, status: 'error', error: message });
    else publish({ ...current, error: message });
  }

  async function refresh() {
    if (reading || pending) return;
    reading = true;
    const atStart = generation;
    try {
      const state = await request<JuryState>(scope);
      if (atStart === generation) publish({ ...current, state, status: 'ready', error: '' });
    } catch (error) {
      if (atStart === generation) handle(error);
    } finally {
      reading = false;
    }
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    if (!timer) {
      void refresh();
      timer = setInterval(refresh, 2_000);
    }
    return () => {
      listeners.delete(listener);
      if (!listeners.size) {
        clearInterval(timer);
        timer = undefined;
      }
    };
  }

  function mutate(action: string, fields: object = {}) {
    pending++;
    generation++;
    const mutation = queue.then(async () => {
      try {
        const result = await request<{ state: JuryState; credential?: IssuedCredential | IssuedVolunteerCredential }>(
          scope,
          { action, ...fields }
        );
        publish({ state: result.state, status: 'ready', error: '' });
        return result.credential ?? null;
      } catch (error) {
        if ((error as { status?: number })?.status === 403 && (scope === 'portal' || scope === 'volunteer')) {
          publish({ ...current, error: (error as Error).message });
        } else handle(error);
        return false as const;
      } finally {
        pending--;
      }
    });
    queue = mutation.then(() => undefined);
    return mutation;
  }

  function clear() {
    generation++;
    publish({ ...empty, status: 'signed-out' });
  }

  return { subscribe, refresh, mutate, clear, read: () => current };
}

const stores: Record<Scope, ReturnType<typeof makeStore>> = {
  admin: makeStore('admin'),
  portal: makeStore('portal'),
  volunteer: makeStore('volunteer'),
};

export function useJuryConnection(scope: Scope) {
  const store = stores[scope];
  return useSyncExternalStore(store.subscribe, store.read, () => empty);
}

export function useJury() {
  return useJuryConnection('portal').state;
}

export function useVolunteerConnection() {
  return useJuryConnection('volunteer');
}

export function useVolunteer() {
  return useJuryConnection('volunteer').state;
}

export async function signInJuror(username: string, password: string) {
  await request('login', { username, password });
  stores.portal.clear();
  await stores.portal.refresh();
}

export async function signOutJuror() {
  await request('logout', {});
  stores.portal.clear();
}

export async function signInVolunteer(username: string, password: string) {
  await request('volunteer-login', { username, password });
  stores.volunteer.clear();
  await stores.volunteer.refresh();
}

export async function signOutVolunteer() {
  await request('volunteer-logout', {});
  stores.volunteer.clear();
}

/** Arithmetic average of all submitted judge scores for that team (Max 100). Excludes pending. */
export function averageOf(st: JuryState, teamId: string): number {
  const list = Object.values(st.evals[teamId] ?? {});
  if (!list.length) return 0;
  const sum = list.reduce((acc, evaluation) => acc + total(evaluation.scores), 0);
  return Math.round((sum / list.length) * 100) / 100;
}

const send = stores.admin.mutate;

export const jury = {
  addJuror: (input: { name: string; designation: string; email: string; panel: PanelId; password?: string }) => send('addJuror', input),
  removeJuror: (id: string) => send('removeJuror', { id }),
  resetPassword: (id: string) => send('resetPassword', { id }),
  setJurorPanel: (id: string, panel: PanelId) => send('setJurorPanel', { id, panel }),

  addVolunteer: (input: { name: string; panel: PanelId }) => send('addVolunteer', input),
  removeVolunteer: (id: string) => send('removeVolunteer', { id }),
  resetVolunteerPassword: (id: string) => send('resetVolunteerPassword', { id }),
  setVolunteerPanel: (id: string, panel: PanelId) => send('setVolunteerPanel', { id, panel }),

  randomAssign: () => send('randomAssign'),
  moveTeam: (teamId: string, panel: PanelId) => send('moveTeam', { teamId, panel }),
  clearAssignments: () => send('clearAssignments'),
  selectTeam: (panel: PanelId, teamId: string) => send('selectTeam', { panel, teamId }),
  start: (panel: PanelId) => send('start', { panel }),
  pause: (panel: PanelId) => send('pause', { panel }),
  resetTimer: (panel: PanelId) => send('resetTimer', { panel }),
  next: (panel: PanelId) => send('next', { panel }),
  toggleFinalist: (teamId: string) => send('toggleFinalist', { teamId }),
  setFinalsLocked: (locked: boolean) => send('setFinalsLocked', { locked }),
  submitEval: (teamId: string, scores: Scores, comment: string) =>
    stores.portal.mutate('submitEval', { teamId, scores, comment }),
};

export const volunteerTimer = {
  selectTeam: (panel: PanelId, teamId: string) => stores.volunteer.mutate('selectTeam', { panel, teamId }),
  start: (panel: PanelId) => stores.volunteer.mutate('start', { panel }),
  pause: (panel: PanelId) => stores.volunteer.mutate('pause', { panel }),
  resetTimer: (panel: PanelId) => stores.volunteer.mutate('resetTimer', { panel }),
  next: (panel: PanelId) => stores.volunteer.mutate('next', { panel }),
};
