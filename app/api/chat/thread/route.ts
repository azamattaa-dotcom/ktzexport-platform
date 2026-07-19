import { NextRequest, NextResponse } from 'next/server';
import { chatDb } from '@/lib/chat';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const supplierId = searchParams.get('supplierId');
  const productId = searchParams.get('productId');
  const email = searchParams.get('email');

  if (!supplierId || !productId || !email) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const thread = await chatDb.getThread(supplierId, productId, email);
  return NextResponse.json({ messages: thread?.messages ?? [] });
}
