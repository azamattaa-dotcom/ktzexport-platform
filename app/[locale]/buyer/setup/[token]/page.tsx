'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BuyerSetupPage() {
  const { token, locale } = useParams() as { token: string; locale: string };
  const router = useRouter();
  const [info, setInfo] = useState<{ companyName: string; email: string } | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/buyer/setup/${token}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setInfo(d); else setInvalid(true); })
      .catch(() => setInvalid(true));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Пароль должен содержать не менее 8 символов'); return; }
    if (password !== confirm) { setError('Пароли не совпадают'); return; }
    setLoading(true);
    const res = await fetch(`/api/buyer/setup/${token}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push(`/${locale}/buyer/login`), 2000);
    } else {
      const d = await res.json();
      setError(d.error || 'Ошибка. Попробуйте ещё раз.');
    }
  }

  if (invalid) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center max-w-md w-full">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Ссылка недействительна</h1>
        <p className="text-gray-500 text-sm">Ссылка устарела или уже была использована.</p>
        <Link href={`/${locale}/buyer/login`} className="mt-6 inline-block text-primary-700 font-medium hover:underline text-sm">
          Войти в кабинет →
        </Link>
      </div>
    </div>
  );

  if (!info) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400 text-sm">Загрузка...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">🔐</div>
          <h1 className="text-xl font-bold text-gray-900">Установите пароль</h1>
          <p className="text-sm text-gray-500 mt-1">{info.companyName} · {info.email}</p>
        </div>

        {done ? (
          <div className="text-center text-green-600 font-medium py-4">
            ✅ Пароль установлен. Перенаправление...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                minLength={8} required placeholder="Минимум 8 символов"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Подтвердите пароль</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                required placeholder="Повторите пароль"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-medium py-3 rounded-xl text-sm transition-colors">
              {loading ? 'Сохранение...' : 'Установить пароль'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
