import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';
import { sendSupplierInvite } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { status } = await req.json();
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  let inviteToken: string | undefined;
  if (status === 'approved') {
    const current = await db.suppliers.findById(params.id);
    if (current && !current.passwordHash) {
      inviteToken = uuidv4();
    }
  }

  const updated = await db.suppliers.updateStatus(params.id, status, inviteToken);
  if (!updated) {
    return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
  }

  if (status === 'approved' && inviteToken) {
    await sendSupplierInvite({
      companyName: updated.companyName,
      email: updated.email,
      inviteToken,
    });
  }

  return NextResponse.json(updated);
}
