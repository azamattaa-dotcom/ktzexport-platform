import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { chatLeads } from '@/lib/chat-leads';
import { notifyAdminNewLogisticsOrder } from '@/lib/email';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    contact,
    productId,
    productName,
    supplierId,
    supplierName,
    productPricePerTon,
    productCurrency,
    productUnit,
    border,
    borderLabel,
    returnStationId,
    returnStationLabel,
    containers,
    ratePerTon,
    logisticsPerContainer,
    totalPerTon,
  } = body;

  if (!contact?.trim() || !border || !returnStationId || !borderLabel || !returnStationLabel) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const lead = await chatLeads.create({
    id: uuidv4(),
    intent: 'logistics_order',
    product: productName,
    contact: contact.trim(),
    orderContext: {
      productId,
      productName,
      supplierId,
      supplierName,
      productPricePerTon,
      productCurrency,
      productUnit,
      border,
      borderLabel,
      returnStationId,
      returnStationLabel,
      containers: containers ?? 1,
      ratePerTon,
      logisticsPerContainer,
      totalPerTon,
    },
  });

  await notifyAdminNewLogisticsOrder({
    contact: lead.contact,
    productName,
    supplierName,
    borderLabel,
    returnStationLabel,
    containers: containers ?? 1,
    productPricePerTon,
    ratePerTon,
    logisticsPerContainer,
  }).catch(console.error);

  return NextResponse.json({ ok: true, id: lead.id });
}
