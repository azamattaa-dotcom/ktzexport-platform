import { NextRequest, NextResponse } from 'next/server';
import { logisticsDb } from '@/lib/logistics';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'fallback-secret');

async function getSupplierFromToken() {
  const token = cookies().get('ktz_supplier_token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return db.suppliers.findById(payload.supplierId as string);
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest) {
  const supplier = await getSupplierFromToken();
  if (!supplier) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const requests = await logisticsDb.findApprovedForSupplier(supplier.id);
  return NextResponse.json({ requests });
}
