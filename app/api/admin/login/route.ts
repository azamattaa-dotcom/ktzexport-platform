import { NextRequest, NextResponse } from 'next/server';
import { validateAdminCredentials, signAdminToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    if (!validateAdminCredentials(email, password)) {
      // Delay to prevent brute-force
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signAdminToken();

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
