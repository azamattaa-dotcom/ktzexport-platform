import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { getAuthenticatedSupplierId } from '@/lib/auth';

async function getSupplierFromCookie() {
  const id = await getAuthenticatedSupplierId();
  return id ? db.suppliers.findById(id) : null;
}

export async function POST(req: NextRequest) {
  const supplier = await getSupplierFromCookie();
  if (!supplier) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!supplier.passwordHash) {
    return NextResponse.json({ error: 'No password set yet' }, { status: 400 });
  }
  const valid = await bcrypt.compare(currentPassword, supplier.passwordHash);
  if (!valid) {
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: 'Wrong current password' }, { status: 401 });
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await db.suppliers.setPassword(supplier.id, newHash);

  return NextResponse.json({ ok: true });
}
