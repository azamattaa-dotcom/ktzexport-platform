import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signBuyerToken, BUYER_COOKIE } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const SUPPLIER_COOKIE = 'ktz_supplier_token';
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'fallback-secret');

async function signSupplierToken(supplierId: string): Promise<string> {
  return new SignJWT({ supplierId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(secret);
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Введите email и пароль' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const [supplier, buyer] = await Promise.all([
    db.suppliers.findByEmail(normalizedEmail),
    db.buyers.findByEmail(normalizedEmail),
  ]);

  const [supplierOk, buyerOk] = await Promise.all([
    supplier && supplier.status === 'approved' && supplier.passwordHash
      ? bcrypt.compare(password, supplier.passwordHash)
      : Promise.resolve(false),
    buyer && buyer.status === 'approved' && buyer.passwordHash
      ? bcrypt.compare(password, buyer.passwordHash)
      : Promise.resolve(false),
  ]);

  if (supplierOk && buyerOk) {
    return NextResponse.json({ ambiguous: true });
  }

  if (supplierOk && supplier) {
    const token = await signSupplierToken(supplier.id);
    const res = NextResponse.json({ role: 'supplier' });
    res.cookies.set(SUPPLIER_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8,
      path: '/',
    });
    return res;
  }

  if (buyerOk && buyer) {
    const token = await signBuyerToken(buyer.id);
    const res = NextResponse.json({ role: 'buyer' });
    res.cookies.set(BUYER_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8,
      path: '/',
    });
    return res;
  }

  await new Promise((r) => setTimeout(r, 500));
  return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
}
