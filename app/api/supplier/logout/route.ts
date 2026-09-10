import { NextResponse } from 'next/server';
import { SUPPLIER_COOKIE } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SUPPLIER_COOKIE, '', { maxAge: 0, path: '/' });
  return response;
}
