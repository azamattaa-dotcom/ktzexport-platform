import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { chatDb } from '@/lib/chat';

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { threadId, content } = await req.json();
  if (!threadId || !content?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const thread = await chatDb.addAdminMessage(threadId, content);
  if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 });

  return NextResponse.json({ ok: true });
}
