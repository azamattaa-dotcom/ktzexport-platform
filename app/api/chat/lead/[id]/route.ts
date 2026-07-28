import { NextRequest, NextResponse } from 'next/server';
import { chatLeads } from '@/lib/chat-leads';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const lead = await chatLeads.findById(params.id);
  if (!lead) return NextResponse.json({ messages: [], status: 'unknown' });
  return NextResponse.json({ messages: lead.messages, status: lead.status });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

  const lead = await chatLeads.addMessage(params.id, 'visitor', content.trim());
  if (!lead) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  return NextResponse.json({ ok: true });
}
