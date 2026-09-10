import { NextRequest, NextResponse } from 'next/server';
import { chatDb } from '@/lib/chat';
import { isAdminAuthenticated, getAuthenticatedSupplierId } from '@/lib/auth';
import { db } from '@/lib/db';

async function getSupplierFromToken() {
  const id = await getAuthenticatedSupplierId();
  return id ? db.suppliers.findById(id) : null;
}

export async function GET(_req: NextRequest) {
  const supplier = await getSupplierFromToken();
  if (!supplier) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const threads = await chatDb.getThreadsForSupplier(supplier.id);
  const filtered = threads.map((t) => ({
    ...t,
    messages: t.messages.filter((m) => m.fromType === 'supplier' || m.status === 'approved'),
  }));
  return NextResponse.json({ threads: filtered });
}
