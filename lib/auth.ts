import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { randomInt } from 'crypto';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set — see .env.local.example');
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const COOKIE_NAME = 'ktz_admin_token';
const BUYER_COOKIE = 'ktz_buyer_token';
const TOKEN_EXPIRY = '8h';

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function getAdminToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const token = await getAdminToken();
  if (!token) return false;
  return verifyAdminToken(token);
}

// Excludes visually ambiguous characters (0/O, 1/l/I) so generated passwords are easy to retype.
const PASSWORD_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

export function generatePassword(length = 10): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)];
  }
  return out;
}

export function validateAdminCredentials(email: string, password: string): boolean {
  return (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  );
}

// ── Buyer auth ──────────────────────────────────────────────────────────────

export async function signBuyerToken(buyerId: string): Promise<string> {
  return new SignJWT({ role: 'buyer', sub: buyerId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyBuyerToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== 'buyer' || !payload.sub) return null;
    return { sub: payload.sub as string };
  } catch {
    return null;
  }
}

export async function getBuyerToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(BUYER_COOKIE)?.value;
}

export async function getAuthenticatedBuyerId(): Promise<string | null> {
  const token = await getBuyerToken();
  if (!token) return null;
  const payload = await verifyBuyerToken(token);
  return payload?.sub ?? null;
}

// ── Supplier auth ───────────────────────────────────────────────────────────

const SUPPLIER_COOKIE = 'ktz_supplier_token';

export async function signSupplierToken(supplierId: string): Promise<string> {
  return new SignJWT({ supplierId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function getSupplierToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SUPPLIER_COOKIE)?.value;
}

export async function getAuthenticatedSupplierId(): Promise<string | null> {
  const token = await getSupplierToken();
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return (payload.supplierId as string) ?? null;
  } catch {
    return null;
  }
}

export { COOKIE_NAME, BUYER_COOKIE, SUPPLIER_COOKIE };
