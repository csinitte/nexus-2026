import { describe, expect, test } from 'bun:test';
import {
  STEPS,
  blankStudent,
  buildPayload,
  firstInvalidStep,
  initialState,
  isPhone,
  stepForServerError,
  studentCount,
  syncDelegation,
  validateAbstract,
  validateStep,
  type FormState,
} from '../src/components/register/model';
import { validateRegistration } from '../src/lib/nexus/validation';

const step = (id: (typeof STEPS)[number]['id']) => STEPS.findIndex((s) => s.id === id);
const pdf = () => new File(['%PDF-1.4\n%%EOF'], 'abstract.pdf', { type: 'application/pdf' });
const png = () => new File([new Uint8Array([137,80,78,71,0,0,0,13,0,0,0,13,105,84,88,65,2,0,82,164,108,209,206,0,0,0,2,115,82,71,66,124,237,202,87,0,0,0,4,103,65,77,65,0,0,177,173,177,144,160,0,0,0,9,112,72,89,115,0,0,11,101,0,0,11,101,3,99,115,81,73,40,0,0,0,6,116,73,77,69,0,0,0,6,240,254,84,128,0,0,0,8,73,68,65,84,8,211,99,240,71,4,0,0,0,2,0,1,94,166,80,16,0,0,0,0,73,69,78,68,174,66,96,130])], 'screenshot.png', { type: 'image/png' });

function completeState(overrides: Partial<FormState> = {}): FormState {
  return syncDelegation({
    ...initialState,
    collegeName: 'Test College',
    collegeCategory: 'active_csi',
    csiChapterName: 'CSI Test',
    csiChapterId: 'CSI123',
    city: 'Udupi',
    facultyCoordinatorName: 'Dr. Rao',
    facultyCoordinatorEmail: 'rao@college.edu',
    facultyCoordinatorContact: '+91 98765 43210',
    facultyAccompanying: 'yes',
    students: [
      { fullName: 'Asha', department: 'CSE', year: '3', contactNumber: '9876500001', email: 'asha@college.edu' },
      { fullName: 'Bharath', department: 'ECE', year: '2', contactNumber: '9876500002', email: 'bharath@college.edu' },
      { fullName: 'Chitra', department: 'ME', year: '4', contactNumber: '9876500003', email: 'chitra@college.edu' },
    ],
    presenterIndex: 0,
    participatingInExpo: 'yes',
    teamName: 'Grid Pioneers',
    projectTitle: 'Smart Grid',
    category: 'Energy & Resource Management',
    description: 'Leak detection for campus water lines.',
    expoTeamSize: '2',
    teamIndexes: [0, 1],
    accommodationRequired: 'yes',
    arrivalPlan: '2026-11-24_NIGHT',
    maleAccommodationCount: '1',
    femaleAccommodationCount: '1',
    accommodationPeople: ['s0', 's1'],
    utrNumber: '123456789012',
    paymentScreenshot: png(),
    declarationAccepted: true,
    ...overrides,
  });
}

describe('registration student counts', () => {
  test('faculty accompanying does not change the student count', () => {
    const state = completeState({
      students: [...completeState().students, blankStudent(), blankStudent(), blankStudent()],
      facultyAccompanying: 'yes',
    });
    expect(studentCount(state)).toBe(6);
    state.facultyAccompanying = 'no';
    expect(studentCount(state)).toBe(6);
  });

  test('shrinking the delegation drops selections for removed students', () => {
    const expanded = completeState({
      students: [...completeState().students, blankStudent(), blankStudent()],
      presenterIndex: 4,
      teamIndexes: [1, 4],
      accommodationPeople: ['s0', 's4'],
    });
    const shrunk = syncDelegation({ ...expanded, students: expanded.students.slice(0, 4) });
    expect(shrunk.students).toHaveLength(4);
    expect(shrunk.presenterIndex).toBeNull();
    expect(shrunk.teamIndexes).toEqual([1]);
  });

  test('faculty is never included in accommodation selections', () => {
    const next = syncDelegation({ ...completeState(), facultyAccompanying: 'no' });
    expect(next.accommodationPeople).toEqual(['s0', 's1']);
    expect(next.students).toHaveLength(3);
  });

  test('one student is valid even when faculty accompanies', () => {
    const errors = validateStep(step('delegation'), completeState({ students: completeState().students.slice(0, 1) }), null);
    expect(errors.totalRepresentatives).toBeUndefined();
  });

  test('more than five students are accepted in one registration', () => {
    const state = completeState({ students: [...completeState().students, blankStudent(), blankStudent(), blankStudent()] });
    expect(studentCount(state)).toBe(6);
    expect(state.students).toHaveLength(6);
  });

  test('duplicate student emails and names are flagged', () => {
    const state = completeState();
    state.students[1] = { ...state.students[1], email: 'ASHA@college.edu', fullName: 'asha' };
    const errors = validateStep(step('delegation'), state, null);
    expect(errors['s1-email']).toContain('student 1');
    expect(errors['s1-fullName']).toContain('student 1');
  });
});

describe('step validation', () => {
  test('a complete form has no invalid step', () => {
    expect(firstInvalidStep(completeState(), pdf())).toBeNull();
  });

  test('Expo team accepts 1–5 students and requires an abstract', () => {
    const errors = validateStep(step('expo'), completeState({ expoTeamSize: '1', teamIndexes: [0] }), null);
    expect(errors.teamIndexes).toBeUndefined();
    expect(errors.abstract).toBeDefined();
    expect(
      validateStep(
        step('expo'),
        completeState({
          students: [...completeState().students, blankStudent(), blankStudent()],
          expoTeamSize: '5',
          teamIndexes: [0, 1, 2, 3, 4],
        }),
        pdf(),
      ).teamIndexes,
    ).toBeUndefined();
  });

  test('Expo description can be blank or omitted', async () => {
    const state = completeState({ description: '   ' });
    expect(validateStep(step('expo'), state, pdf()).description).toBeUndefined();
    const payload = buildPayload(state);
    const { description, ...expoWithoutDescription } = payload.expo!;
    expect(description).toBe('');
    const parsed = await validateRegistration({ ...payload, expo: { ...expoWithoutDescription, abstract: pdf() } });
    expect(parsed.expo?.description).toBe('');
  });

  test('Expo team name is required only for participating teams', async () => {
    const withoutName = completeState({ teamName: '   ' });
    expect(validateStep(step('expo'), withoutName, pdf()).teamName).toBeDefined();
    const payload = buildPayload(withoutName);
    await expect(validateRegistration({ ...payload, expo: { ...payload.expo!, abstract: pdf() } })).rejects.toThrow('Expo team name');
    expect(validateStep(step('expo'), completeState({ participatingInExpo: 'no', teamName: '' }), null).teamName).toBeUndefined();
  });

  test('accommodation counts must equal the people selected', () => {
    const errors = validateStep(step('accommodation'), completeState({ maleAccommodationCount: '2' }), pdf());
    expect(errors.accommodationCounts).toContain('must equal');
  });

  test('abstract must be a PDF within 10 MB', () => {
    expect(validateAbstract(new File(['x'], 'a.docx', { type: 'application/msword' }))).toContain('PDF');
    expect(validateAbstract(new File([new Uint8Array(11 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' }))).toContain('10 MB');
    expect(validateAbstract(pdf())).toBeNull();
  });

  test('phone numbers accept Indian formats', () => {
    expect(isPhone('+91 98765 43210')).toBe(true);
    expect(isPhone('9876543210')).toBe(true);
    expect(isPhone('12345')).toBe(false);
    expect(isPhone('call me')).toBe(false);
  });

  test('server messages map to the step that fixes them', () => {
    expect(stepForServerError('collegeName is required')).toBe(step('college'));
    expect(stepForServerError('Valid facultyCoordinatorEmail is required')).toBe(step('faculty'));
    expect(stepForServerError('Expo team must contain 1-5 distinct registered students')).toBe(step('expo'));
    expect(stepForServerError('Showcase presenter must be a registered student')).toBe(step('showcase'));
    expect(stepForServerError('Each student needs valid name, department, year, contact and email')).toBe(step('delegation'));
    expect(stepForServerError('Invalid accommodation details')).toBe(step('accommodation'));
  });
});

describe('payload contract with the server', () => {
  test('the built payload passes server-side validation', async () => {
    const payload = buildPayload(completeState());
    const parsed = await validateRegistration({ ...payload, expo: { ...payload.expo!, abstract: pdf() } });
    expect(parsed.students).toHaveLength(3);
    expect(parsed.chapterShowcasePresenter).toBe('Asha');
    expect(parsed.expo?.teamName).toBe('Grid Pioneers');
    expect(parsed.expo?.teamMembers).toEqual([0, 1]);
    expect(parsed.accommodationParticipantNames).toEqual(['Asha', 'Bharath']);
  });

  test('without Expo or accommodation the payload omits those details', async () => {
    const payload = buildPayload(completeState({ participatingInExpo: 'no', accommodationRequired: 'no' }));
    expect(payload.expo).toBeUndefined();
    expect(payload.accommodationParticipantNames).toEqual([]);
    const parsed = await validateRegistration(payload);
    expect(parsed.participatingInExpo).toBe(false);
  });
});
