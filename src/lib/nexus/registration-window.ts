// Midnight in India at the end of 23 November.
export const REGISTRATION_CLOSE_AT = '2026-11-24T00:00:00+05:30';
export const REGISTRATION_CLOSE_LABEL = '12:00 AM IST on 24 November 2026';
export const REGISTRATION_CLOSE_TIME = Date.parse(REGISTRATION_CLOSE_AT);

export function isRegistrationClosed(now = Date.now()) {
  return now >= REGISTRATION_CLOSE_TIME;
}
