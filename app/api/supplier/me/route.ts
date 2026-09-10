import { NextRequest, NextResponse } from 'next/server';
import { db, ProductDetail } from '@/lib/db';
import { getAuthenticatedSupplierId } from '@/lib/auth';
import { containsContactInfo, CONTACT_BLOCK_MESSAGE } from '@/lib/contactValidator';
import { validateCertificateDataUri } from '@/lib/validation';
import { uploadDataUri, deleteBlobUrl } from '@/lib/storage';

async function getSupplierFromCookie() {
  const id = await getAuthenticatedSupplierId();
  return id ? db.suppliers.findById(id) : null;
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
    const { productDetails } = await req.json() as { productDetails: Record<string, ProductDetail & { certificateBase64?: string }> };

    for (const [productId, detail] of Object.entries(productDetails)) {
      if (detail.characteristics && containsContactInfo(detail.characteristics)) {
        return NextResponse.json({ error: CONTACT_BLOCK_MESSAGE }, { status: 422 });
      }
      if (detail.certificateBase64) {
        const certError = validateCertificateDataUri(detail.certificateBase64);
        if (certError) return NextResponse.json({ error: certError }, { status: 400 });
        const oldUrl = supplier.productDetails?.[productId]?.certificateUrl;
        detail.certificateUrl = await uploadDataUri(detail.certificateBase64, `suppliers/${supplier.email}/certificates/${productId}`);
        delete detail.certificateBase64;
        if (oldUrl) await deleteBlobUrl(oldUrl);
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
