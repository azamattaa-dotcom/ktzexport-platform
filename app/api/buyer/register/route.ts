import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifyAdminNewBuyer } from '@/lib/email';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per doc

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    companyName, country, registrationNumber, address,
    directorName, contactName, email, phone, website, description,
    charterDoc, registrationDoc, passportDoc,
  } = body;

  if (!companyName || !country || !registrationNumber || !address ||
      !directorName || !contactName || !email || !phone) {
    return NextResponse.json({ error: 'Заполните все обязательные поля' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Некорректный email' }, { status: 400 });
  }
  if (!charterDoc || !registrationDoc || !passportDoc) {
    return NextResponse.json({ error: 'Необходимо загрузить все три документа' }, { status: 400 });
  }

  // Check file sizes
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
    companyName, country, registrationNumber, address,
    directorName, contactName, email: email.toLowerCase(),
    phone, website, description,
    charterDoc, registrationDoc, passportDoc,
  });

  await notifyAdminNewBuyer(buyer).catch(console.error);

  return NextResponse.json({ ok: true, id: buyer.id });
}
