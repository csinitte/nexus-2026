import { after } from 'next/server';
import { isRegistrationClosed } from '@/lib/nexus/registration-window';
import { parseRegistrationRequest, ValidationError } from '@/lib/nexus/validation';
import { createRegistration, deliverRegistrationConfirmation } from '@/lib/nexus/registration-service';

export async function POST(req: Request) {
  if (isRegistrationClosed()) {
    return Response.json({ error: 'Registration is closed. If you already paid, contact the organising team.' }, { status: 410 });
  }
  try {
    const result = await createRegistration(await parseRegistrationRequest(req));
    const response = Response.json(result, { status: 201 });
    after(() => deliverRegistrationConfirmation(result));
    return response;
  } catch (error) {
    if (error instanceof ValidationError) return Response.json({ errors: error.issues }, { status: 400 });
    if (error instanceof SyntaxError) return Response.json({ error: 'Invalid request body' }, { status: 400 });
    if (String(error).includes('active_utr_unique') || String((error as { cause?: unknown })?.cause).includes('active_utr_unique')) {
      return Response.json({ error: 'This UTR number has already been used for another registration' }, { status: 409 });
    }
    console.error(error);
    return Response.json({ error: 'Registration could not be completed' }, { status: 500 });
  }
}
