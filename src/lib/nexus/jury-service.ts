import { createHmac, randomBytes, randomInt, randomUUID } from 'node:crypto';
import { asc, eq, ne } from 'drizzle-orm';
import { getDb } from '@/db';
import { collegeRegistrations, expoProjects, expoTeamMembers, juryControl, participants } from '@/db/schema';
import { hashPassword, safeEqual, verifyPassword } from './admin-auth';
import {
  CRITERIA, MAX_PER_CRITERION, SLOT_TOTAL, elapsedOf, emptyProgress, emptySession, makeUsername,
  type IssuedCredential, type Juror, type JuryProgress, type JuryState, type PanelId, type Scores, type Team,
} from '@/components/phase2/jury-types';

type StoredJuror = Juror & { passwordHash: string | null };
type Control = JuryProgress & { jurors: StoredJuror[]; started?: boolean };
export type JuryInput = Record<string, unknown>;

const panels = [1, 2] as const;
const blankControl = (): Control => ({
  ...emptyProgress(),
  jurors: [
    ['krishnaraj', 'Dr. Krishnaraj'],
    ['sujay', 'Dr. Sujay Kumar'],
    ['vineetha', 'Vineetha Pais'],
  ].map(([username, name]) => ({
    id: username, username, name, panel: 1, designation: 'Jury · Panel 1', email: '', passwordHash: null,
  })),
});

export class JuryError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

function publicJuror({ id, name, designation, email, panel, username }: StoredJuror): Juror {
  return { id, name, designation, email, panel, username };
}

async function getTeams(): Promise<Team[]> {
  const db = await getDb();
  const rows = await db.select({
    id: expoProjects.id, code: collegeRegistrations.registrationCode, title: expoProjects.projectTitle,
    name: expoProjects.teamName, category: expoProjects.category, college: collegeRegistrations.collegeName,
  }).from(expoProjects).innerJoin(collegeRegistrations, eq(expoProjects.registrationId, collegeRegistrations.id))
    .where(ne(collegeRegistrations.registrationStatus, 'cancelled')).orderBy(asc(collegeRegistrations.submittedAt));
  const members = await db.select({ id: expoTeamMembers.projectId, name: participants.fullName })
    .from(expoTeamMembers).innerJoin(participants, eq(expoTeamMembers.participantId, participants.id))
    .orderBy(asc(participants.participantIndex));
  const byTeam = new Map<string, string[]>();
  for (const member of members) {
    const names = byTeam.get(member.id) ?? [];
    names.push(member.name);
    byTeam.set(member.id, names);
  }
  return rows.map(({ name, ...team }) => ({ ...team, name, members: byTeam.get(team.id) ?? [] }));
}

function activeTeams(state: Control, teams: Team[]) {
  const ids = new Set(teams.map((team) => team.id));
  for (const panel of panels) {
    state.order[panel] = state.order[panel].filter((id) => ids.has(id));
    const { teamId } = state.session[panel];
    if (teamId && !ids.has(teamId)) state.session[panel] = emptySession();
  }
  state.finalists = state.finalists.filter((id) => ids.has(id));
}

async function readControl(): Promise<Control> {
  const db = await getDb();
  const [row] = await db.select().from(juryControl).where(eq(juryControl.id, 1));
  return (row?.state as Control | undefined) ?? blankControl();
}

function snapshot(state: Control, teams: Team[], viewer: StoredJuror | 'admin'): JuryState {
  activeTeams(state, teams);
  if (viewer === 'admin') {
    const { jurors, ...progress } = state;
    return { ...progress, jurors: jurors.map(publicJuror), teams, me: null };
  }
  const { id, panel } = viewer;
  const mine = new Set(state.order[panel]);
  const summary = emptyProgress();
  summary.order[panel] = state.order[panel];
  summary.session[panel] = state.session[panel];
  for (const teamId of mine) {
    const evaluation = state.evals[teamId]?.[id];
    if (evaluation) summary.evals[teamId] = { [id]: evaluation };
  }
  return {
    ...summary,
    jurors: [], me: { ...publicJuror(viewer), email: '' },
    teams: teams.filter((team) => mine.has(team.id)),
  };
}

const sessionSeconds = 12 * 60 * 60;
const cookieName = 'nexus_jury';
function sign(juror: StoredJuror, expires: number) {
  const secret = process.env.NEXUS_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new JuryError('Jury authentication is not configured.', 503);
  return createHmac('sha256', secret).update(JSON.stringify(['jury', juror.id, expires, juror.passwordHash])).digest('base64url');
}

export function juryCookie(token: string, maxAge = sessionSeconds) {
  return `${cookieName}=${token}; Path=/api/jury; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

export async function juryLogin(input: JuryInput) {
  if (!input || typeof input !== 'object') throw new JuryError('Invalid credentials.', 400);
  const username = field(input.username, 120).toLowerCase();
  const password = field(input.password, 140);
  const state = await readControl();
  const juror = state.jurors.find((j) => j.username === username);
  if (!juror?.passwordHash || !verifyPassword(password, juror.passwordHash)) {
    throw new JuryError('Username or password is wrong. Check the credentials from the organisers.', 401);
  }
  const expires = Date.now() + sessionSeconds * 1_000;
  return `${juror.id}.${expires}.${sign(juror, expires)}`;
}

function requireJuror(req: Request, state: Control) {
  const cookie = req.headers.get('cookie')?.split(';').map((s) => s.trim()).find((s) => s.startsWith(cookieName + '='));
  const [id, expiration, signature, extra] = cookie?.slice(cookieName.length + 1).split('.') ?? [];
  const expires = Number(expiration);
  const juror = state.jurors.find((j) => j.id === id);
  if (extra || !juror?.passwordHash || !signature || !Number.isSafeInteger(expires) || expires <= Date.now()
    || !safeEqual(signature, sign(juror, expires))) throw new JuryError('Sign in to the jury portal.', 401);
  return juror;
}

export async function getJuryState(req: Request, admin: boolean) {
  const state = await readControl();
  const viewer = admin ? 'admin' : requireJuror(req, state);
  return snapshot(state, await getTeams(), viewer);
}

function field(value: unknown, max: number) {
  if (typeof value !== 'string' || value.length > max) throw new JuryError('Invalid text field.');
  return value.trim();
}

function asPanel(value: unknown): PanelId {
  if (value !== 1 && value !== 2) throw new JuryError('Choose Panel 1 or Panel 2.');
  return value;
}

function issue(juror: StoredJuror): IssuedCredential {
  const password = randomBytes(18).toString('base64url');
  juror.passwordHash = hashPassword(password);
  return { ...publicJuror(juror), password };
}

function assign(teams: Team[]): Control['order'] {
  const ids = teams.map((team) => team.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const middle = Math.ceil(ids.length / 2);
  return { 1: ids.slice(0, middle), 2: ids.slice(middle) };
}

function addJuror(state: Control, input: JuryInput) {
  const name = field(input.name, 120);
  const email = field(input.email, 254);
  const designation = field(input.designation, 160);
  const panel = asPanel(input.panel);
  if (!name || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new JuryError('Enter a judge name and a valid email if supplied.');
  const juror: StoredJuror = {
    id: randomUUID(), username: makeUsername(name, state.jurors.map((j) => j.username)),
    name, email, designation, panel, passwordHash: null,
  };
  state.jurors.push(juror);
  return issue(juror);
}

function hasStarted(state: Control) {
  return Boolean(state.started) || Object.values(state.evals).some((evaluations) => Object.keys(evaluations).length > 0)
    || panels.some((panel) => state.session[panel].running || state.session[panel].accumulated > 0);
}

function updateRoster(state: Control, input: JuryInput) {
  const juror = state.jurors.find((j) => j.id === input.id);
  if (!juror) throw new JuryError('This judge is no longer on the roster.', 404);
  if (input.action === 'resetPassword') return issue(juror);
  if (hasStarted(state)) throw new JuryError('The jury roster can’t change after judging starts.', 409);
  if (input.action === 'removeJuror') state.jurors = state.jurors.filter((j) => j.id !== juror.id);
  else juror.panel = asPanel(input.panel);
}

function updateTimer(state: Control, input: JuryInput) {
  const panel = asPanel(input.panel);
  const current = state.session[panel];
  const now = Date.now();
  switch (input.action) {
    case 'selectTeam': {
      const teamId = field(input.teamId, 80);
      if (!state.order[panel].includes(teamId)) throw new JuryError('This team is outside this panel.');
      if (current.running && elapsedOf(current, now) < SLOT_TOTAL) throw new JuryError('Pause the timer before picking a different team.', 409);
      state.session[panel] = { ...emptySession(), teamId };
      break;
    }
    case 'start':
      if (!current.teamId) throw new JuryError('Choose a team first.');
      if (elapsedOf(current, now) >= SLOT_TOTAL) throw new JuryError('Reset the timer before restarting.', 409);
      if (!state.jurors.some((juror) => juror.panel === panel && juror.passwordHash)) {
        throw new JuryError('Issue a login to at least one judge in this panel before starting.');
      }
      if (!current.running) {
        state.started = true;
        state.session[panel] = { ...current, running: true, startedAt: now };
      }
      break;
    case 'pause':
      if (current.running) state.session[panel] = { ...current, running: false, startedAt: null, accumulated: elapsedOf(current, now) };
      break;
    case 'resetTimer':
      state.session[panel] = { ...emptySession(), teamId: current.teamId };
      break;
    case 'next': {
      const index = current.teamId ? state.order[panel].indexOf(current.teamId) : -1;
      state.session[panel] = { ...emptySession(), teamId: state.order[panel][index + 1] ?? null };
      break;
    }
    default: throw new JuryError('Unknown jury action.');
  }
}

function adminUpdate(state: Control, teams: Team[], input: JuryInput) {
  switch (input.action) {
    case 'addJuror':
      if (hasStarted(state)) throw new JuryError('The jury roster can’t change after judging starts.', 409);
      return addJuror(state, input);
    case 'removeJuror':
    case 'resetPassword':
    case 'setJurorPanel':
      return updateRoster(state, input);
    case 'randomAssign':
    case 'clearAssignments':
    case 'moveTeam': {
      if (state.finalsLocked || hasStarted(state)) throw new JuryError('Team assignments can’t change after judging starts.', 409);
      if (input.action === 'moveTeam') {
        const panel = asPanel(input.panel);
        const from = panel === 1 ? 2 : 1;
        const teamId = field(input.teamId, 80);
        if (!state.order[from].includes(teamId)) throw new JuryError('This team is not assigned to the other panel.', 409);
        state.order[from] = state.order[from].filter((id) => id !== teamId);
        state.order[panel].push(teamId);
      } else {
        if (input.action === 'randomAssign' && !teams.length) throw new JuryError('There are no Expo teams to assign.');
        state.order = input.action === 'randomAssign' ? assign(teams) : { 1: [], 2: [] };
      }
      state.session = { 1: emptySession(), 2: emptySession() };
      break;
    }
    case 'toggleFinalist': {
      if (state.finalsLocked) throw new JuryError('Unlock the finalists before changing the shortlist.', 409);
      const teamId = field(input.teamId, 80);
      const panel = panels.find((p) => state.order[p].includes(teamId));
      const judges = state.jurors.filter((j) => j.panel === panel);
      if (!judges.length || judges.some((j) => !state.evals[teamId]?.[j.id])) throw new JuryError('Wait for all panel scores before shortlisting this team.', 409);
      state.finalists = state.finalists.includes(teamId)
        ? state.finalists.filter((id) => id !== teamId)
        : [...state.finalists, teamId];
      break;
    }
    case 'setFinalsLocked':
      if (typeof input.locked !== 'boolean' || (input.locked && !state.finalists.length)) throw new JuryError('Select at least one finalist.');
      if (input.locked && teams.some((team) => {
        const panel = panels.find((p) => state.order[p].includes(team.id));
        const judges = state.jurors.filter((judge) => judge.panel === panel);
        return !judges.length || judges.some((judge) => !state.evals[team.id]?.[judge.id]);
      })) throw new JuryError('Assign all Expo teams and wait for every panel score before confirming finalists.', 409);
      state.finalsLocked = input.locked;
      break;
    default:
      updateTimer(state, input);
  }
}

function submitEvaluation(state: Control, juror: StoredJuror, input: JuryInput) {
  if (input.action !== 'submitEval') throw new JuryError('This action is only available to organisers.', 403);
  if (state.finalsLocked) throw new JuryError('Judging is closed. Contact the organisers if a score needs correcting.', 409);
  const teamId = field(input.teamId, 80);
  if (!state.order[juror.panel].includes(teamId)) throw new JuryError('This team is outside your panel.', 403);
  const submitted = input.scores as Partial<Scores> | null | undefined;
  const scores = {} as Scores;
  for (const { id } of CRITERIA) {
    const value = submitted?.[id];
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > MAX_PER_CRITERION) {
      throw new JuryError('Give each criterion a score from 1 to 10.');
    }
    scores[id] = value;
  }
  const comment = field(input.comment, 1000);
  state.evals[teamId] = { ...state.evals[teamId], [juror.id]: { scores, comment, at: Date.now() } };
}

export async function updateJuryState(req: Request, input: JuryInput, admin: boolean) {
  if (!input || typeof input.action !== 'string') throw new JuryError('Choose a jury action.');
  const db = await getDb();
  const teams = await getTeams();
  return db.transaction(async (tx) => {
    await tx.insert(juryControl).values({ id: 1, state: blankControl() }).onConflictDoNothing();
    const [row] = await tx.select().from(juryControl).where(eq(juryControl.id, 1)).for('update');
    const state = row.state as Control;
    activeTeams(state, teams);
    let credential: IssuedCredential | undefined;
    const viewer = admin ? 'admin' : requireJuror(req, state);
    if (viewer === 'admin') credential = adminUpdate(state, teams, input);
    else submitEvaluation(state, viewer, input);
    await tx.update(juryControl).set({ state }).where(eq(juryControl.id, 1));
    return { state: snapshot(state, teams, viewer), credential };
  });
}
