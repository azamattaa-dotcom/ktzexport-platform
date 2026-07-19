const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAIL ?? 'azamattaa@gmail.com';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ktzexport-platform.vercel.app';

async function send(to: string, subject: string, text: string) {
  if (!RESEND_API_KEY) {
    console.log('[email] No RESEND_API_KEY — skipping email to', to);
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'KTZ Export <onboarding@resend.dev>', to: [to], subject, text }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[email] Resend error:', res.status, err);
    } else {
      console.log('[email] Sent to', to);
    }
  } catch (e) {
    console.error('[email] Failed to send:', e);
  }
}

export async function notifyAdminNewSupplier(supplier: {
  companyName: string; country: string; contactName: string;
  email: string; phone: string; products: string[]; elevatorName: string;
}) {
  const body = `Новая заявка поставщика на KTZ Export:

Компания: ${supplier.companyName}
Страна: ${supplier.country}
Элеватор/склад: ${supplier.elevatorName}
Контакт: ${supplier.contactName}
Email: ${supplier.email}
Телефон: ${supplier.phone}
Продукция: ${supplier.products.join(', ')}

Одобрить или отклонить: ${SITE_URL}/ru/admin`;

  await send(NOTIFICATION_EMAIL, `Новая заявка: ${supplier.companyName}`, body);
}

const PRODUCT_LABELS_RU: Record<string, string> = {
  flour_feed: 'Кормовая мука', flour_wheat: 'Пшеничная мука', wheat: 'Пшеница',
  barley: 'Ячмень', bran: 'Пшеничные отруби', flaxseed: 'Семена льна',
  sunflower: 'Семена подсолнечника', corn: 'Кукуруза',
};

export async function sendBuyerRequest(params: {
  supplierCompany: string;
  productId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  volume?: string;
  message?: string;
}) {
  const product = PRODUCT_LABELS_RU[params.productId] ?? params.productId;
  const body = `Новый запрос покупателя на KTZ Export

Поставщик: ${params.supplierCompany}
Товар: ${product}

Покупатель:
Имя: ${params.buyerName}
Email: ${params.buyerEmail}
Телефон: ${params.buyerPhone || 'не указан'}
Интересующий объём: ${params.volume || 'не указан'}
Сообщение: ${params.message || '—'}

Ответить покупателю: ${params.buyerEmail}`;

  await send(NOTIFICATION_EMAIL, `Запрос покупателя — ${product} (${params.supplierCompany})`, body);
}

export async function sendSupplierInvite(supplier: {
  companyName: string; email: string; inviteToken: string;
}) {
  const setupUrl = `${SITE_URL}/ru/supplier/setup/${supplier.inviteToken}`;
  const body = `Уважаемый партнёр, ${supplier.companyName}!

Ваша заявка на платформе KTZ Export одобрена.

Для создания личного кабинета перейдите по ссылке и установите пароль:
${setupUrl}

Ссылка действительна 7 дней.

С уважением,
Команда KTZ Export
info@ktzexport.com`;

  await send(supplier.email, 'Заявка одобрена — KTZ Export', body);
}
