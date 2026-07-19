'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function BuyerLoginPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [form, setForm] = useState({ name: '', email: '' });
  const [loggedIn, setLoggedIn] = useState<{ name: string; email: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const email = localStorage.getItem('ktz_buyer_email');
    const name = localStorage.getItem('ktz_buyer_name') ?? '';
    if (email) setLoggedIn({ name, email });
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Введите имя'); return; }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Введите корректный email'); return;
    }
    localStorage.setItem('ktz_buyer_email', form.email.trim().toLowerCase());
    localStorage.setItem('ktz_buyer_name', form.name.trim());
    router.push(`/${locale}`);
  }

  function handleLogout() {
    localStorage.removeItem('ktz_buyer_email');
    localStorage.removeItem('ktz_buyer_name');
    setLoggedIn(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Simple header */}
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
          {loggedIn ? (
            /* Already logged in */
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto text-2xl">
                👤
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{loggedIn.name}</h1>
                <p className="text-gray-500 text-sm mt-1">{loggedIn.email}</p>
              </div>
              <p className="text-sm text-gray-500">Вы вошли как покупатель. Теперь вы можете писать поставщикам через чат на страницах продуктов.</p>
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href={`/${locale}/products`}
                  className="bg-primary-700 hover:bg-primary-800 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors"
                >
                  Перейти к продукции →
                </Link>
                <button
                  onClick={handleLogout}
                  className="border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors"
                >
                  Выйти из аккаунта
                </button>
              </div>
            </div>
          ) : (
            /* Login / Register form */
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Кабинет покупателя</h1>
                <p className="text-gray-500 text-sm mt-1">Войдите или зарегистрируйтесь, чтобы переписываться с поставщиками</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Имя / Компания</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Иван Иванов"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="email@company.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  type="submit"
                  className="w-full bg-primary-700 hover:bg-primary-800 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
                >
                  Войти / Зарегистрироваться →
                </button>
              </form>

              <p className="text-xs text-gray-400 text-center">
                Регистрация бесплатна. Email используется только для получения ответов от поставщиков.
              </p>

              <div className="border-t border-gray-100 pt-4 text-center">
                <p className="text-sm text-gray-500">
                  Вы поставщик?{' '}
                  <Link href={`/${locale}/supplier/login`} className="text-primary-700 font-medium hover:underline">
                    Войти в кабинет поставщика
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
