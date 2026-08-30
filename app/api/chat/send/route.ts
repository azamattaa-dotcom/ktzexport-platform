import { NextRequest, NextResponse } from 'next/server';
import { chatDb } from '@/lib/chat';
import { db } from '@/lib/db';
import { notifyAdminPendingChatMessage } from '@/lib/email';

const PRODUCT_LABELS: Record<string, string> = {
  flour_feed: 'Кормовая мука', flour_wheat: 'Пшеничная мука', wheat: 'Пшеница',
  barley: 'Ячмень', bran: 'Пшеничные отруби', flaxseed: 'Семена льна',
  sunflower: 'Семена подсолнечника', corn: 'Кукуруза', groats: 'Крупы',
};

export async function POST(req: NextRequest) {
  const { supplierId, productId, buyerEmail, buyerName, content } = await req.json();

  if (!supplierId || !productId || !buyerEmail || !buyerName || !content?.trim()) {
    return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
    return NextResponse.json({ error: 'Некорректный email' }, { status: 400 });
  }

  const thread = await chatDb.addMessage(supplierId, productId, buyerEmail, buyerName, 'buyer', content);

  const supplier = await db.suppliers.findById(supplierId);
  if (supplier) {
    const productLabel = PRODUCT_LABELS[productId] ?? productId;
    await notifyAdminPendingChatMessage({
      fromType: 'buyer',
      buyerName,
      buyerEmail,
      supplierCompany: supplier.companyName,
      productLabel,
      content,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, threadId: thread.id });
}
