import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedBuyerId } from '@/lib/auth';

export async function GET() {
  const buyerId = await getAuthenticatedBuyerId();
  if (!buyerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const buyer = await db.buyers.findById(buyerId);
  if (!buyer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Strip sensitive fields before returning
  const { passwordHash, charterDoc, registrationDoc, passportDoc, ...safe } = buyer;
  return NextResponse.json({
    ...safe,
    hasCharter: !!charterDoc,
    hasRegistration: !!registrationDoc,
    hasPassport: !!passportDoc,
  });
}
