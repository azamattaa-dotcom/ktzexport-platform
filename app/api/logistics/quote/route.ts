import { NextRequest, NextResponse } from 'next/server';
import { sendLogisticsRequest } from '@/lib/email';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { transportType, stationDeparture, stationBorder, stationDestination,
    cargoName, contactName, contactEmail } = body;

  if (!transportType || !stationDeparture || !stationBorder || !stationDestination ||
      !cargoName || !contactName || !contactEmail) {
    return NextResponse.json({ error: 'Заполните все обязательные поля' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return NextResponse.json({ error: 'Некорректный email' }, { status: 400 });
  }

  await sendLogisticsRequest(body);
  return NextResponse.json({ ok: true });
}
