import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { logisticsConfig, type LogisticsConfig } from '@/lib/logistics-config';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(await logisticsConfig.get());
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body: LogisticsConfig = await req.json();

  if (!Array.isArray(body.borders) || !Array.isArray(body.stations) || typeof body.referenceTonsPerContainer !== 'number') {
    return NextResponse.json({ error: 'Invalid config shape' }, { status: 400 });
  }
  if (body.referenceTonsPerContainer <= 0) {
    return NextResponse.json({ error: 'referenceTonsPerContainer must be positive' }, { status: 400 });
  }
  for (const b of body.borders) {
    if (!b.id?.trim() || !b.label?.trim()) {
      return NextResponse.json({ error: 'Border must have id and label' }, { status: 400 });
    }
  }
  for (const s of body.stations) {
    if (!s.id?.trim() || !s.ru?.trim() || !s.en?.trim() || typeof s.pricePerContainer !== 'number' || s.pricePerContainer < 0) {
      return NextResponse.json({ error: 'Station must have id, ru, en and a non-negative price' }, { status: 400 });
    }
  }

  await logisticsConfig.set(body);
  return NextResponse.json({ ok: true });
}
