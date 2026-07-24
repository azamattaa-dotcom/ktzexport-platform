import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signBuyerToken, BUYER_COOKIE } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Введите email и пароль' }, { status: 400 });
  }

  const buyer = await db.buyers.findByEmail(email.toLowerCase());
  if (!buyer || buyer.status !== 'approved' || !buyer.passwordHash) {
    return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, buyer.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
  }

  const token = await signBuyerToken(buyer.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(BUYER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8,
    path: '/',
  });
  return res;
}
