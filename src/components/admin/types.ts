export type AdminUser = { id: string; email: string; name?: string; role: 'admin' | 'coordinator' | 'viewer' };

export type Registration = {
  id: string;
  registrationCode: string;
  collegeName: string;
  csiChapterName: string;
  csiChapterId: string | null;
  city: string;
  facultyCoordinatorName: string;
  facultyCoordinatorEmail: string;
  facultyCoordinatorContact: string;
  facultyAccompanying: boolean;
  totalRepresentatives: number;
  chapterShowcasePresenter: string;
  participatingInExpo: boolean;
  accommodationRequired: boolean;
  arrivalPlan: string | null;
  maleAccommodationCount: number;
  femaleAccommodationCount: number;
  accommodationParticipantNames: string[];
  registrationStatus: 'submitted' | 'verified' | 'cancelled' | string;
  createdAt?: string;
};

export type Participant = {
  id: string;
  fullName: string;
  email: string;
  department: string;
  year: number;
  contactNumber: string;
  participantType: 'student' | 'faculty_coordinator' | string;
};

export type ExpoProject = {
  id: string;
  registrationId: string;
  projectTitle: string;
  category: string;
  description: string;
  reviewStatus: string;
  internalRemarks: string | null;
  abstractFileName?: string;
};

export type RegistrationDetail = {
  registration: Registration;
  participants: Participant[];
  expoProject: ExpoProject | null;
  teamMembers: { participantId: string }[];
};

export type Overview = {
  totalCollegeRegistrations: number;
  totalStudentRepresentatives: number;
  totalAccompanyingFacultyCoordinators: number;
  totalRegisteredDelegations: number;
  totalChapterShowcaseEntries: number;
  totalExpoProjects: number;
  totalAccommodationRequests: number;
};

export const ARRIVAL_LABELS: Record<string, string> = {
  '2026-11-24_NIGHT': '24 Nov, night',
  '2026-11-25_MORNING': '25 Nov, morning',
};

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin/${path}`, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || `Request failed (${response.status})`), { status: response.status });
  return data as T;
}
