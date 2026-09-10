import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signSupplierToken, SUPPLIER_COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const supplier = await db.suppliers.findByEmail(email.trim().toLowerCase());
    if (!supplier || !supplier.passwordHash || supplier.status !== 'approved') {
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, supplier.passwordHash);
    if (!valid) {
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signSupplierToken(supplier.id);

    const response = NextResponse.json({ success: true });
    response.cookies.set(SUPPLIER_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8,
      path: '/',
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
