import { NextRequest, NextResponse } from 'next/server';
import { db, ProductDetail } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';
import { sendSupplierInvite } from '@/lib/email';
import { containsContactInfo, CONTACT_BLOCK_MESSAGE } from '@/lib/contactValidator';
import { v4 as uuidv4 } from 'uuid';

// Admin can edit everything the supplier entered except their own contact details
// (contactName/email/phone stay supplier-managed — the account is theirs).
const EDITABLE_FIELDS = [
  'companyName', 'country', 'products', 'annualVolume', 'description',
  'elevatorName', 'loadingStation', 'letterheadBase64', 'letterheadFileName',
  'productDetails', 'published',
] as const;

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const ok = await db.suppliers.delete(params.id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

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

  const { passwordHash: _ph, inviteToken: _it, ...safeUpdated } = updated;
  return NextResponse.json(safeUpdated);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const patch: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) patch[field] = body[field];
  }

  if (patch.companyName === '' || patch.annualVolume === '') {
    return NextResponse.json({ error: 'companyName и annualVolume не могут быть пустыми' }, { status: 400 });
  }
  if ('products' in patch && (!Array.isArray(patch.products) || patch.products.length === 0)) {
    return NextResponse.json({ error: 'Выберите хотя бы один продукт' }, { status: 400 });
  }
  if (patch.productDetails) {
    for (const detail of Object.values(patch.productDetails as Record<string, ProductDetail>)) {
      if (detail.characteristics && containsContactInfo(detail.characteristics)) {
        return NextResponse.json({ error: CONTACT_BLOCK_MESSAGE }, { status: 422 });
      }
    }
  }

  const updated = await db.suppliers.update(params.id, patch);
  if (!updated) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
  const { passwordHash: _ph, inviteToken: _it, ...safeUpdated } = updated;
  return NextResponse.json(safeUpdated);
}
