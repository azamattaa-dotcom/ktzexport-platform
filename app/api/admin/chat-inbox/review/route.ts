import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { chatDb } from '@/lib/chat';
import { db } from '@/lib/db';
import { notifyChatMessage, notifyChatReply } from '@/lib/email';

const PRODUCT_LABELS: Record<string, string> = {
  flour_feed: 'Кормовая мука', flour_wheat: 'Пшеничная мука', wheat: 'Пшеница',
  barley: 'Ячмень', bran: 'Пшеничные отруби', flaxseed: 'Семена льна',
  sunflower: 'Семена подсолнечника', corn: 'Кукуруза', groats: 'Крупы',
};

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { threadId, messageId, action, editedContent } = await req.json();
  if (!threadId || !messageId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }

  const beforeThread = await chatDb.getAllThreads().then((ts) => ts.find((t) => t.id === threadId));
  const message = beforeThread?.messages.find((m) => m.id === messageId);
  if (!beforeThread || !message) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const thread = await chatDb.reviewMessage(threadId, messageId, action, editedContent);
  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (action === 'approve') {
    const finalMessage = thread.messages.find((m) => m.id === messageId)!;
    const productLabel = PRODUCT_LABELS[thread.productId] ?? thread.productId;

    if (message.fromType === 'buyer') {
      const supplier = await db.suppliers.findById(thread.supplierId);
      if (supplier) {
        await notifyChatMessage({
          supplierEmail: supplier.email,
          supplierCompany: supplier.companyName,
          buyerName: thread.buyerName,
          buyerEmail: thread.buyerEmail,
          productLabel,
          content: finalMessage.content,
        }).catch(() => {});
      }
    } else if (message.fromType === 'supplier') {
      const supplier = await db.suppliers.findById(thread.supplierId);
      await notifyChatReply({
        buyerEmail: thread.buyerEmail,
        supplierCompany: supplier?.companyName ?? '',
        productLabel,
        content: finalMessage.content,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
