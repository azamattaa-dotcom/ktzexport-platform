'use client';
import { useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const t = useTranslations('login');
  const router = useRouter();
  const { locale } = useParams() as { locale: string };
  const searchParams = useSearchParams();
  const setupSuccess = searchParams.get('setup') === 'success';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ambiguous, setAmbiguous] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await res.json();

    if (res.ok && d.role === 'supplier') {
      router.push(`/${locale}/supplier/dashboard`);
      return;
    }
    if (res.ok && d.role === 'buyer') {
      router.push(`/${locale}/buyer/dashboard`);
      return;
    }
    if (res.ok && d.ambiguous) {
      setAmbiguous(true);
      setLoading(false);
      return;
    }
    setLoading(false);
    setError(d.error || t('errorDefault'));
  }

  async function chooseRole(role: 'supplier' | 'buyer') {
    setLoading(true);
    setError('');
    const res = await fetch(`/api/${role}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push(`/${locale}/${role}/dashboard`);
    } else {
      setLoading(false);
      setError(t('errorDefault'));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <Link href={`/${locale}`} className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">KTZ</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">KTZ Export</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-gray-500 text-sm mt-1">{t('subtitle')}</p>
            </div>

            {setupSuccess && (
              <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                {t('setupSuccess')}
              </p>
            )}

            {!ambiguous ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                  <input required type="email" value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
                  <input required type="password" value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                  {loading ? t('submitting') : t('submit')}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">{t('chooseRoleDesc')}</p>
                <button onClick={() => chooseRole('supplier')} disabled={loading}
                  className="w-full bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                  {t('continueAsSupplier')}
                </button>
                <button onClick={() => chooseRole('buyer')} disabled={loading}
                  className="w-full border border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary-700 font-medium py-2.5 rounded-xl text-sm transition-colors">
                  {t('continueAsBuyer')}
                </button>
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>
            )}

            <div className="border-t border-gray-100 pt-4 text-center text-sm">
              <p className="text-gray-500">
                {t('noAccount')}{' '}
                <Link href={`/${locale}/suppliers/register`} className="text-primary-700 font-medium hover:underline">
                  {t('registerAsSupplier')}
                </Link>
                {' · '}
                <Link href={`/${locale}/buyer/register`} className="text-primary-700 font-medium hover:underline">
                  {t('registerAsBuyer')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
