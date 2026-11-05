import { describe, expect, test } from 'bun:test';
import {
  STEPS,
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

function completeState(overrides: Partial<FormState> = {}): FormState {
  return syncDelegation({
    ...initialState,
    collegeName: 'Test College',
    csiChapterName: 'CSI Test',
    city: 'Udupi',
    facultyCoordinatorName: 'Dr. Rao',
    facultyCoordinatorEmail: 'rao@college.edu',
    facultyCoordinatorContact: '+91 98765 43210',
    facultyAccompanying: 'yes',
    totalRepresentatives: '4',
    students: [
      { fullName: 'Asha', department: 'CSE', year: '3', contactNumber: '9876500001', email: 'asha@college.edu' },
      { fullName: 'Bharath', department: 'ECE', year: '2', contactNumber: '9876500002', email: 'bharath@college.edu' },
      { fullName: 'Chitra', department: 'ME', year: '4', contactNumber: '9876500003', email: 'chitra@college.edu' },
    ],
    presenterIndex: 0,
    participatingInExpo: 'yes',
    projectTitle: 'Smart Grid',
    category: 'Energy & Resource Management',
    description: 'Leak detection for campus water lines.',
    teamIndexes: [0, 1],
    accommodationRequired: 'yes',
    arrivalPlan: '2026-11-24_NIGHT',
    maleAccommodationCount: '1',
    femaleAccommodationCount: '1',
    accommodationPeople: ['s0', 'faculty'],
    declarationAccepted: true,
    ...overrides,
  });
}

describe('delegation limits', () => {
  test('accompanying faculty takes one of the five places', () => {
    expect(studentCount({ totalRepresentatives: '5', facultyAccompanying: 'yes' })).toBe(4);
    expect(studentCount({ totalRepresentatives: '5', facultyAccompanying: 'no' })).toBe(5);
  });

  test('shrinking the delegation drops selections for removed students', () => {
    const shrunk = syncDelegation({ ...completeState({ presenterIndex: 2, teamIndexes: [1, 2] }), totalRepresentatives: '3' });
    expect(shrunk.students).toHaveLength(2);
    expect(shrunk.presenterIndex).toBeNull();
    expect(shrunk.teamIndexes).toEqual([1]);
  });

  test('faculty no longer accompanying is removed from accommodation', () => {
    const next = syncDelegation({ ...completeState(), facultyAccompanying: 'no' });
    expect(next.accommodationPeople).toEqual(['s0']);
    expect(next.students).toHaveLength(4);
  });

  test('a delegation of one with faculty accompanying is rejected', () => {
    const errors = validateStep(step('delegation'), completeState({ totalRepresentatives: '1' }), null);
    expect(errors.totalRepresentatives).toContain('at least one student');
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

  test('Expo team must have 2–4 members and an abstract', () => {
    const errors = validateStep(step('expo'), completeState({ teamIndexes: [0] }), null);
    expect(errors.teamIndexes).toBeDefined();
    expect(errors.abstract).toBeDefined();
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
    expect(stepForServerError('Expo team must contain 2–4 distinct registered students')).toBe(step('expo'));
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
    expect(parsed.expo?.teamMembers).toEqual([0, 1]);
    expect(parsed.accommodationParticipantNames).toEqual(['Asha', 'Dr. Rao']);
  });

  test('without Expo or accommodation the payload omits those details', async () => {
    const payload = buildPayload(completeState({ participatingInExpo: 'no', accommodationRequired: 'no' }));
    expect(payload.expo).toBeUndefined();
    expect(payload.accommodationParticipantNames).toEqual([]);
    const parsed = await validateRegistration(payload);
    expect(parsed.participatingInExpo).toBe(false);
  });
});
