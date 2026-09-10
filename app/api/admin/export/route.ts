import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatDb } from '@/lib/chat';
import { chatLeads } from '@/lib/chat-leads';
import { logisticsDb } from '@/lib/logistics';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [suppliers, buyers, chatThreads, leads, logisticsRequests] = await Promise.all([
    db.suppliers.findAll(),
    db.buyers.findAll(),
    chatDb.getAllThreads(),
    chatLeads.findAll(),
    logisticsDb.findAll(),
  ]);

  const dump = {
    exportedAt: new Date().toISOString(),
    suppliers,
    buyers,
    chatThreads,
    chatLeads: leads,
    logisticsRequests,
  };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(dump, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="ktz-backup-${date}.json"`,
    },
  });
}
