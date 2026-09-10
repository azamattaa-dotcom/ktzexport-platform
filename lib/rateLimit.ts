import { kv } from '@vercel/kv';

// Simple fixed-window counter on the existing Vercel KV store — no new
// dependency. Returns true while under the limit; the first hit in a window
// sets the TTL so the key self-expires instead of growing forever.
export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const count = await kv.incr(key);
  if (count === 1) {
    await kv.expire(key, windowSeconds);
  }
  return count <= limit;
}

export function clientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}
