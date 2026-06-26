import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const suppliers = await db.suppliers.findAll();
  return NextResponse.json(suppliers);
}
