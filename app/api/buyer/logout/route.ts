import { NextResponse } from 'next/server';
import { BUYER_COOKIE } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(BUYER_COOKIE, '', { maxAge: 0, path: '/' });
  return res;
}
