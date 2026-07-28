import { NextRequest, NextResponse } from 'next/server';
import { chatLeads } from '@/lib/chat-leads';
import { notifyAdminNewChatLead } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { sessionId, intent, product, volume, contact } = await req.json();

  if (!sessionId || !contact?.trim() || !intent) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const existing = await chatLeads.findById(sessionId);
  if (existing) {
    return NextResponse.json({ ok: true, id: existing.id });
  }

  const lead = await chatLeads.create({
    id: sessionId,
    intent,
    product,
    volume,
    contact: contact.trim(),
  });

  await notifyAdminNewChatLead({ contact: lead.contact, intent, product, volume }).catch(console.error);

  return NextResponse.json({ ok: true, id: lead.id });
}
