import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'fallback-secret');

async function getSupplierFromCookie() {
  const token = cookies().get('ktz_supplier_token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return db.suppliers.findById(payload.supplierId as string);
  } catch {
    return null;
  }
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
