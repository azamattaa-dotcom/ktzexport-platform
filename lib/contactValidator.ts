const EMAIL_RE = /[\w.+\-]+@[\w\-]+\.[a-z]{2,}/i;
const PHONE_RE = /\+\d[\d\s\-()+.\/]{7,}|\b(?:8|7)[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/;

export function containsContactInfo(text: string): boolean {
  return EMAIL_RE.test(text) || PHONE_RE.test(text);
}

export const CONTACT_BLOCK_MESSAGE =
  'Контактные данные (email, телефон) в текстовых полях запрещены. ' +
  'Для связи с покупателями используйте систему сообщений платформы.';
