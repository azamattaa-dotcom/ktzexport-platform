import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db, ProductDetail } from '@/lib/db';
import { cookies } from 'next/headers';
import { containsContactInfo, CONTACT_BLOCK_MESSAGE } from '@/lib/contactValidator';

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'fallback-secret');

async function getSupplierFromCookie() {
  const token = cookies().get('ktz_supplier_token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return db.suppliers.findById(payload.supplierId as string);
  } catch {
    return null;
  }
}

export async function GET() {
  const supplier = await getSupplierFromCookie();
  if (!supplier) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { passwordHash, inviteToken, ...safe } = supplier;
  return NextResponse.json(safe);
}

export async function PATCH(req: NextRequest) {
  const supplier = await getSupplierFromCookie();
  if (!supplier) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { productDetails } = await req.json() as { productDetails: Record<string, ProductDetail> };

    for (const detail of Object.values(productDetails)) {
      if (detail.characteristics && containsContactInfo(detail.characteristics)) {
        return NextResponse.json({ error: CONTACT_BLOCK_MESSAGE }, { status: 422 });
      }
    }

    const updated = await db.suppliers.updateProductDetails(supplier.id, productDetails);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const { passwordHash, inviteToken, ...safe } = updated;
    return NextResponse.json(safe);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
