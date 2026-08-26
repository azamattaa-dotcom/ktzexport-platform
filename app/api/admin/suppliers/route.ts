import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { containsContactInfo, CONTACT_BLOCK_MESSAGE } from '@/lib/contactValidator';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const suppliers = await db.suppliers.findAll();
  const safe = suppliers.map(({ passwordHash, inviteToken, ...s }) => s);
  return NextResponse.json(safe);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { companyName, country, contactName, email, phone, products, annualVolume, description, elevatorName, loadingStation, password } = body;

  if (!companyName || !contactName || !email || !phone || !password || password.length < 8) {
    return NextResponse.json({ error: 'Заполните все обязательные поля. Пароль — не менее 8 символов.' }, { status: 400 });
  }
  if (!Array.isArray(products) || products.length === 0) {
    return NextResponse.json({ error: 'Выберите хотя бы один продукт.' }, { status: 400 });
  }
  if (description && containsContactInfo(description)) {
    return NextResponse.json({ error: CONTACT_BLOCK_MESSAGE }, { status: 422 });
  }

  const existing = await db.suppliers.findByEmail(email);
  if (existing) {
    return NextResponse.json({ error: 'Email уже зарегистрирован.' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const supplier = await db.suppliers.create(
    {
      companyName,
      country: country || 'Казахстан',
      contactName,
      email,
      phone,
      products,
      annualVolume: annualVolume || '',
      description: description || '',
      elevatorName: elevatorName || '',
      loadingStation: loadingStation || '',
    },
    { status: 'approved', published: true, passwordHash }
  );

  const { passwordHash: _ph, inviteToken: _it, ...safe } = supplier;
  return NextResponse.json(safe, { status: 201 });
}
