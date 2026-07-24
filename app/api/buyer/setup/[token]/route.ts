import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const buyer = await db.buyers.findByInviteToken(token);
  if (!buyer) return NextResponse.json({ error: 'Ссылка недействительна или устарела' }, { status: 404 });
  return NextResponse.json({ companyName: buyer.companyName, email: buyer.email });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { password } = await req.json();

  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Пароль должен содержать не менее 8 символов' }, { status: 400 });
  }

  const buyer = await db.buyers.findByInviteToken(token);
  if (!buyer) return NextResponse.json({ error: 'Ссылка недействительна или устарела' }, { status: 404 });

  const passwordHash = await bcrypt.hash(password, 10);
  await db.buyers.setPassword(buyer.id, passwordHash);

  return NextResponse.json({ ok: true });
}
