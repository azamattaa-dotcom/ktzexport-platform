import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyName, country, contactName, email, phone, products, annualVolume, description } = body;

    // Validation
    if (!companyName || !country || !contactName || !email || !phone || !products?.length || !annualVolume) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check for duplicate email
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
      description: description?.trim() || '',
    });

    return NextResponse.json({ success: true, id: supplier.id }, { status: 201 });
  } catch (error) {
    console.error('Supplier registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
