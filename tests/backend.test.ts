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
