/**
 * Registration form state, step definitions and client-side validation.
 *
 * These rules mirror src/lib/nexus/validation.ts so people see problems
 * before submitting; the server remains the source of truth.
 */
import {
  ARRIVAL_PLANS,
  DEFAULT_MAX_ABSTRACT_BYTES,
  EXPO_PROJECT_CATEGORIES,
  MAX_EXPO_TEAM_MEMBERS,
  MIN_EXPO_TEAM_MEMBERS,
  MIN_TOTAL_REPRESENTATIVES,
  MAX_TOTAL_REPRESENTATIVES,
  PAYMENT_PROOF_TYPES,
  MAX_PAYMENT_PROOF_BYTES,
  isNmamit,
  type CollegeCategory,
} from '@/lib/nexus/constants';

export type YesNo = '' | 'yes' | 'no';

export type StudentDraft = {
  fullName: string;
  department: string;
  year: string;
  contactNumber: string;
  email: string;
};

export type FormState = {
  collegeName: string;
  collegeCategory: CollegeCategory;
  csiChapterName: string;
  csiChapterId: string;
  city: string;
  facultyCoordinatorName: string;
  facultyCoordinatorEmail: string;
  facultyCoordinatorContact: string;
  facultyAccompanying: YesNo;
  students: StudentDraft[];
  /** Index into `students`, kept as an index so renaming a student keeps the choice. */
  presenterIndex: number | null;
  participatingInExpo: YesNo;
  teamName: string;
  projectTitle: string;
  category: string;
  description: string;
  expoTeamSize: string;
  teamIndexes: number[];
  accommodationRequired: YesNo;
  arrivalPlan: string;
  maleAccommodationCount: string;
  femaleAccommodationCount: string;
  /** Keys: `s0`, `s1`, … for students requiring accommodation. */
  accommodationPeople: string[];
  utrNumber: string;
  declarationAccepted: boolean;
};

export type Errors = Record<string, string>;

export const STEPS = [
  { id: 'college', label: 'College', title: 'College details' },
  { id: 'faculty', label: 'Faculty', title: 'Faculty coordinator' },
  { id: 'delegation', label: 'Delegation', title: 'Delegation details' },
  { id: 'showcase', label: 'Showcase', title: 'CSI Student Branch Showcase' },
  { id: 'expo', label: 'Expo', title: 'Student Project Expo' },
  { id: 'accommodation', label: 'Stay', title: 'Accommodation' },
  { id: 'payment', label: 'Payment', title: 'Registration Fee & Payment' },
  { id: 'review', label: 'Submit', title: 'Review & declaration' },
] as const;

export const MAX_DESCRIPTION_LENGTH = 800;
export const MAX_ABSTRACT_BYTES = DEFAULT_MAX_ABSTRACT_BYTES;

export const ARRIVAL_LABELS: Record<(typeof ARRIVAL_PLANS)[number], string> = {
  '2026-11-24_NIGHT': '24 November 2026 (previous night)',
  '2026-11-25_MORNING': '25 November 2026 (event morning)',
};

export const blankStudent = (): StudentDraft => ({ fullName: '', department: '', year: '', contactNumber: '', email: '' });

export const initialState: FormState = {
  collegeName: '',
  collegeCategory: 'no_active_csi' as CollegeCategory,
  csiChapterName: '',
  csiChapterId: '',
  city: '',
  facultyCoordinatorName: '',
  facultyCoordinatorEmail: '',
  facultyCoordinatorContact: '',
  facultyAccompanying: '',
  students: Array.from({ length: MIN_TOTAL_REPRESENTATIVES }, blankStudent),
  presenterIndex: null,
  participatingInExpo: '',
  teamName: '',
  projectTitle: '',
  category: '',
  description: '',
  expoTeamSize: '',
  teamIndexes: [],
  accommodationRequired: '',
  arrivalPlan: '',
  maleAccommodationCount: '0',
  femaleAccommodationCount: '0',
  accommodationPeople: [],
  utrNumber: '',
  declarationAccepted: false,
};

export function studentCount(state: Pick<FormState, 'students'>): number {
  return state.students.length;
}

/** Drops selections that point at students removed from this registration. */
export function syncDelegation(state: FormState): FormState {
  const count = studentCount(state);
  const valid = (i: number) => i >= 0 && i < count;
  return {
    ...state,
    presenterIndex: state.presenterIndex !== null && valid(state.presenterIndex) ? state.presenterIndex : null,
    teamIndexes: state.teamIndexes.filter(valid),
    accommodationPeople: state.accommodationPeople.filter((key) => valid(Number(key.slice(1)))),
  };
}

/** Students who can be chosen for accommodation, keyed for stable selection. */
export function delegationPeople(state: FormState): { key: string; name: string; role: string }[] {
  return state.students.map((s, i) => ({ key: `s${i}`, name: s.fullName.trim() || `Student ${i + 1}`, role: 'Student' }));
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isEmail = (v: string) => EMAIL.test(v.trim());
/** Accepts Indian and international numbers: 10–13 digits, optional +, spaces and dashes. */
export const isPhone = (v: string) => /^\+?[\d\s-]+$/.test(v.trim()) && /^\d{10,13}$/.test(v.replace(/\D/g, ''));
const required = (errors: Errors, key: string, value: string, label: string) => {
  if (!value.trim()) errors[key] = `Enter ${label}.`;
};

export function validateAbstract(file: File | null): string | null {
  if (!file) return 'Upload your project abstract as a PDF.';
  if (!file.name.toLowerCase().endsWith('.pdf') || (file.type && file.type !== 'application/pdf'))
    return 'The abstract must be a PDF file.';
  if (file.size === 0) return 'This file is empty. Choose another PDF.';
  if (file.size > MAX_ABSTRACT_BYTES) return `The abstract must be ${Math.round(MAX_ABSTRACT_BYTES / 1024 / 1024)} MB or smaller.`;
  return null;
}

export function validateStep(step: number, state: FormState, abstract: File | null, screenshot: File | null = null): Errors {
  const e: Errors = {};
  const count = studentCount(state);
  const isActiveCsi = state.collegeCategory === 'active_csi';
  switch (STEPS[step]?.id) {
    case 'college':
      required(e, 'collegeName', state.collegeName, 'your college name');
      if (isActiveCsi && isNmamit(state.collegeName)) e.collegeCategory = 'For NMAMIT, Nitte, choose No Active CSI Branch.';
      if (isActiveCsi) required(e, 'csiChapterName', state.csiChapterName, 'your CSI student branch name');
      required(e, 'city', state.city, 'your city');
      break;
    case 'faculty':
      if (isActiveCsi) {
        required(e, 'facultyCoordinatorName', state.facultyCoordinatorName, "the faculty coordinator's name");
        if (!isEmail(state.facultyCoordinatorEmail)) e.facultyCoordinatorEmail = 'Enter a valid email address, like name@college.edu.';
        if (!isPhone(state.facultyCoordinatorContact)) e.facultyCoordinatorContact = 'Enter a valid contact number with at least 10 digits.';
        if (!state.facultyAccompanying) e.facultyAccompanying = 'Tell us whether the faculty coordinator is accompanying the delegation.';
      }
      break;
    case 'delegation': {
      if (count < MIN_TOTAL_REPRESENTATIVES || count > MAX_TOTAL_REPRESENTATIVES)
        e.totalRepresentatives = `Register ${MIN_TOTAL_REPRESENTATIVES}–${MAX_TOTAL_REPRESENTATIVES} students.`;
      const emails = new Map<string, number>();
      const names = new Map<string, number>();
      state.students.forEach((s, i) => {
        const p = `s${i}-`;
        required(e, `${p}fullName`, s.fullName, 'a full name');
        required(e, `${p}department`, s.department, 'a department');
        if (!['1', '2', '3', '4'].includes(s.year)) e[`${p}year`] = 'Choose a year of study.';
        if (!isPhone(s.contactNumber)) e[`${p}contactNumber`] = 'Enter a valid contact number.';
        if (!isEmail(s.email)) e[`${p}email`] = 'Enter a valid email address.';
        const email = s.email.trim().toLowerCase();
        if (email && emails.has(email)) e[`${p}email`] = `Same email as student ${emails.get(email)! + 1}. Each student needs their own.`;
        else if (email) emails.set(email, i);
        const name = s.fullName.trim().toLowerCase();
        if (name && names.has(name)) e[`${p}fullName`] = `Same name as student ${names.get(name)! + 1}. Add an initial to tell them apart.`;
        else if (name) names.set(name, i);
      });
      break;
    }
    case 'showcase':
      if (isActiveCsi) {
        if (state.presenterIndex === null || !state.students[state.presenterIndex])
          e.presenterIndex = 'Choose who will present your chapter.';
      }
      break;
    case 'expo':
      if (!state.participatingInExpo) e.participatingInExpo = 'Tell us whether your college is participating in the Expo.';
      if (state.participatingInExpo === 'yes') {
        if (count < MIN_EXPO_TEAM_MEMBERS)
          e.participatingInExpo = `An Expo team needs at least ${MIN_EXPO_TEAM_MEMBERS} student representatives.`;
        required(e, 'teamName', state.teamName, 'the Expo team name');
        if (state.teamName.trim().length > 160) e.teamName = 'Keep the team name under 160 characters.';
        required(e, 'projectTitle', state.projectTitle, 'the project or product title');
        if (!EXPO_PROJECT_CATEGORIES.includes(state.category as never)) e.category = 'Choose a project category.';
        if (state.description.length > MAX_DESCRIPTION_LENGTH)
          e.description = `Keep the description under ${MAX_DESCRIPTION_LENGTH} characters.`;
        const abstractError = validateAbstract(abstract);
        if (abstractError) e.abstract = abstractError;
        const team = state.teamIndexes.length;
        const teamSize = Number(state.expoTeamSize);
        if (!Number.isInteger(teamSize) || teamSize < MIN_EXPO_TEAM_MEMBERS || teamSize > MAX_EXPO_TEAM_MEMBERS)
          e.expoTeamSize = `Choose an Expo team size of ${MIN_EXPO_TEAM_MEMBERS}–${MAX_EXPO_TEAM_MEMBERS} students.`;
        else if (team !== teamSize) e.teamIndexes = `Select ${teamSize} team member${teamSize === 1 ? '' : 's'} (currently ${team}).`;
      }
      break;
    case 'accommodation':
      if (!state.accommodationRequired) e.accommodationRequired = 'Tell us whether your delegation needs accommodation.';
      if (state.accommodationRequired === 'yes') {
        if (!ARRIVAL_PLANS.includes(state.arrivalPlan as never)) e.arrivalPlan = 'Choose when you plan to arrive.';
        const male = Number(state.maleAccommodationCount);
        const female = Number(state.femaleAccommodationCount);
        const selected = state.accommodationPeople.length;
        if (!Number.isInteger(male) || male < 0) e.maleAccommodationCount = 'Enter 0 or more.';
        if (!Number.isInteger(female) || female < 0) e.femaleAccommodationCount = 'Enter 0 or more.';
        if (selected < 1) e.accommodationPeople = 'Select everyone who needs accommodation.';
        else if (!e.maleAccommodationCount && !e.femaleAccommodationCount && male + female !== selected)
          e.accommodationCounts = `Male + female students (${male + female}) must equal the ${selected} ${selected === 1 ? 'student' : 'students'} selected.`;
      }
      break;
    case 'review':
      if (!state.declarationAccepted) e.declarationAccepted = 'Please confirm the declaration to submit.';
      break;
    case 'payment':
      if (!state.utrNumber.trim() || state.utrNumber.trim().length < 6)
        e.utrNumber = 'Enter the UPI Transaction ID / UTR Number from your payment.';
      const screenshotError = validatePaymentScreenshot(screenshot);
      if (screenshotError) e.paymentScreenshot = screenshotError;
      break;
  }
  return e;
}

export function firstInvalidStep(state: FormState, abstract: File | null, screenshot: File | null = null): number | null {
  for (let i = 0; i < STEPS.length; i++) if (Object.keys(validateStep(i, state, abstract, screenshot)).length) return i;
  return null;
}

export function validatePaymentScreenshot(file: File | null): string | null {
  if (!file?.size) return 'Upload the payment proof screenshot.';
  if (!PAYMENT_PROOF_TYPES.includes(file.type)) return 'Choose a PNG or JPEG payment screenshot.';
  if (file.size > MAX_PAYMENT_PROOF_BYTES) return 'Choose a payment screenshot of 1 MB or smaller.';
  return null;
}

/** Builds the JSON payload expected by POST /api/registrations. */
export function buildPayload(state: FormState) {
  const people = delegationPeople(state);
  const expo = state.participatingInExpo === 'yes';
  const accommodation = state.accommodationRequired === 'yes';
  const isActiveCsi = state.collegeCategory === 'active_csi';
  return {
    collegeName: state.collegeName.trim(),
    collegeCategory: state.collegeCategory,
    csiChapterName: isActiveCsi ? state.csiChapterName.trim() : undefined,
    csiChapterId: isActiveCsi ? state.csiChapterId.trim() : undefined,
    city: state.city.trim(),
    facultyCoordinatorName: isActiveCsi ? state.facultyCoordinatorName.trim() : undefined,
    facultyCoordinatorEmail: isActiveCsi ? state.facultyCoordinatorEmail.trim() : undefined,
    facultyCoordinatorContact: isActiveCsi ? state.facultyCoordinatorContact.trim() : undefined,
    facultyAccompanying: isActiveCsi ? state.facultyAccompanying === 'yes' : false,
    totalRepresentatives: state.students.length,
    students: state.students.map((s) => ({
      fullName: s.fullName.trim(),
      department: s.department.trim(),
      year: Number(s.year),
      contactNumber: s.contactNumber.trim(),
      email: s.email.trim(),
    })),
    chapterShowcasePresenter: isActiveCsi && state.presenterIndex !== null ? (state.students[state.presenterIndex]?.fullName.trim() ?? '') : undefined,
    participatingInExpo: expo,
    expo: expo
      ? {
          teamName: state.teamName.trim(),
          projectTitle: state.projectTitle.trim(),
          category: state.category,
          description: state.description.trim(),
          teamMembers: [...state.teamIndexes].sort((a, b) => a - b),
        }
      : undefined,
    accommodationRequired: accommodation,
    arrivalPlan: accommodation ? state.arrivalPlan : undefined,
    maleAccommodationCount: accommodation ? Number(state.maleAccommodationCount) : 0,
    femaleAccommodationCount: accommodation ? Number(state.femaleAccommodationCount) : 0,
    accommodationParticipantNames: accommodation
      ? state.accommodationPeople.map((key) => people.find((p) => p.key === key)?.name ?? '').filter(Boolean)
      : [],
    declarationAccepted: state.declarationAccepted,
    payment: {
      collegeCategory: state.collegeCategory,
      utrNumber: state.utrNumber.trim(),
    },
  };
}

/** Maps server validation messages to the step that fixes them. */
export function stepForServerError(message: string): number {
  const m = message.toLowerCase();
  if (/college|chapter(name| name)|city/.test(m) && !m.includes('showcase')) return 0;
  if (m.includes('faculty')) return 1;
  if (m.includes('payment screenshot and abstract')) return 4;
  if (m.includes('expo') || m.includes('abstract') || m.includes('pdf')) return 4;
  if (m.includes('presenter') || m.includes('showcase')) return 3;
  if (m.includes('delegation') || m.includes('student')) return 2;
  if (m.includes('accommodation')) return 5;
  if (m.includes('payment') || m.includes('utr') || m.includes('csi') || m.includes('membership') || m.includes('screenshot')) return 6;
  return STEPS.length - 1;
}


