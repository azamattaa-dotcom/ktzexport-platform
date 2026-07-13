import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ valid: false });

  const supplier = await db.suppliers.findByInviteToken(token);
  if (!supplier) return NextResponse.json({ valid: false });

  return NextResponse.json({ valid: true, companyName: supplier.companyName, email: supplier.email });
}

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const supplier = await db.suppliers.findByInviteToken(token);
  if (!supplier) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });

  const passwordHash = await bcrypt.hash(password, 10);
  await db.suppliers.setPassword(supplier.id, passwordHash);

  return NextResponse.json({ success: true });
}
