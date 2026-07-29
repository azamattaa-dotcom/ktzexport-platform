import { NextResponse } from 'next/server';
import { logisticsConfig } from '@/lib/logistics-config';

// Must always read fresh from KV — admin edits should apply immediately,
// and this has no cookies()/auth call to otherwise force dynamic rendering.
export const dynamic = 'force-dynamic';

// Public, read-only — used by the buyer-facing logistics calculator.
export async function GET() {
  return NextResponse.json(await logisticsConfig.get());
}
