import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { logisticsDb } from '@/lib/logistics';
import { db } from '@/lib/db';
import { notifySupplierLogisticsRequestApproved } from '@/lib/email';

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, action, edits } = await req.json();
  if (!id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }

  const request = await logisticsDb.review(id, action, edits);
  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (action === 'approve' && request.supplierId) {
    const supplier = await db.suppliers.findById(request.supplierId);
    if (supplier) {
      await notifySupplierLogisticsRequestApproved({
        supplierEmail: supplier.email,
        supplierCompany: supplier.companyName,
        contactName: request.contactName,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
