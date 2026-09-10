import { NextRequest, NextResponse } from 'next/server';
import { db, ProductDetail } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';
import { sendSupplierInvite } from '@/lib/email';
import { containsContactInfo, CONTACT_BLOCK_MESSAGE } from '@/lib/contactValidator';
import { validateImageDataUri, validateCertificateDataUri } from '@/lib/validation';
import { uploadDataUri, deleteBlobUrl } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

// Admin can edit everything the supplier entered, including their own contact details.
// letterheadBase64 is handled separately below — the client sends a data URI, but the
// stored field is letterheadUrl (the Blob URL it gets uploaded to).
const EDITABLE_FIELDS = [
  'companyName', 'country', 'contactName', 'email', 'phone',
  'products', 'annualVolume', 'description',
  'elevatorName', 'loadingStation', 'letterheadFileName',
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

  if (patch.companyName === '' || patch.annualVolume === '' || patch.contactName === '' || patch.email === '' || patch.phone === '') {
    return NextResponse.json({ error: 'Обязательные поля не могут быть пустыми' }, { status: 400 });
  }
  if (typeof patch.email === 'string' && patch.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patch.email)) {
    return NextResponse.json({ error: 'Некорректный email' }, { status: 400 });
  }
  if (typeof patch.email === 'string' && patch.email) {
    const existing = await db.suppliers.findByEmail(patch.email);
    if (existing && existing.id !== params.id) {
      return NextResponse.json({ error: 'Email уже зарегистрирован у другого поставщика' }, { status: 409 });
    }
  }
  if ('products' in patch && (!Array.isArray(patch.products) || patch.products.length === 0)) {
    return NextResponse.json({ error: 'Выберите хотя бы один продукт' }, { status: 400 });
  }
  if (typeof patch.description === 'string' && containsContactInfo(patch.description)) {
    return NextResponse.json({ error: CONTACT_BLOCK_MESSAGE }, { status: 422 });
  }

  const current = await db.suppliers.findById(params.id);
  if (!current) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

  // The edit form pre-fills this field with the existing logo (a URL, once migrated) so it
  // can redisplay it — only a `data:` value means the admin actually picked a new file.
  if ('letterheadBase64' in body) {
    const letterheadBase64 = body.letterheadBase64 as string;
    if (!letterheadBase64) {
      patch.letterheadUrl = undefined;
      if (current.letterheadUrl) await deleteBlobUrl(current.letterheadUrl);
    } else if (letterheadBase64.startsWith('data:')) {
      const logoError = validateImageDataUri(letterheadBase64);
      if (logoError) return NextResponse.json({ error: logoError }, { status: 400 });
      patch.letterheadUrl = await uploadDataUri(letterheadBase64, `suppliers/${current.email}/letterhead`);
      if (current.letterheadUrl) await deleteBlobUrl(current.letterheadUrl);
    }
    // else: unchanged existing URL echoed back by the form — leave letterheadUrl untouched
  }

  if (patch.productDetails) {
    const details = patch.productDetails as Record<string, ProductDetail & { certificateBase64?: string }>;
    for (const [productId, detail] of Object.entries(details)) {
      if (detail.characteristics && containsContactInfo(detail.characteristics)) {
        return NextResponse.json({ error: CONTACT_BLOCK_MESSAGE }, { status: 422 });
      }
      if (detail.certificateBase64) {
        const certError = validateCertificateDataUri(detail.certificateBase64);
        if (certError) return NextResponse.json({ error: certError }, { status: 400 });
        const oldUrl = current.productDetails?.[productId]?.certificateUrl;
        detail.certificateUrl = await uploadDataUri(detail.certificateBase64, `suppliers/${current.email}/certificates/${productId}`);
        delete detail.certificateBase64;
        if (oldUrl) await deleteBlobUrl(oldUrl);
      }
    }
  }

  const updated = await db.suppliers.update(params.id, patch);
  if (!updated) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
  const { passwordHash: _ph, inviteToken: _it, ...safeUpdated } = updated;
  return NextResponse.json(safeUpdated);
}
