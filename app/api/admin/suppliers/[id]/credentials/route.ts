import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { isAdminAuthenticated, generatePassword } from '@/lib/auth';
import { sendSupplierCredentials } from '@/lib/email';

// Admin action for suppliers that already exist (created before instant-credential
// registration existed, or whose password was lost) — generates a fresh password
// and emails it, same template as self-registration.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supplier = await db.suppliers.findById(params.id);
  if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 10);

  const updated = await db.suppliers.update(params.id, {
    passwordHash,
    status: 'approved',
    inviteToken: undefined,
  });
  if (!updated) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

  await sendSupplierCredentials({
    companyName: updated.companyName,
    email: updated.email,
    password,
  });

  return NextResponse.json({ ok: true, email: updated.email });
}
