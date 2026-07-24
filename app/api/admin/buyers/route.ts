import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const buyers = await db.buyers.findAll();
  // Strip document base64 for list view (too heavy), keep metadata
  const light = buyers.map(({ charterDoc, registrationDoc, passportDoc, passwordHash, ...b }) => ({
    ...b,
    hasCharter: !!charterDoc,
    hasRegistration: !!registrationDoc,
    hasPassport: !!passportDoc,
  }));

  return NextResponse.json(light);
}
