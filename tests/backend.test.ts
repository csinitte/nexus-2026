import { describe, expect, test } from 'bun:test';
import { validateRegistration } from '../src/lib/nexus/validation';
import { hashPassword, verifyPassword, signToken, verifyToken } from '../src/lib/nexus/admin-auth';

const png = () =>
  new File(
    [
      new Uint8Array([
        137, 80, 78, 71, 0, 0, 0, 13, 0, 0, 0, 13, 105, 88, 65, 84, 2, 0, 82, 164, 108, 209, 206, 0, 0, 0, 2, 115, 82, 71,
        66, 124, 237, 202, 87, 0, 0, 0, 4, 103, 65, 77, 65, 0, 0, 177, 173, 177, 144, 160, 0, 0, 0, 9, 112, 72, 89, 115, 0,
        0, 11, 101, 0, 0, 11, 101, 3, 99, 115, 81, 73, 40, 0, 0, 0, 6, 116, 73, 77, 69, 0, 0, 0, 6, 240, 254, 84, 128, 0,
        0, 0, 8, 73, 68, 65, 84, 8, 211, 99, 240, 71, 4, 0, 0, 0, 2, 0, 1, 94, 166, 80, 16, 0, 0, 0, 0, 73, 69, 78, 68,
        174, 66, 96, 130,
      ]),
    ],
    'screenshot.png',
    { type: 'image/png' },
  );
const student = (i: number) => ({
  fullName: `Student ${i}`,
  department: 'CSE',
  year: 2,
  contactNumber: '1234567890',
  email: `student${i}@example.com`,
});
const base = (utrNumber = '123456789012') => ({
  collegeName: 'College',
  collegeCategory: 'active_csi' as const,
  csiChapterName: 'CSI',
  csiChapterId: 'CSI123',
  city: 'Nitte',
  facultyCoordinatorName: 'Faculty',
  facultyCoordinatorEmail: 'faculty@example.com',
  facultyCoordinatorContact: '1234567890',
  facultyAccompanying: false,
  totalRepresentatives: 2,
  students: [student(1), student(2)],
  chapterShowcasePresenter: 'Student 1',
  participatingInExpo: false,
  accommodationRequired: false,
  declarationAccepted: true,
  payment: {
    collegeCategory: 'active_csi' as const,
    utrNumber,
    category: 'Active CSI Branch',
    amount: 250,
    paymentScreenshot: png(),
  },
});
const pdf = () => new File(['%PDF-1.4 test'], 'abstract.pdf', { type: 'application/pdf' });

describe('registration validation', () => {
  test('counts students independently of an accompanying coordinator', async () => {
    const data = await validateRegistration({
      ...base(),
      facultyAccompanying: true,
      totalRepresentatives: 5,
      students: [1, 2, 3, 4, 5].map(student),
    });
    expect(data.students).toHaveLength(5);
  });

  test('rejects mismatched student counts and duplicate student email', async () => {
    await expect(validateRegistration({ ...base(), totalRepresentatives: 1, students: [student(1)] })).rejects.toThrow('2–5 students');
    await expect(validateRegistration({ ...base(), totalRepresentatives: 6, students: [1, 2, 3, 4, 5, 6].map(student) })).rejects.toThrow('2–5 students');
    await expect(validateRegistration({ ...base(), totalRepresentatives: 3 })).rejects.toThrow('stated number of students');
    await expect(validateRegistration({ ...base(), students: [student(1), student(1)] })).rejects.toThrow();
  });

  test('accepts Expo teams of 2 through 5 students and rejects out-of-range teams', async () => {
    const students = [1, 2, 3, 4, 5].map(student);
    const common = {
      teamName: 'Team One',
      projectTitle: 'Project',
      category: 'Open Innovation',
      description: 'A project',
      abstract: pdf(),
    };
    for (let size = 2; size <= 5; size++) {
      await expect(
        validateRegistration({
          ...base(),
          totalRepresentatives: students.length,
          students,
          participatingInExpo: true,
          expo: { ...common, teamMembers: Array.from({ length: size }, (_, i) => i) },
        }),
      ).resolves.toBeDefined();
    }
    for (const teamMembers of [[0], [0, 1, 2, 3, 4, 5]]) {
      await expect(validateRegistration({
        ...base(),
        totalRepresentatives: students.length,
        students,
        participatingInExpo: true,
        expo: { ...common, teamMembers },
      })).rejects.toThrow('2–5 distinct registered students');
    }
    await expect(
      validateRegistration({
        ...base(),
        participatingInExpo: true,
        expo: { ...common, teamMembers: [0, 1], abstract: new File(['bad'], 'abstract.pdf', { type: 'application/pdf' }) },
      }),
    ).rejects.toThrow();
  });

  test('accommodation is student-only and can cover every student in a registration', async () => {
    const students = [1, 2, 3, 4, 5].map(student);
    const details = {
      facultyAccompanying: true,
      totalRepresentatives: students.length,
      students,
      accommodationRequired: true,
      arrivalPlan: '2026-11-24_NIGHT',
      maleAccommodationCount: 3,
      femaleAccommodationCount: 2,
      accommodationParticipantNames: students.map((s) => s.fullName),
    };
    await expect(validateRegistration({ ...base(), ...details })).resolves.toBeDefined();
    await expect(
      validateRegistration({
        ...base(),
        ...details,
        maleAccommodationCount: 3,
        femaleAccommodationCount: 3,
        accommodationParticipantNames: [...students.map((s) => s.fullName), 'Faculty'],
      }),
    ).rejects.toThrow('Invalid accommodation details');
  });

  test('preserves active and non-CSI registration fees', async () => {
    const active = await validateRegistration(base());
    const nonCsi = await validateRegistration({
      ...base('223456789012'),
      collegeCategory: 'no_active_csi',
      csiChapterName: undefined,
      csiChapterId: undefined,
      facultyCoordinatorName: undefined,
      facultyCoordinatorEmail: undefined,
      facultyCoordinatorContact: undefined,
      payment: {
        collegeCategory: 'no_active_csi',
        utrNumber: '223456789012',
        category: 'No Active CSI Branch',
        amount: 300,
        paymentScreenshot: png(),
      },
    });
    expect(active.payment.amount).toBe(250);
    expect(nonCsi.payment.amount).toBe(300);
    expect(nonCsi.facultyAccompanying).toBe(false);
  });
});

test('password and session signatures', () => {
  const hash = hashPassword('password');
  expect(verifyPassword('password', hash)).toBe(true);
  expect(verifyPassword('wrong', hash)).toBe(false);
  process.env.NEXUS_SESSION_SECRET = 'x'.repeat(32);
  const token = signToken({ id: '1', email: 'a', name: 'a', role: 'admin', exp: Date.now() + 10000 });
  expect(verifyToken(token)?.id).toBe('1');
  expect(verifyToken(token + 'x')).toBeNull();
});

test('allows multiple registrations from the same college and coordinator', async () => {
  process.env.NEXUS_DB_DRIVER = 'pglite';
  process.env.BREVO_SMTP_HOST = '';
  const { createRegistration, registrationDetail } = await import('../src/lib/nexus/registration-service');
  const firstInput = await validateRegistration({
    ...base(),
    facultyAccompanying: true,
    totalRepresentatives: 5,
    students: [1, 2, 3, 4, 5].map(student),
  });
  const first = await createRegistration(firstInput);
  expect(first.registrationCode).toMatch(/^NEXUS26-\d{4}$/);
  const firstDetail = await registrationDetail(first.summary.id);
  expect(firstDetail?.participants.filter((p) => p.participantType === 'student')).toHaveLength(5);
  expect(firstDetail?.participants.filter((p) => p.participantType === 'faculty_coordinator')).toHaveLength(1);
  const second = await createRegistration(await validateRegistration(base('123456789013')));
  expect(second.summary.collegeName).toBe(first.summary.collegeName);
  expect(second.summary.facultyCoordinatorEmail).toBe(first.summary.facultyCoordinatorEmail);
  await expect(createRegistration(firstInput)).rejects.toThrow();
}, 30_000);

test('admin login, overview, search, verification and export', async () => {
  process.env.NEXUS_DB_DRIVER = 'pglite';
  process.env.BREVO_SMTP_HOST = '';
  const { createRegistration } = await import('../src/lib/nexus/registration-service');
  await createRegistration(await validateRegistration({ ...base('323456789012'), collegeName: 'Admin College' }));
  process.env.NEXUS_ADMIN_EMAIL = 'admin@example.com';
  process.env.NEXUS_ADMIN_PASSWORD = 'correct-password';
  process.env.NEXUS_SESSION_SECRET = 'x'.repeat(32);
  const route = await import('../src/app/api/admin/[...path]/route');
  const context = (...path: string[]) => ({ params: Promise.resolve({ path }) });
  const login = await route.POST(
    new Request('http://localhost/api/admin/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'correct-password' }),
    }),
    context('auth', 'login'),
  );
  expect(login.status).toBe(200);
  const { token } = await login.json();
  const headers = { authorization: `Bearer ${token}` };
  const overview = await route.GET(new Request('http://localhost/api/admin/overview', { headers }), context('overview'));
  expect((await overview.json()).totalCollegeRegistrations).toBeGreaterThanOrEqual(1);
  const search = await route.GET(new Request('http://localhost/api/admin/registrations?q=Admin%20College', { headers }), context('registrations'));
  const rows = await search.json();
  expect(rows).toHaveLength(1);
  const patch = await route.PATCH(
    new Request(`http://localhost/api/admin/registrations/${rows[0].id}`, {
      method: 'PATCH',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ registrationStatus: 'verified' }),
    }),
    context('registrations', rows[0].id),
  );
  expect((await patch.json()).registrationStatus).toBe('verified');
  const exported = await route.GET(new Request('http://localhost/api/admin/registrations/export', { headers }), context('registrations', 'export'));
  expect(await exported.text()).toContain('Admin College');
  const reps = await route.GET(new Request('http://localhost/api/admin/representatives', { headers }), context('representatives'));
  expect((await reps.json()).filter((row: { college: string }) => row.college === 'Admin College')).toHaveLength(2);
  const showcase = await route.GET(new Request('http://localhost/api/admin/showcase/export', { headers }), context('showcase', 'export'));
  expect(await showcase.text()).toContain('Admin College');
  expect((await route.GET(new Request('http://localhost/api/admin/representatives'), context('representatives'))).status).toBe(401);
  expect((await route.GET(new Request('http://localhost/api/admin/overview'), context('overview'))).status).toBe(401);
});

test('Expo review, private abstract and student-only accommodation edit', async () => {
  process.env.BREVO_SMTP_HOST = '';
  const { createRegistration } = await import('../src/lib/nexus/registration-service');
  const route = await import('../src/app/api/admin/[...path]/route');
  const { deleteAbstractPdf } = await import('../src/lib/nexus/storage');
  const context = (...path: string[]) => ({ params: Promise.resolve({ path }) });
  const token = signToken({ id: 'bootstrap', email: 'admin@example.com', name: 'Admin', role: 'admin', exp: Date.now() + 10000 });
  const headers = { authorization: `Bearer ${token}` };
  const before = await route.GET(new Request('http://localhost/api/admin/overview', { headers }), context('overview'));
  const studentsBefore = (await before.json()).totalStudentRepresentatives;
  const input = await validateRegistration({
    ...base('123456789014'),
    collegeName: 'Expo College',
    facultyAccompanying: true,
    participatingInExpo: true,
    expo: {
      teamName: 'Clean Team',
      projectTitle: 'Cleaner Future',
      category: 'Open Innovation',
      teamMembers: [0, 1],
      abstract: pdf(),
    },
  });
  const created = await createRegistration(input);
  const after = await route.GET(new Request('http://localhost/api/admin/overview', { headers }), context('overview'));
  expect((await after.json()).totalStudentRepresentatives - studentsBefore).toBe(2);
  const list = await route.GET(new Request('http://localhost/api/admin/expo', { headers }), context('expo'));
  const projects = await list.json();
  const project = projects.find((p: { projectTitle: string }) => p.projectTitle === 'Cleaner Future');
  expect(project).toBeDefined();
  expect(project.teamName).toBe('Clean Team');
  expect(project.description).toBe('');
  expect(created.expo?.teamName).toBe('Clean Team');
  expect((await route.GET(new Request(`http://localhost/api/admin/expo/${project.id}/abstract`), context('expo', project.id, 'abstract'))).status).toBe(401);
  const download = await route.GET(new Request(`http://localhost/api/admin/expo/${project.id}/abstract`, { headers }), context('expo', project.id, 'abstract'));
  expect(await download.text()).toBe('%PDF-1.4 test');
  const review = await route.PATCH(
    new Request(`http://localhost/api/admin/expo/${project.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ reviewStatus: 'Reviewed', internalRemarks: 'Relevant' }),
    }),
    context('expo', project.id),
  );
  expect((await review.json()).internalRemarks).toBe('Relevant');
  const edit = await route.PATCH(
    new Request(`http://localhost/api/admin/registrations/${created.summary.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({
        accommodationRequired: true,
        arrivalPlan: '2026-11-24_NIGHT',
        maleAccommodationCount: 1,
        femaleAccommodationCount: 0,
        accommodationParticipantNames: ['Student 1'],
      }),
    }),
    context('registrations', created.summary.id),
  );
  expect(edit.status).toBe(200);
  const invalidFaculty = await route.PATCH(
    new Request(`http://localhost/api/admin/registrations/${created.summary.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({
        maleAccommodationCount: 1,
        femaleAccommodationCount: 1,
        accommodationParticipantNames: ['Student 1', 'Faculty'],
      }),
    }),
    context('registrations', created.summary.id),
  );
  expect(invalidFaculty.status).toBe(400);
  const tooMany = await route.PATCH(
    new Request(`http://localhost/api/admin/registrations/${created.summary.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({
        maleAccommodationCount: 3,
        femaleAccommodationCount: 0,
        accommodationParticipantNames: ['Student 1', 'Student 2', 'Student 1'],
      }),
    }),
    context('registrations', created.summary.id),
  );
  expect(tooMany.status).toBe(400);
  await deleteAbstractPdf({ provider: project.abstractStorageProvider, key: project.abstractStorageKey });
});

test('confirmation tokens are scoped and expire securely', async () => {
  const { createConfirmationToken, verifyConfirmationToken } = await import('../src/lib/nexus/confirmation-token');
  const token = createConfirmationToken('NEXUS26-1234')!;
  expect(verifyConfirmationToken(token, 'NEXUS26-1234')).toBe(true);
  expect(verifyConfirmationToken(token, 'NEXUS26-9999')).toBe(false);
  expect(verifyConfirmationToken(token + 'x', 'NEXUS26-1234')).toBe(false);
});

test('jury credentials, panel isolation, shared timer and final scoring', async () => {
  const { GET, POST } = await import('../src/app/api/jury/[scope]/route');
  const { createRegistration } = await import('../src/lib/nexus/registration-service');
  const { phaseOf } = await import('../src/components/phase2/juryTimer');
  const { elapsedOf } = await import('../src/components/phase2/jury-types');
  for (const [i, cancelled] of [[1, false], [2, false], [3, true]] as const) {
    const created = await createRegistration(await validateRegistration({
      ...base(`12345678988${i}`), collegeName: `Jury Test College ${i}`, participatingInExpo: true,
      expo: { teamName: `Jury Team ${i}`, projectTitle: `Jury Project ${i}`, description: 'Submitted project description', category: 'Open Innovation', teamMembers: [0, 1], abstract: pdf() },
    }));
    if (cancelled) {
      const { getDb } = await import('../src/db');
      const { collegeRegistrations } = await import('../src/db/schema');
      const { eq } = await import('drizzle-orm');
      await (await getDb()).update(collegeRegistrations).set({ registrationStatus: 'cancelled' }).where(eq(collegeRegistrations.id, created.summary.id));
    }
  }
  process.env.NEXUS_SESSION_SECRET = 'test-secret-for-admin-and-jury-session';
  process.env.NEXUS_ADMIN_EMAIL = 'jury-admin@example.com';
  process.env.NEXUS_ADMIN_PASSWORD = 'test-only-admin-password';
  const admin = signToken({ id: 'bootstrap', email: process.env.NEXUS_ADMIN_EMAIL, name: 'Admin', role: 'admin', exp: Date.now() + 60_000 });
  const api = (scope: string, headers: Record<string, string> = {}, body?: object) => {
    const req = new Request(`http://localhost/api/jury/${scope}`, {
      headers: { 'Content-Type': 'application/json', ...headers },
      ...(body && { method: 'POST', body: JSON.stringify(body) }),
    });
    return (body ? POST : GET)(req, { params: Promise.resolve({ scope: scope.split('?')[0] }) });
  };
  const adminHeaders = { Authorization: `Bearer ${admin}` };
  const adminAction = async (action: string, fields: object = {}) => {
    const response = await api('admin', adminHeaders, { action, ...fields });
    const body = await response.json();
    expect(response.status, JSON.stringify(body)).toBe(200);
    return body;
  };
  expect((await api('admin')).status).toBe(401);
  expect((await api('portal')).status).toBe(401);
  expect((await api('admin', { ...adminHeaders, 'Sec-Fetch-Site':'cross-site' }, { action:'clearAssignments' })).status).toBe(403);

  const live = await (await api('admin', adminHeaders)).json();
  const roster = live.jurors as { id: string; name: string; panel: number }[];
  expect(roster.map(({ id, name, panel }) => [id, name, panel])).toEqual([
    ['krishnaraj', 'Dr. Krishnaraj Chadaga', 1],
    ['vineetha', 'Dr. Vineetha Pais', 1],
    ['chanchal', 'Dr. Chanchal Antony', 2],
    ['sujay', 'Mr. Sujay Kumar', 2],
    ['ramya', 'Dr. Ramya D. Shetty', 2],
  ]);
  expect(live.teams.some((team: { title: string }) => team.title === 'Jury Project 3')).toBe(false);
  expect(JSON.stringify(live)).not.toContain('passwordHash');
  const { credential: other } = await adminAction('addJuror', { panel: 2, name: 'Panel Two Judge', designation: '', email: '' });
  const credentials = [other];
  for (const { id } of roster) credentials.push((await adminAction('resetPassword', { id })).credential);
  const login = async ({ username, password }: typeof other) => {
    const response = await api('login', {}, { username, password });
    expect(response.status).toBe(200);
    return { Cookie: response.headers.get('set-cookie')!.split(';')[0] };
  };
  const cookies = await Promise.all(credentials.map(login));
  expect((await api('admin', cookies[0])).status).toBe(401);
  const { state } = await adminAction('randomAssign');
  expect(Math.abs(state.order[1].length - state.order[2].length)).toBeLessThanOrEqual(1);
  expect(new Set([...state.order[1], ...state.order[2]]).size).toBe(state.teams.length);

  const team = state.order[1][0];
  const project = state.teams.find((entry: { title: string }) => entry.title === 'Jury Project 1');
  const panel = state.order[1].includes(project.id) ? 1 : 2;
  const assignedJudge = cookies[credentials.findIndex((judge) => judge.panel === panel)];
  const otherJudge = cookies[credentials.findIndex((judge) => judge.panel !== panel)];
  const abstractPath = `abstract?team=${project.id}`;
  expect((await api(abstractPath)).status).toBe(401);
  expect((await api(abstractPath, otherJudge)).status).toBe(404);
  const abstract = await api(abstractPath, assignedJudge);
  expect(abstract.status).toBe(200);
  expect(abstract.headers.get('content-type')).toBe('application/pdf');
  expect(abstract.headers.get('cache-control')).toBe('private, no-store');
  const abstractView = await (await api('portal', assignedJudge)).json();
  expect(abstractView.teams.find((entry: { id: string }) => entry.id === project.id).description).toBe('Submitted project description');
  await adminAction('selectTeam', { panel: 1, teamId: team });
  const { state: started } = await adminAction('start', { panel: 1 });
  const judgeView = await (await api('portal', cookies[1])).json();
  expect(judgeView.session[1]).toEqual(started.session[1]);
  expect(judgeView.order[2]).toEqual([]);
  expect(judgeView.jurors).toEqual([]);
  const timer = judgeView.session[1];
  expect(phaseOf(timer, elapsedOf(timer, timer.startedAt + 300_000))).toBe('qa');
  expect(phaseOf(timer, elapsedOf(timer, timer.startedAt + 600_000))).toBe('over');
  const scores = { problem_relevance: 7, innovation: 8, technical_depth: 6, functionality: 8, feasibility: 7, presentation: 9, scalability_impact: 7 };
  expect((await api('portal', cookies[0], { action:'submitEval', teamId:team, scores, comment:'' })).status).toBe(403);
  expect((await api('portal', cookies[1], { action:'submitEval', teamId:team, scores:{ ...scores, functionality:11 }, comment:'' })).status).toBe(400);
  expect((await api('admin', adminHeaders, { action:'randomAssign' })).status).toBe(409);

  const votes = await Promise.all(credentials.flatMap((judge, index) =>
    state.order[judge.panel].map((teamId: string) => api('portal', cookies[index], { action:'submitEval', teamId, scores, comment:'Judge notes' }))));
  expect(votes.every((vote) => vote.status === 200)).toBe(true);
  const all = await (await api('admin', adminHeaders)).json();
  expect(Object.keys(all.evals[team]).sort()).toEqual(['krishnaraj', 'vineetha']);
  expect(all.evals[team].krishnaraj.comment).toBe('Judge notes');
  const privateView = await (await api('portal', cookies[1])).json();
  expect(Object.keys(privateView.evals[team])).toEqual(['krishnaraj']);
  await adminAction('toggleFinalist', { teamId: team });
  expect((await adminAction('setFinalsLocked', { locked: true })).state.finalists).toEqual([team]);
  expect((await api('portal', cookies[1], { action:'submitEval', teamId:team, scores, comment:'' })).status).toBe(409);
  const { credential: rotated } = await adminAction('resetPassword', { id: 'krishnaraj' });
  expect((await api('portal', cookies[1])).status).toBe(401);
  expect((await api('portal', await login(rotated))).status).toBe(200);
}, 30_000);
