'use client';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authRole, setAuthRole] = useState<'supplier' | 'buyer'>('supplier');
  const authRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (authRef.current && !authRef.current.contains(e.target as Node)) {
        setAuthOpen(false);
      }
    }
    if (authOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [authOpen]);

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">KTZ</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">KTZ Export</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href={`/${locale}#products`} className="text-gray-600 hover:text-primary-700 text-sm font-medium transition-colors">
              {t('products')}
            </Link>
            <Link href={`/${locale}#how-it-works`} className="text-gray-600 hover:text-primary-700 text-sm font-medium transition-colors">
              {t('forBuyers')}
            </Link>
            <Link href={`/${locale}/logistics`} className="text-gray-600 hover:text-primary-700 text-sm font-medium transition-colors">
              {t('logistics')}
            </Link>
            <Link href={`/${locale}/suppliers/register`} className="text-gray-600 hover:text-primary-700 text-sm font-medium transition-colors">
              {t('forSellers')}
            </Link>
          </nav>

          {/* Right: lang + auth dropdown */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />

            {/* Auth dropdown */}
            <div className="relative" ref={authRef}>
              <button
                onClick={() => setAuthOpen(!authOpen)}
                className="flex items-center gap-1.5 border border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {t('loginCabinet')}
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${authOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {authOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  {/* Role tabs */}
                  <div className="flex border-b border-gray-100">
                    <button
                      onClick={() => setAuthRole('supplier')}
                      className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                        authRole === 'supplier'
                          ? 'text-primary-700 border-primary-600'
                          : 'text-gray-500 hover:text-gray-700 border-transparent'
                      }`}
                    >
                      {t('roleSupplier')}
                    </button>
                    <button
                      onClick={() => setAuthRole('buyer')}
                      className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                        authRole === 'buyer'
                          ? 'text-primary-700 border-primary-600'
                          : 'text-gray-500 hover:text-gray-700 border-transparent'
                      }`}
                    >
                      {t('roleBuyer')}
                    </button>
                  </div>

                  {/* Tab content */}
                  <div className="p-4 space-y-2">
                    {authRole === 'supplier' ? (
                      <>
                        <Link
                          href={`/${locale}/supplier/login`}
                          onClick={() => setAuthOpen(false)}
                          className="flex items-center gap-2 w-full border border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                        >
                          → {t('login')}
                        </Link>
                        <Link
                          href={`/${locale}/suppliers/register`}
                          onClick={() => setAuthOpen(false)}
                          className="flex items-center gap-2 w-full bg-primary-700 hover:bg-primary-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                        >
                          + {t('registerSupplier')}
                        </Link>
                      </>
                    ) : (
                      <Link
                        href={`/${locale}/buyer/login`}
                        onClick={() => setAuthOpen(false)}
                        className="flex items-center gap-2 w-full bg-primary-700 hover:bg-primary-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      >
                        → {t('login')} / {t('register')}
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 space-y-3">
            <Link href={`/${locale}#products`} onClick={() => setMenuOpen(false)} className="block text-gray-700 font-medium py-1">{t('products')}</Link>
            <Link href={`/${locale}#how-it-works`} onClick={() => setMenuOpen(false)} className="block text-gray-700 font-medium py-1">{t('forBuyers')}</Link>
            <Link href={`/${locale}/logistics`} onClick={() => setMenuOpen(false)} className="block text-gray-700 font-medium py-1">{t('logistics')}</Link>
            <Link href={`/${locale}/suppliers/register`} onClick={() => setMenuOpen(false)} className="block text-gray-700 font-medium py-1">{t('forSellers')}</Link>
            <div className="pt-2">
              <LanguageSwitcher />
            </div>
            {/* Mobile role sections */}
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('roleSupplier')}</p>
              <Link href={`/${locale}/supplier/login`} onClick={() => setMenuOpen(false)}
                className="block border border-gray-200 text-gray-700 text-center px-4 py-2 rounded-lg text-sm font-medium">
                {t('login')}
              </Link>
              <Link href={`/${locale}/suppliers/register`} onClick={() => setMenuOpen(false)}
                className="block bg-primary-700 text-white text-center px-4 py-2 rounded-lg text-sm font-medium">
                {t('registerSupplier')}
              </Link>
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('roleBuyer')}</p>
              <Link href={`/${locale}/buyer/login`} onClick={() => setMenuOpen(false)}
                className="block border border-gray-200 text-gray-700 text-center px-4 py-2 rounded-lg text-sm font-medium">
                {t('login')} / {t('register')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
