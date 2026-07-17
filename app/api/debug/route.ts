import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const suppliers = await db.suppliers.findAll();

  const summary = suppliers.map((s) => ({
    id: s.id,
    companyName: s.companyName,
    email: s.email,
    status: s.status,
    products: s.products,
    hasProductDetails: !!s.productDetails,
    productDetails: s.productDetails,
    createdAt: s.createdAt,
  }));

  return NextResponse.json({
    total: suppliers.length,
    approved: suppliers.filter((s) => s.status === 'approved').length,
    suppliers: summary,
  });
}
