import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { status } = await req.json();
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const updated = await db.suppliers.updateStatus(params.id, status);
  if (!updated) {
    return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}
