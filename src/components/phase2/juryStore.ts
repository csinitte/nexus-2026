'use client';

import { useSyncExternalStore } from 'react';
import { emptyProgress, total, type IssuedCredential, type JuryState, type PanelId, type Scores } from './jury-types';

export { elapsedOf } from './jury-types';
export type { JuryState, PanelSession } from './jury-types';

type Scope = 'admin' | 'portal';
type Connection = { state: JuryState; status: 'loading' | 'ready' | 'signed-out' | 'error'; error: string };
const empty: Connection = { state: { ...emptyProgress(), teams: [], jurors: [], me: null }, status: 'loading', error: '' };

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
      if (atStart === generation) publish({ ...current, state, status: 'ready' });
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
        const result = await request<{ state: JuryState; credential?: IssuedCredential }>(scope, { action, ...fields });
        publish({ state: result.state, status: 'ready', error: '' });
        return result.credential ?? null;
      } catch (error) {
        if ((error as { status?: number })?.status === 403 && scope === 'portal') {
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
const stores = { admin: makeStore('admin'), portal: makeStore('portal') };

export function useJuryConnection(scope: Scope) {
  const store = stores[scope];
  return useSyncExternalStore(store.subscribe, store.read, () => empty);
}

export function useJury() {
  return useJuryConnection('portal').state;
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

export function averageOf(st: JuryState, teamId: string) {
  const list = Object.values(st.evals[teamId] ?? {});
  return list.length ? list.reduce((sum, evaluation) => sum + total(evaluation.scores), 0) / list.length : 0;
}

const send = stores.admin.mutate;
export const jury = {
  addJuror: (input: { name: string; designation: string; email: string; panel: PanelId }) => send('addJuror', input),
  removeJuror: (id: string) => send('removeJuror', { id }),
  resetPassword: (id: string) => send('resetPassword', { id }),
  setJurorPanel: (id: string, panel: PanelId) => send('setJurorPanel', { id, panel }),
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
  submitEval: (teamId: string, scores: Scores, comment: string) => stores.portal.mutate('submitEval', { teamId, scores, comment }),
};
