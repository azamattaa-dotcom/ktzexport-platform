'use client';
import { useState } from 'react';
import type { Supplier } from '@/lib/db';
import { PRODUCT_LIST } from '@/lib/products';

const PRODUCT_LABELS: Record<string, Record<string, string>> = {
  ru: { flour_feed: 'Кормовая мука', flour_wheat: 'Пшеничная мука', wheat: 'Пшеница', barley: 'Ячмень', bran: 'Пшеничные отруби', flaxseed: 'Семена льна', sunflower: 'Семена подсолнечника', corn: 'Кукуруза' },
  en: { flour_feed: 'Feed Flour', flour_wheat: 'Wheat Flour', wheat: 'Wheat', barley: 'Barley', bran: 'Wheat Bran', flaxseed: 'Flaxseed', sunflower: 'Sunflower Seeds', corn: 'Corn' },
  kk: { flour_feed: 'Жем ұны', flour_wheat: 'Бидай ұны', wheat: 'Бидай', barley: 'Арпа', bran: 'Бидай кебегі', flaxseed: 'Зығыр тұқымы', sunflower: 'Күнбағыс тұқымы', corn: 'Жүгері' },
  zh: { flour_feed: '饲料面粉', flour_wheat: '小麦粉', wheat: '小麦', barley: '大麦', bran: '小麦麸皮', flaxseed: '亚麻籽', sunflower: '葵花籽', corn: '玉米' },
  tr: { flour_feed: 'Yem Unu', flour_wheat: 'Buğday Unu', wheat: 'Buğday', barley: 'Arpa', bran: 'Buğday Kepeği', flaxseed: 'Keten Tohumu', sunflower: 'Ayçiçeği Tohumu', corn: 'Mısır' },
};

const CURRENCY_SYMBOL: Record<string, string> = { USD: '$', KZT: '₸' };

const emptyForm = { name: '', email: '', phone: '', volume: '', message: '' };

interface Props {
  supplier: Supplier;
  productId: string;
  locale: string;
  isAdmin?: boolean;
}

export default function SupplierCard({ supplier, productId, locale, isAdmin }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendErr, setSendErr] = useState('');

  const detail = supplier.productDetails?.[productId];
  const price = detail?.price ?? supplier.productPrices?.[productId];
  const labels = PRODUCT_LABELS[locale] ?? PRODUCT_LABELS.ru;
  const isImage = supplier.letterheadBase64?.startsWith('data:image');

  function formatPrice() {
    if (!price) return null;
    const sym = CURRENCY_SYMBOL[price.currency] ?? '';
    if (price.type === 'fixed') return `${sym}${price.fixed?.toLocaleString()} / ${price.unit}`;
    return `${sym}${price.min?.toLocaleString()} – ${price.max?.toLocaleString()} / ${price.unit}`;
  }

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setSendErr('');
    const res = await fetch('/api/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplierCompany: supplier.companyName,
        productId,
        ...form,
      }),
    });
    setSending(false);
    if (res.ok) {
      setSent(true);
      setShowForm(false);
      setForm(emptyForm);
    } else {
      setSendErr('Ошибка отправки. Попробуйте ещё раз.');
    }
  }

  const priceStr = formatPrice();

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Main row — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-6 py-5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg shrink-0">
              {supplier.companyName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 truncate">{supplier.companyName}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {supplier.country}{supplier.elevatorName ? ` · ${supplier.elevatorName}` : ''}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {supplier.products.map((pid) => {
                  const p = PRODUCT_LIST.find((x) => x.id === pid);
                  return (
                    <span key={pid} className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${p?.from ?? 'from-gray-100'} ${p?.to ?? 'to-gray-100'} ${p?.text ?? 'text-gray-700'} border ${p?.border ?? 'border-gray-200'}`}>
                      {p?.emoji} {labels[pid] ?? pid}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              {priceStr ? (
                <div className="text-primary-700 font-bold text-lg">{priceStr}</div>
              ) : (
                <div className="text-gray-400 text-sm italic">Цена по запросу</div>
              )}
              {detail?.availableVolume && (
                <div className="text-xs text-gray-400 mt-0.5">Доступно: {detail.availableVolume}</div>
              )}
            </div>
            <svg className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-6 py-5 space-y-5">
          <div className={`grid gap-4 ${isAdmin ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Contacts — admin only */}
            {isAdmin && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Контакты</h3>
                <p className="text-sm text-gray-800 font-medium">{supplier.contactName}</p>
                <p className="text-sm text-gray-600">{supplier.email}</p>
                <p className="text-sm text-gray-600">{supplier.phone}</p>
              </div>
            )}
            {/* Volume */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Объём</h3>
              {detail?.availableVolume && <p className="text-sm text-gray-800">Доступно: <span className="font-medium">{detail.availableVolume}</span></p>}
              {detail?.minOrder && <p className="text-sm text-gray-800">Мин. заказ: <span className="font-medium">{detail.minOrder}</span></p>}
              <p className="text-sm text-gray-600">Годовой: {supplier.annualVolume}</p>
            </div>
          </div>

          {/* Characteristics */}
          {detail?.characteristics && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Характеристики</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 rounded-xl p-4">{detail.characteristics}</p>
            </div>
          )}

          {/* Documents */}
          <div className="flex flex-wrap gap-3">
            {detail?.certificateBase64 && (
              <a href={detail.certificateBase64} download={detail.certificateFileName ?? 'certificate'}
                className="flex items-center gap-2 text-sm text-primary-600 border border-primary-200 hover:bg-primary-50 px-3 py-2 rounded-lg transition-colors">
                📄 {detail.certificateFileName ?? 'Сертификат'}
              </a>
            )}
            {supplier.letterheadBase64 && (
              isImage ? (
                <div className="w-full">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Фирменный бланк</h3>
                  <img src={supplier.letterheadBase64} alt="Фирменный бланк" className="max-h-48 rounded-xl border border-gray-100 object-contain" />
                </div>
              ) : (
                <a href={supplier.letterheadBase64} download={supplier.letterheadFileName ?? 'letterhead'}
                  className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                  📎 {supplier.letterheadFileName ?? 'Фирменный бланк'}
                </a>
              )
            )}
          </div>

          {/* Request form — buyers only */}
          {!isAdmin && (
            <div className="border-t border-gray-100 pt-4">
              {sent ? (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
                  ✓ Запрос отправлен — мы свяжемся с вами в течение 24 часов
                </div>
              ) : showForm ? (
                <form onSubmit={handleRequest} className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">Запрос поставщику</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      required
                      placeholder="Ваше имя *"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full"
                    />
                    <input
                      required
                      type="email"
                      placeholder="Email *"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full"
                    />
                    <input
                      placeholder="Телефон"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full"
                    />
                    <input
                      placeholder="Интересующий объём"
                      value={form.volume}
                      onChange={(e) => setForm((p) => ({ ...p, volume: e.target.value }))}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Сообщение (необязательно)"
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                  />
                  {sendErr && <p className="text-xs text-red-500">{sendErr}</p>}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={sending}
                      className="bg-primary-700 hover:bg-primary-800 disabled:bg-primary-400 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      {sending ? 'Отправляем...' : 'Отправить запрос'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); setSendErr(''); }}
                      className="text-gray-500 text-sm px-3 py-2 hover:text-gray-700 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-primary-700 hover:bg-primary-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                >
                  Отправить запрос →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
