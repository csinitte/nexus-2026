import { session } from '@/lib/nexus/admin-auth';
import {
  getJurorAbstract,
  getPublicLeaderboards,
  getJuryState,
  juryCookie,
  JuryError,
  juryLogin,
  updateJuryState,
  volunteerCookie,
  volunteerLogin,
} from '@/lib/nexus/jury-service';

type Context = { params: Promise<{ scope: string }> };
const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

async function requireOrganiser(req: Request) {
  const actor = await session(req);
  if (!actor) throw new JuryError('Sign in to the admin dashboard first.', 401);
  if (actor.role !== 'admin' && actor.role !== 'coordinator') throw new JuryError('Jury controls require organiser access.', 403);
}

function failure(error: unknown) {
  if (error instanceof JuryError) return json({ error: error.message }, error.status);
  if (error instanceof SyntaxError) return json({ error: 'Invalid request.' }, 400);
  console.error('Jury request failed', (error as { cause?: { code?: string }; code?: string })?.cause?.code);
  return json({ error: 'Jury data could not be loaded or saved. Try again.' }, 500);
}

export async function GET(req: Request, context: Context) {
  try {
    const { scope } = await context.params;
    if (scope === 'admin') {
      await requireOrganiser(req);
      return json(await getJuryState(req, 'admin'));
    }
    if (scope === 'volunteer') {
      return json(await getJuryState(req, 'volunteer'));
    }
    if (scope === 'portal') {
      return json(await getJuryState(req, 'portal'));
    }
    if (scope === 'leaderboard') {
      return json(await getPublicLeaderboards());
    }
    if (scope === 'abstract') {
      const teamId = new URL(req.url).searchParams.get('team') ?? '';
      const bytes = await getJurorAbstract(req, teamId);
      return new Response(new Uint8Array(bytes), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="project-abstract.pdf"',
          'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }
    return json({ error: 'Not found.' }, 404);
  } catch (error) {
    return failure(error);
  }
}

export async function POST(req: Request, context: Context) {
  try {
    const origin = req.headers.get('origin');
    const fetchSite = req.headers.get('sec-fetch-site');
    if (
      (fetchSite && fetchSite !== 'same-origin') ||
      (!fetchSite && origin && origin !== new URL(req.url).origin && new URL(origin).host !== req.headers.get('host'))
    ) {
      return json({ error: 'Invalid origin.' }, 403);
    }
    const { scope } = await context.params;

    // Juror Auth
    if (scope === 'logout') return json({ ok: true }, 200, { 'Set-Cookie': juryCookie('', 0) });
    if (scope === 'login') {
      const token = await juryLogin(await req.json());
      return json({ ok: true }, 200, { 'Set-Cookie': juryCookie(token) });
    }

    // Volunteer Auth
    if (scope === 'volunteer-logout') return json({ ok: true }, 200, { 'Set-Cookie': volunteerCookie('', 0) });
    if (scope === 'volunteer-login') {
      const token = await volunteerLogin(await req.json());
      return json({ ok: true }, 200, { 'Set-Cookie': volunteerCookie(token) });
    }

    // Operations
    if (scope === 'admin') {
      await requireOrganiser(req);
      return json(await updateJuryState(req, await req.json(), 'admin'));
    }
    if (scope === 'volunteer') {
      return json(await updateJuryState(req, await req.json(), 'volunteer'));
    }
    if (scope === 'portal') {
      return json(await updateJuryState(req, await req.json(), 'portal'));
    }

    return json({ error: 'Not found.' }, 404);
  } catch (error) {
    return failure(error);
  }
}
