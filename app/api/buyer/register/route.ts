import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifyAdminNewBuyer } from '@/lib/email';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    companyName, country, registrationNumber,
    legalAddress, postalAddress,
    signatoryName, signatoryType, signatoryCustomType,
    contactName, email, phone, website, description,
    bankName, swift, bankAccount, bankCurrency,
    unloadingRegion,
    charterDoc, registrationDoc, passportDoc,
  } = body;

  const required: [string, string][] = [
    [companyName, 'companyName'], [country, 'country'],
    [registrationNumber, 'registrationNumber'],
    [legalAddress, 'legalAddress'], [postalAddress, 'postalAddress'],
    [signatoryName, 'signatoryName'], [signatoryType, 'signatoryType'],
    [contactName, 'contactName'], [email, 'email'], [phone, 'phone'],
    [bankName, 'bankName'], [swift, 'swift'],
    [bankAccount, 'bankAccount'], [bankCurrency, 'bankCurrency'],
    [unloadingRegion, 'unloadingRegion'],
  ];

  for (const [val, field] of required) {
    if (!val?.trim()) {
      return NextResponse.json({ error: `Поле «${field}» обязательно для заполнения` }, { status: 400 });
    }
  }

  if (signatoryType === 'other' && !signatoryCustomType?.trim()) {
    return NextResponse.json({ error: 'Укажите должность подписанта' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Некорректный email' }, { status: 400 });
  }

  if (!charterDoc || !registrationDoc || !passportDoc) {
    return NextResponse.json({ error: 'Необходимо загрузить все три документа' }, { status: 400 });
  }

  for (const doc of [charterDoc, registrationDoc, passportDoc]) {
    const sizeBytes = Math.ceil((doc.base64.length * 3) / 4);
    if (sizeBytes > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `Файл ${doc.fileName} превышает 5 МБ` }, { status: 400 });
    }
  }

  const existing = await db.buyers.findByEmail(email.toLowerCase());
  if (existing) {
    return NextResponse.json({ error: 'Покупатель с таким email уже зарегистрирован' }, { status: 409 });
  }

  const buyer = await db.buyers.create({
    companyName: companyName.trim(),
    country: country.trim(),
    registrationNumber: registrationNumber.trim(),
    legalAddress: legalAddress.trim(),
    postalAddress: postalAddress.trim(),
    signatoryName: signatoryName.trim(),
    signatoryType: signatoryType.trim(),
    signatoryCustomType: signatoryCustomType?.trim(),
    contactName: contactName.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    website: website?.trim(),
    description: description?.trim(),
    bankName: bankName.trim(),
    swift: swift.trim(),
    bankAccount: bankAccount.trim(),
    bankCurrency: bankCurrency.trim(),
    unloadingRegion: unloadingRegion.trim(),
    charterDoc,
    registrationDoc,
    passportDoc,
  });

  await notifyAdminNewBuyer(buyer).catch(console.error);

  return NextResponse.json({ ok: true, id: buyer.id });
}
