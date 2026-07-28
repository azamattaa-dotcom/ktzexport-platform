import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { chatLeads } from '@/lib/chat-leads';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(await chatLeads.findAll());
}
