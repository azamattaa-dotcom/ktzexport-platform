import { NextRequest, NextResponse } from 'next/server';
import { logisticsDb } from '@/lib/logistics';
import { getAuthenticatedSupplierId } from '@/lib/auth';
import { db } from '@/lib/db';

async function getSupplierFromToken() {
  const id = await getAuthenticatedSupplierId();
  return id ? db.suppliers.findById(id) : null;
}

export async function GET(_req: NextRequest) {
  const supplier = await getSupplierFromToken();
  if (!supplier) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const requests = await logisticsDb.findApprovedForSupplier(supplier.id);
  return NextResponse.json({ requests });
}
