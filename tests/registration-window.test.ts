import { expect, test } from 'bun:test';
import { isRegistrationClosed, REGISTRATION_CLOSE_TIME } from '../src/lib/nexus/registration-window';

test('registration closes at midnight in India at the end of 23 November', () => {
  expect(new Date(REGISTRATION_CLOSE_TIME).toISOString()).toBe('2026-11-23T18:30:00.000Z');
  expect(isRegistrationClosed(REGISTRATION_CLOSE_TIME - 1)).toBe(false);
  expect(isRegistrationClosed(REGISTRATION_CLOSE_TIME)).toBe(true);
  expect(isRegistrationClosed(REGISTRATION_CLOSE_TIME + 1)).toBe(true);
});

test('the public API rejects submissions at the cutoff before reading their body', async () => {
  const { setSystemTime } = await import('bun:test');
  const { POST } = await import('../src/app/api/registrations/route');
  try {
    const request = () => new Request('http://localhost/api/registrations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
    });
    setSystemTime(new Date(REGISTRATION_CLOSE_TIME - 1));
    expect((await POST(request())).status).toBe(400);
    setSystemTime(new Date(REGISTRATION_CLOSE_TIME));
    const response = await POST(request());
    expect(response.status).toBe(410);
    expect(await response.text()).toContain('Registration is closed');
  } finally {
    setSystemTime();
  }
});
