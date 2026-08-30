import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const suppliers = await db.suppliers.findByStatus('approved');
  const list = suppliers
    .filter((s) => s.published)
    .map((s) => ({ id: s.id, companyName: s.companyName }));
  return NextResponse.json({ suppliers: list });
}
