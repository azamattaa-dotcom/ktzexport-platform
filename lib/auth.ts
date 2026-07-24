import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'ktzexport-fallback-secret'
);
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

export { COOKIE_NAME, BUYER_COOKIE };
