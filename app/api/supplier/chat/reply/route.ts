import { NextRequest, NextResponse } from 'next/server';
import { chatDb } from '@/lib/chat';
import { notifyChatReply } from '@/lib/email';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';

const PRODUCT_LABELS: Record<string, string> = {
  flour_feed: 'Кормовая мука', flour_wheat: 'Пшеничная мука', wheat: 'Пшеница',
  barley: 'Ячмень', bran: 'Пшеничные отруби', flaxseed: 'Семена льна',
  sunflower: 'Семена подсолнечника', corn: 'Кукуруза',
};

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'fallback-secret');

async function getSupplierFromToken() {
  const token = cookies().get('ktz_supplier_token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return db.suppliers.findById(payload.supplierId as string);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const supplier = await getSupplierFromToken();
  if (!supplier) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { supplierId, productId, buyerEmail, buyerName, content } = await req.json();
  if (!supplierId || !productId || !buyerEmail || !content?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  if (supplier.id !== supplierId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const thread = await chatDb.addMessage(supplierId, productId, buyerEmail, buyerName ?? '', 'supplier', content);

  const productLabel = PRODUCT_LABELS[productId] ?? productId;
  await notifyChatReply({
    buyerEmail,
    supplierCompany: supplier.companyName,
    productLabel,
    content,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
