import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { chatDb } from '@/lib/chat';
import { db } from '@/lib/db';

const PRODUCT_LABELS: Record<string, string> = {
  flour_feed: 'Кормовая мука', flour_wheat: 'Пшеничная мука', wheat: 'Пшеница',
  barley: 'Ячмень', bran: 'Пшеничные отруби', flaxseed: 'Семена льна',
  sunflower: 'Семена подсолнечника', corn: 'Кукуруза', groats: 'Крупы',
};

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const threads = await chatDb.getAllThreads();
  const suppliers = await db.suppliers.findAll();
  const supplierById = new Map(suppliers.map((s) => [s.id, s]));

  const items = threads.flatMap((thread) => {
    const supplier = supplierById.get(thread.supplierId);
    return thread.messages
      .filter((m) => m.status === 'pending')
      .map((m) => ({
        threadId: thread.id,
        messageId: m.id,
        fromType: m.fromType,
        content: m.content,
        timestamp: m.timestamp,
        buyerName: thread.buyerName,
        buyerEmail: thread.buyerEmail,
        supplierId: thread.supplierId,
        supplierName: supplier?.companyName ?? thread.supplierId,
        productLabel: PRODUCT_LABELS[thread.productId] ?? thread.productId,
      }));
  });

  items.sort((a, b) => a.timestamp - b.timestamp);
  return NextResponse.json({ items });
}
