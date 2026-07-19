import { NextRequest, NextResponse } from 'next/server';
import { sendBuyerRequest } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { supplierCompany, productId, name, email, phone, volume, message } = await req.json();

  if (!supplierCompany || !productId || !name || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  await sendBuyerRequest({
    supplierCompany,
    productId,
    buyerName: name,
    buyerEmail: email,
    buyerPhone: phone,
    volume,
    message,
  });

  return NextResponse.json({ ok: true });
}
