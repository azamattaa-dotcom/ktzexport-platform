'use client';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);

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

          {/* Right: lang + auth */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href={`/${locale}/supplier/login`}
              className="border border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {t('login')}
            </Link>
            <Link
              href={`/${locale}/suppliers/register`}
              className="bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-800 transition-colors"
            >
              {t('registerSupplier')}
            </Link>
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
            <Link href={`/${locale}#products`} className="block text-gray-700 font-medium py-1">{t('products')}</Link>
            <Link href={`/${locale}#how-it-works`} className="block text-gray-700 font-medium py-1">{t('forBuyers')}</Link>
            <Link href={`/${locale}/logistics`} className="block text-gray-700 font-medium py-1">{t('logistics')}</Link>
            <Link href={`/${locale}/suppliers/register`} className="block text-gray-700 font-medium py-1">{t('forSellers')}</Link>
            <Link href={`/${locale}/supplier/dashboard`} className="block text-gray-700 font-medium py-1">{t('cabinet')}</Link>
            <div className="pt-2">
              <LanguageSwitcher />
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <Link
                href={`/${locale}/supplier/login`}
                className="block text-center border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
              >
                {t('login')}
              </Link>
              <Link
                href={`/${locale}/suppliers/register`}
                className="block bg-primary-700 text-white text-center px-4 py-2 rounded-lg font-medium"
              >
                {t('registerSupplier')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
