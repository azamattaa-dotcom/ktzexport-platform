import { NextResponse } from 'next/server';
import { logisticsDb } from '@/lib/logistics';
import { getAuthenticatedBuyerId } from '@/lib/auth';

export async function GET() {
  const buyerId = await getAuthenticatedBuyerId();
  if (!buyerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const requests = await logisticsDb.findByBuyer(buyerId);
  return NextResponse.json({ requests });
}
