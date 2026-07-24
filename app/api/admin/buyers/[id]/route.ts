import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';
import { sendBuyerInvite, notifyBuyerRejected } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const buyer = await db.buyers.findById(id);
  if (!buyer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { passwordHash, ...safe } = buyer;
  return NextResponse.json(safe);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { action, rejectionReason, adminNotes } = await req.json();

  const buyer = await db.buyers.findById(id);
  if (!buyer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (action === 'approve') {
    const inviteToken = uuidv4();
    await db.buyers.update(id, { status: 'approved', inviteToken, adminNotes });
    await sendBuyerInvite({ companyName: buyer.companyName, email: buyer.email, inviteToken }).catch(console.error);
    return NextResponse.json({ ok: true, status: 'approved' });
  }

  if (action === 'reject') {
    await db.buyers.update(id, { status: 'rejected', rejectionReason, adminNotes });
    await notifyBuyerRejected({ companyName: buyer.companyName, email: buyer.email, rejectionReason }).catch(console.error);
    return NextResponse.json({ ok: true, status: 'rejected' });
  }

  if (action === 'notes') {
    await db.buyers.update(id, { adminNotes });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  await db.buyers.delete(id);
  return NextResponse.json({ ok: true });
}
