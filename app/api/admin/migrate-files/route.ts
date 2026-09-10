import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';
import { uploadDataUri } from '@/lib/storage';

interface MigrationResult {
  suppliersMigrated: number;
  productCertificatesMigrated: number;
  buyersMigrated: number;
  errors: string[];
}

// Idempotent: only touches records that still have the old base64 field and
// no new *Url field yet, so it's safe to run more than once (e.g. after
// registering new suppliers) or to re-run after a partial failure.
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result: MigrationResult = {
    suppliersMigrated: 0,
    productCertificatesMigrated: 0,
    buyersMigrated: 0,
    errors: [],
  };

  const suppliers = await db.suppliers.findAll();
  for (const supplier of suppliers) {
    const patch: Record<string, unknown> = {};
    let changed = false;

    if (supplier.letterheadBase64 && !supplier.letterheadUrl) {
      try {
        patch.letterheadUrl = await uploadDataUri(supplier.letterheadBase64, `suppliers/${supplier.email}/letterhead`);
        patch.letterheadBase64 = undefined;
        changed = true;
      } catch (e) {
        result.errors.push(`${supplier.companyName} (${supplier.id}): товарный знак — ${(e as Error).message}`);
      }
    }

    if (supplier.productDetails) {
      const newDetails = { ...supplier.productDetails };
      let detailsChanged = false;
      for (const [productId, detail] of Object.entries(newDetails)) {
        if (detail.certificateBase64 && !detail.certificateUrl) {
          try {
            const url = await uploadDataUri(detail.certificateBase64, `suppliers/${supplier.email}/certificates/${productId}`);
            newDetails[productId] = { ...detail, certificateUrl: url, certificateBase64: undefined };
            detailsChanged = true;
            result.productCertificatesMigrated++;
          } catch (e) {
            result.errors.push(`${supplier.companyName} (${supplier.id}): сертификат ${productId} — ${(e as Error).message}`);
          }
        }
      }
      if (detailsChanged) {
        patch.productDetails = newDetails;
        changed = true;
      }
    }

    if (changed) {
      await db.suppliers.update(supplier.id, patch);
      if (patch.letterheadUrl) result.suppliersMigrated++;
    }
  }

  const buyers = await db.buyers.findAll();
  for (const buyer of buyers) {
    const patch: Record<string, unknown> = {};
    let changed = false;

    for (const field of ['charterDoc', 'registrationDoc', 'passportDoc'] as const) {
      const doc = buyer[field];
      if (doc?.base64 && !doc.url) {
        try {
          const url = await uploadDataUri(doc.base64, `buyers/${buyer.email}/${field}`);
          patch[field] = { url, fileName: doc.fileName, fileType: doc.fileType };
          changed = true;
        } catch (e) {
          result.errors.push(`${buyer.companyName} (${buyer.id}): ${field} — ${(e as Error).message}`);
        }
      }
    }

    if (changed) {
      await db.buyers.update(buyer.id, patch);
      result.buyersMigrated++;
    }
  }

  return NextResponse.json(result);
}
