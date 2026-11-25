import { createHmac, randomBytes, randomInt, randomUUID } from 'node:crypto';
import { and, asc, eq, ne } from 'drizzle-orm';
import { getDb } from '@/db';
import { collegeRegistrations, expoProjects, expoTeamMembers, juryControl, participants } from '@/db/schema';
import { hashPassword, safeEqual, verifyPassword } from './admin-auth';
import { readAbstractPdf } from './storage';
import {
  CRITERIA, MAX_PER_CRITERION, SLOT_TOTAL, elapsedOf, emptyProgress, emptySession, makeUsername,
  type IssuedCredential, type IssuedVolunteerCredential, type Juror, type Volunteer, type JuryProgress,
  type JuryState, type PanelId, type Scores, type Team,
} from '@/components/phase2/jury-types';

type StoredJuror = Juror & { passwordHash: string | null };
type StoredVolunteer = Volunteer & { passwordHash: string | null };
type Control = JuryProgress & {
  jurors: StoredJuror[];
  volunteers?: StoredVolunteer[];
  started?: boolean;
};
export type JuryInput = Record<string, unknown>;

const panels = [1, 2] as const;
const blankControl = (): Control => ({
  ...emptyProgress(),
  jurors: ([
    ['krishnaraj', 'Dr. Krishnaraj Chadaga', 1],
    ['vineetha', 'Dr. Vineetha Pais', 1],
    ['chanchal', 'Dr. Chanchal Antony', 2],
    ['sujay', 'Mr. Sujay Kumar', 2],
    ['ramya', 'Dr. Ramya D. Shetty', 2],
  ] as const).map(([username, name, panel]) => ({
    id: username, username, name, panel, designation: `Jury · Panel ${panel}`, email: '', passwordHash: null,
  })),
  volunteers: [],
});

export class JuryError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

function publicJuror({ id, name, designation, email, panel, username }: StoredJuror): Juror {
  return { id, name, designation, email, panel, username };
}

function publicVolunteer({ id, name, username, panel }: StoredVolunteer): Volunteer {
  return { id, name, username, panel };
}

async function getTeams(): Promise<Team[]> {
  const db = await getDb();
  const rows = await db.select({
    id: expoProjects.id, code: collegeRegistrations.registrationCode, title: expoProjects.projectTitle,
    name: expoProjects.teamName, category: expoProjects.category, college: collegeRegistrations.collegeName,
    description: expoProjects.description,
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
  const state = (row?.state as Control | undefined) ?? blankControl();
  if (!state.volunteers) state.volunteers = [];
  return state;
}

type Viewer = StoredJuror | StoredVolunteer | 'admin';

function snapshot(state: Control, teams: Team[], viewer: Viewer): JuryState {
  activeTeams(state, teams);
  if (viewer === 'admin') {
    const { jurors, volunteers = [], ...progress } = state;
    return {
      ...progress,
      jurors: jurors.map(publicJuror),
      volunteers: volunteers.map(publicVolunteer),
      teams,
      me: null,
      volunteerMe: null,
    };
  }

  // Check if viewer is a volunteer
  if ('username' in viewer && !('designation' in viewer)) {
    const volunteer = viewer as StoredVolunteer;
    const { panel } = volunteer;
    const mine = new Set(state.order[panel]);
    const summary = emptyProgress();
    summary.order[panel] = state.order[panel];
    summary.session[panel] = state.session[panel];
    summary.evals = state.evals; // volunteers can see evaluation progress counters
    return {
      ...summary,
      jurors: [],
      volunteers: [],
      me: null,
      volunteerMe: publicVolunteer(volunteer),
      teams: teams.filter((team) => mine.has(team.id)),
    };
  }

  // Viewer is a juror
  const juror = viewer as StoredJuror;
  const { id, panel } = juror;
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
    jurors: [],
    volunteers: [],
    me: { ...publicJuror(juror), email: '' },
    volunteerMe: null,
    teams: teams.filter((team) => mine.has(team.id)),
  };
}

const sessionSeconds = 12 * 60 * 60;
const jurorCookieName = 'nexus_jury';
const volunteerCookieName = 'nexus_volunteer';

function sign(juror: StoredJuror, expires: number) {
  const secret = process.env.NEXUS_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new JuryError('Jury authentication is not configured.', 503);
  return createHmac('sha256', secret).update(JSON.stringify(['jury', juror.id, expires, juror.passwordHash])).digest('base64url');
}

function signVolunteer(volunteer: StoredVolunteer, expires: number) {
  const secret = process.env.NEXUS_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new JuryError('Volunteer authentication is not configured.', 503);
  return createHmac('sha256', secret).update(JSON.stringify(['volunteer', volunteer.id, expires, volunteer.passwordHash])).digest('base64url');
}

export function juryCookie(token: string, maxAge = sessionSeconds) {
  return `${jurorCookieName}=${token}; Path=/api/jury; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

export function volunteerCookie(token: string, maxAge = sessionSeconds) {
  return `${volunteerCookieName}=${token}; Path=/api/jury; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

export async function juryLogin(input: JuryInput) {
  if (!input || typeof input !== 'object') throw new JuryError('Invalid credentials.', 400);
  const username = field(input.username, 120).toLowerCase();
  const password = rawSecret(input.password);
  const state = await readControl();
  const juror = state.jurors.find((j) => j.username === username);
  if (!juror?.passwordHash || !verifyPassword(password, juror.passwordHash)) {
    throw new JuryError('Username or password is wrong. Check the credentials from the organisers.', 401);
  }
  const expires = Date.now() + sessionSeconds * 1_000;
  return `${juror.id}.${expires}.${sign(juror, expires)}`;
}

export async function volunteerLogin(input: JuryInput) {
  if (!input || typeof input !== 'object') throw new JuryError('Invalid volunteer credentials.', 400);
  const username = field(input.username, 120).toLowerCase();
  const password = rawSecret(input.password);
  const state = await readControl();
  const volunteer = (state.volunteers ?? []).find((v) => v.username.toLowerCase() === username);
  if (!volunteer?.passwordHash || !verifyPassword(password, volunteer.passwordHash)) {
    throw new JuryError('Username or password is wrong. Check the credentials from the organisers.', 401);
  }
  const expires = Date.now() + sessionSeconds * 1_000;
  return `${volunteer.id}.${expires}.${signVolunteer(volunteer, expires)}`;
}

function requireJuror(req: Request, state: Control): StoredJuror {
  const cookie = req.headers.get('cookie')?.split(';').map((s) => s.trim()).find((s) => s.startsWith(jurorCookieName + '='));
  const [id, expiration, signature, extra] = cookie?.slice(jurorCookieName.length + 1).split('.') ?? [];
  const expires = Number(expiration);
  const juror = state.jurors.find((j) => j.id === id);
  if (extra || !juror?.passwordHash || !signature || !Number.isSafeInteger(expires) || expires <= Date.now()
    || !safeEqual(signature, sign(juror, expires))) throw new JuryError('Sign in to the jury portal.', 401);
  return juror;
}

function requireVolunteer(req: Request, state: Control): StoredVolunteer {
  const cookie = req.headers.get('cookie')?.split(';').map((s) => s.trim()).find((s) => s.startsWith(volunteerCookieName + '='));
  const [id, expiration, signature, extra] = cookie?.slice(volunteerCookieName.length + 1).split('.') ?? [];
  const expires = Number(expiration);
  const volunteer = (state.volunteers ?? []).find((v) => v.id === id);
  if (extra || !volunteer?.passwordHash || !signature || !Number.isSafeInteger(expires) || expires <= Date.now()
    || !safeEqual(signature, signVolunteer(volunteer, expires))) throw new JuryError('Sign in to the volunteer timer portal.', 401);
  return volunteer;
}

export async function getJurorAbstract(req: Request, teamId: string) {
  const state = await readControl();
  const juror = requireJuror(req, state);
  if (!state.order[juror.panel].includes(teamId)) throw new JuryError('Abstract not found in your panel.', 404);

  const db = await getDb();
  const [file] = await db.select({
    provider: expoProjects.abstractStorageProvider,
    key: expoProjects.abstractStorageKey,
  }).from(expoProjects)
    .innerJoin(collegeRegistrations, eq(expoProjects.registrationId, collegeRegistrations.id))
    .where(and(eq(expoProjects.id, teamId), ne(collegeRegistrations.registrationStatus, 'cancelled')));
  if (!file) throw new JuryError('Abstract not found in your panel.', 404);
  return readAbstractPdf(file);
}

export async function getJuryState(req: Request, scope: 'admin' | 'portal' | 'volunteer') {
  const state = await readControl();
  let viewer: Viewer;
  if (scope === 'admin') viewer = 'admin';
  else if (scope === 'volunteer') viewer = requireVolunteer(req, state);
  else viewer = requireJuror(req, state);
  return snapshot(state, await getTeams(), viewer);
}

function field(value: unknown, max: number) {
  if (typeof value !== 'string' || value.length > max) throw new JuryError('Invalid text field.');
  return value.trim();
}

/** Organisers may type their own password: used verbatim, with no length or content rules. */
function chosenPassword(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** Passwords are compared exactly as typed, so surrounding spaces are preserved. */
function rawSecret(value: unknown, max = 1000) {
  if (typeof value !== 'string' || value.length > max) throw new JuryError('Invalid password.');
  return value;
}

function asPanel(value: unknown): PanelId {
  if (value !== 1 && value !== 2) throw new JuryError('Choose Panel 1 or Panel 2.');
  return value;
}

function issue(juror: StoredJuror, chosen?: string): IssuedCredential {
  const password = chosen || randomBytes(18).toString('base64url');
  juror.passwordHash = hashPassword(password);
  return { ...publicJuror(juror), password };
}

function issueVolunteer(volunteer: StoredVolunteer, chosen?: string): IssuedVolunteerCredential {
  const password = chosen || randomBytes(12).toString('base64url');
  volunteer.passwordHash = hashPassword(password);
  return { ...publicVolunteer(volunteer), password };
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
  return issue(juror, chosenPassword(input.password));
}

function addVolunteer(state: Control, input: JuryInput): IssuedVolunteerCredential {
  const name = field(input.name, 120);
  const panel = asPanel(input.panel);
  if (!name) throw new JuryError('Enter a volunteer name.');
  state.volunteers ??= [];
  const volunteer: StoredVolunteer = {
    id: randomUUID(),
    username: makeUsername(name, state.volunteers.map((v) => v.username)),
    name,
    panel,
    passwordHash: null,
  };
  state.volunteers.push(volunteer);
  return issueVolunteer(volunteer, chosenPassword(input.password));
}

function updateVolunteerRoster(state: Control, input: JuryInput) {
  state.volunteers ??= [];
  const volunteer = state.volunteers.find((v) => v.id === input.id);
  if (!volunteer) throw new JuryError('This volunteer is no longer on the roster.', 404);
  if (input.action === 'resetVolunteerPassword') return issueVolunteer(volunteer, chosenPassword(input.password));
  if (input.action === 'removeVolunteer') {
    state.volunteers = state.volunteers.filter((v) => v.id !== volunteer.id);
    return;
  }
  if (input.action === 'setVolunteerPanel') {
    volunteer.panel = asPanel(input.panel);
    return;
  }
  throw new JuryError('Unknown volunteer action.');
}

function hasStarted(state: Control) {
  return Boolean(state.started) || Object.values(state.evals).some((evaluations) => Object.keys(evaluations).length > 0)
    || panels.some((panel) => state.session[panel].running || state.session[panel].accumulated > 0);
}

function updateRoster(state: Control, input: JuryInput) {
  const juror = state.jurors.find((j) => j.id === input.id);
  if (!juror) throw new JuryError('This judge is no longer on the roster.', 404);
  if (input.action === 'resetPassword') return issue(juror, chosenPassword(input.password));
  if (hasStarted(state)) throw new JuryError('The jury roster can’t change after judging starts.', 409);
  if (input.action === 'removeJuror') state.jurors = state.jurors.filter((j) => j.id !== juror.id);
  else juror.panel = asPanel(input.panel);
}

function updateTimer(state: Control, input: JuryInput, actor?: { volunteer?: StoredVolunteer }) {
  const panel = asPanel(input.panel);
  if (actor?.volunteer && actor.volunteer.panel !== panel) {
    throw new JuryError(`You are assigned to Panel ${actor.volunteer.panel} and cannot control Panel ${panel} timer.`, 403);
  }
  const current = state.session[panel];
  const now = Date.now();
  const volunteerInfo = actor?.volunteer
    ? { volunteerId: actor.volunteer.id, volunteerName: actor.volunteer.name }
    : { volunteerId: current.volunteerId ?? null, volunteerName: current.volunteerName ?? null };

  switch (input.action) {
    case 'selectTeam': {
      const teamId = field(input.teamId, 80);
      if (!state.order[panel].includes(teamId)) throw new JuryError('This team is outside this panel.');
      if (current.running && elapsedOf(current, now) < SLOT_TOTAL) throw new JuryError('Pause the timer before picking a different team.', 409);
      state.session[panel] = { ...emptySession(), teamId, ...volunteerInfo };
      break;
    }
    case 'start':
      if (!current.teamId) throw new JuryError('Choose a team first.');
      if (elapsedOf(current, now) >= SLOT_TOTAL) throw new JuryError('Reset the timer before restarting.', 409);
      if (!current.running) {
        state.started = true;
        state.session[panel] = { ...current, running: true, startedAt: now, ...volunteerInfo };
      }
      break;
    case 'pause':
      if (current.running) {
        state.session[panel] = {
          ...current,
          running: false,
          startedAt: null,
          accumulated: elapsedOf(current, now),
          ...volunteerInfo,
        };
      }
      break;
    case 'resetTimer':
      state.session[panel] = { ...emptySession(), teamId: current.teamId, ...volunteerInfo };
      break;
    case 'clearActiveTeam':
      if (current.teamId !== input.teamId) throw new JuryError('The active team changed. Check the timer and try again.', 409);
      state.session[panel] = { ...emptySession(), ...volunteerInfo };
      break;
    case 'next': {
      const index = current.teamId ? state.order[panel].indexOf(current.teamId) : -1;
      state.session[panel] = { ...emptySession(), teamId: state.order[panel][index + 1] ?? null, ...volunteerInfo };
      break;
    }
    default: throw new JuryError('Unknown timer action.');
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
    case 'addVolunteer':
      return addVolunteer(state, input);
    case 'removeVolunteer':
    case 'resetVolunteerPassword':
    case 'setVolunteerPanel':
      return updateVolunteerRoster(state, input);
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
    const raw = submitted?.[id];
    const value = typeof raw === 'number' ? raw : parseFloat(String(raw));
    if (isNaN(value) || value < 0 || value > MAX_PER_CRITERION) {
      throw new JuryError(`Score each criterion between 0 and ${MAX_PER_CRITERION}.`);
    }
    // Allow up to two decimal places
    scores[id] = Math.round(value * 100) / 100;
  }
  const comment = field(input.comment ?? '', 1000);
  state.evals[teamId] = { ...state.evals[teamId], [juror.id]: { scores, comment, at: Date.now() } };
}

export async function updateJuryState(req: Request, input: JuryInput, scope: 'admin' | 'portal' | 'volunteer') {
  if (!input || typeof input.action !== 'string') throw new JuryError('Choose a jury action.');
  const db = await getDb();
  const teams = await getTeams();
  return db.transaction(async (tx) => {
    await tx.insert(juryControl).values({ id: 1, state: blankControl() }).onConflictDoNothing();
    const [row] = await tx.select().from(juryControl).where(eq(juryControl.id, 1)).for('update');
    const state = row.state as Control;
    if (!state.volunteers) state.volunteers = [];
    activeTeams(state, teams);
    let credential: IssuedCredential | IssuedVolunteerCredential | undefined;

    if (scope === 'admin') {
      credential = adminUpdate(state, teams, input);
      await tx.update(juryControl).set({ state }).where(eq(juryControl.id, 1));
      return { state: snapshot(state, teams, 'admin'), credential };
    }

    if (scope === 'volunteer') {
      const volunteer = requireVolunteer(req, state);
      updateTimer(state, input, { volunteer });
      await tx.update(juryControl).set({ state }).where(eq(juryControl.id, 1));
      return { state: snapshot(state, teams, volunteer) };
    }

    // Juror portal
    const juror = requireJuror(req, state);
    submitEvaluation(state, juror, input);
    await tx.update(juryControl).set({ state }).where(eq(juryControl.id, 1));
    return { state: snapshot(state, teams, juror), credential };
  });
}
