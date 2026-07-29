'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BRAND_MARK } from '@/lib/brand';

export default function SupplierSetupPage() {
  const t = useTranslations('supplierSetup');
  const { token, locale } = useParams() as { token: string; locale: string };
  const router = useRouter();

  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`/api/supplier/setup?token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) {
          setCompanyName(d.companyName);
          setEmail(d.email);
          setTokenValid(true);
        } else {
          setTokenValid(false);
        }
      })
      .catch(() => setTokenValid(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError(t('passwordTooShort')); return; }
    if (password !== confirm)  { setError(t('passwordMismatch')); return; }
    setError('');
    setLoading(true);

    const res = await fetch('/api/supplier/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    if (res.ok) {
      router.push(`/${locale}/supplier/login?setup=success`);
    } else {
      const d = await res.json();
      setError(d.error ?? t('errorDefault'));
      setLoading(false);
    }
  }

  if (tokenValid === null) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">{t('checkingLink')}</div>;
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">⛔</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t('invalidLinkTitle')}</h1>
          <p className="text-gray-500 text-sm">{t('invalidLinkDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-700 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold">{BRAND_MARK}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{companyName}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('emailLabel')}</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('passwordLabel')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('confirmPasswordLabel')}</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-700 hover:bg-primary-800 disabled:bg-primary-400 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? t('saving') : t('submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
