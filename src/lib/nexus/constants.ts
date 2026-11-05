export const NEXUS_EVENT = {
  name: "NEXUS 2026",
  subtitle: "CSI Student Summit on Innovation & Technology",
  tagline: "Connecting Chapters. Inspiring Innovation.",
  organiser: "CSI Student Chapter, NMAMIT",
  hostInstitution: "NMAM Institute of Technology, Nitte",
  venue: "NMAM Institute of Technology (NMAMIT), Nitte, Karnataka",
  eventDateIso: "2026-11-25",
  eventDateDisplay: "25 November 2026",
  abstractDeadlineIso: "2026-11-20",
  abstractDeadlineDisplay: "20 November 2026",
  website: "csinmamit.in",
  instagram: "@csi_nmamit",
  contacts: [
    {
      name: "Shravya N Bhat",
      role: "President, CSI NMAMIT",
      phone: "+91 8951236021",
    },
    {
      name: "Pranjal Shetty",
      role: "Organising Team, CSI NMAMIT",
      phone: "+91 8591310513",
    },
  ],
} as const;

export const MAX_TOTAL_REPRESENTATIVES = 5;
export const MIN_TOTAL_REPRESENTATIVES = 1;
export const MAX_STUDENTS_WITH_FACULTY = 4;
export const MAX_STUDENTS_WITHOUT_FACULTY = 5;

export const MIN_EXPO_TEAM_MEMBERS = 2;
export const MAX_EXPO_TEAM_MEMBERS = 4;

export const ALLOWED_STUDY_YEARS = [1, 2, 3, 4] as const;
export type StudyYear = (typeof ALLOWED_STUDY_YEARS)[number];

export const EXPO_PROJECT_CATEGORIES = [
  "Sustainability & Environment",
  "Smart Infrastructure & Mobility",
  "Energy & Resource Management",
  "AI, IoT & Intelligent Systems",
  "Healthcare & Social Innovation",
  "Open Innovation",
] as const;

export type ExpoProjectCategory = (typeof EXPO_PROJECT_CATEGORIES)[number];

export const EXPO_REVIEW_STATUSES = [
  "Not Reviewed",
  "Reviewed",
  "Clarification Required",
  "Clarification Received",
] as const;

export type ExpoReviewStatus = (typeof EXPO_REVIEW_STATUSES)[number];

export const REGISTRATION_STATUSES = [
  "submitted",
  "verified",
  "cancelled",
] as const;

export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const ARRIVAL_PLANS = [
  "2026-11-24_NIGHT",
  "2026-11-25_MORNING",
] as const;

export type ArrivalPlan = (typeof ARRIVAL_PLANS)[number];

export const PARTICIPANT_TYPES = ["student", "faculty_coordinator"] as const;
export type ParticipantType = (typeof PARTICIPANT_TYPES)[number];

export const ADMIN_ROLES = ["admin", "coordinator", "viewer"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const DEFAULT_MAX_ABSTRACT_BYTES = 10 * 1024 * 1024; // 10 MB per PRD Section 11

export function getMaxAbstractBytes(): number {
  const raw = Number(process.env.NEXUS_MAX_ABSTRACT_BYTES);
  if (Number.isFinite(raw) && raw > 0) {
    return Math.floor(raw);
  }
  return DEFAULT_MAX_ABSTRACT_BYTES;
}

export const DECLARATION_TEXT =
  "I confirm that the information provided is accurate and that our college understands the NEXUS 2026 participation guidelines, including the delegation limit and Student Project Expo requirements, wherever applicable.";
