import { NextRequest, NextResponse } from 'next/server';
import { logisticsDb } from '@/lib/logistics';
import { db } from '@/lib/db';
import { notifyAdminPendingLogisticsRequest } from '@/lib/email';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { transportType, stationDeparture, stationBorder, stationDestination,
    cargoName, contactName, contactEmail, supplierId, origin, buyerId } = body;

  if (!transportType || !stationDeparture || !stationBorder || !stationDestination ||
      !cargoName || !contactName || !contactEmail || !supplierId) {
    return NextResponse.json({ error: 'Заполните все обязательные поля' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return NextResponse.json({ error: 'Некорректный email' }, { status: 400 });
  }

  const supplier = await db.suppliers.findById(supplierId);
  if (!supplier || supplier.status !== 'approved') {
    return NextResponse.json({ error: 'Поставщик не найден' }, { status: 404 });
  }

  await logisticsDb.create({
    ...body,
    origin: origin ?? 'buyer_dashboard',
    supplierId,
    supplierName: supplier.companyName,
    buyerId,
  });

  await notifyAdminPendingLogisticsRequest({
    contactName,
    contactCompany: body.contactCompany,
    contactEmail,
    supplierCompany: supplier.companyName,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
