import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifyAdminNewSupplier } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyName, country, contactName, email, phone,
      products, annualVolume, elevatorName, description,
      letterheadBase64, letterheadFileName,
    } = body;

    if (!companyName || !country || !contactName || !email || !phone || !products?.length || !annualVolume) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const existing = await db.suppliers.findByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'A supplier with this email already exists' }, { status: 409 });
    }

    const supplier = await db.suppliers.create({
      companyName: companyName.trim(),
      country: country.trim(),
      contactName: contactName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      products,
      annualVolume,
      elevatorName: elevatorName?.trim() ?? '',
      description: description?.trim() ?? '',
      letterheadBase64: letterheadBase64 ?? undefined,
      letterheadFileName: letterheadFileName ?? undefined,
    });

    await notifyAdminNewSupplier({
      companyName: supplier.companyName,
      country: supplier.country,
      contactName: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone,
      products: supplier.products,
      elevatorName: supplier.elevatorName,
    });

    return NextResponse.json({ success: true, id: supplier.id }, { status: 201 });
  } catch (error) {
    console.error('Supplier registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
