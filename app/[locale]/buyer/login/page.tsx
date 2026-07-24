'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function BuyerLoginPage() {
  const router = useRouter();
  const { locale } = useParams() as { locale: string };
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/buyer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      router.push(`/${locale}/buyer/dashboard`);
    } else {
      const d = await res.json();
      setError(d.error || 'Неверный email или пароль');
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
              <h1 className="text-2xl font-bold text-gray-900">Кабинет покупателя</h1>
              <p className="text-gray-500 text-sm mt-1">Войдите в аккаунт верифицированного покупателя</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input required type="email" value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="buyer@company.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
                <input required type="password" value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                {loading ? 'Вход...' : 'Войти'}
              </button>
            </form>

            <div className="border-t border-gray-100 pt-4 space-y-2 text-center text-sm">
              <p className="text-gray-500">
                Нет аккаунта?{' '}
                <Link href={`/${locale}/buyer/register`} className="text-primary-700 font-medium hover:underline">
                  Зарегистрироваться →
                </Link>
              </p>
              <p className="text-gray-400 text-xs">
                Вы поставщик?{' '}
                <Link href={`/${locale}/supplier/login`} className="text-gray-500 hover:underline">
                  Войти как поставщик
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
