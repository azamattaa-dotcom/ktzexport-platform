'use client';
import { useTranslations } from 'next-intl';
import { useState, useRef } from 'react';
import { PRODUCT_LIST } from '@/lib/products';

const COUNTRIES = [
  'Казахстан', 'Россия', 'Узбекистан', 'Кыргызстан', 'Таджикистан',
  'Туркменистан', 'Афганистан', 'Китай', 'Турция', 'Другое',
];

const MAX_FILE_BYTES = 2 * 1024 * 1024;

export default function SupplierRegistrationForm() {
  const t = useTranslations('supplier');
  const tp = useTranslations('products');

  const [form, setForm] = useState({
    companyName: '', country: '', contactName: '',
    email: '', phone: '', products: [] as string[],
    annualVolume: '', elevatorName: '', description: '',
  });
  const [letterheadBase64, setLetterheadBase64] = useState<string>('');
  const [letterheadFileName, setLetterheadFileName] = useState<string>('');
  const [fileError, setFileError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setFileError(t('letterheadError'));
      setLetterheadBase64('');
      setLetterheadFileName('');
      return;
    }
    setFileError('');
    setLetterheadFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setLetterheadBase64(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.companyName) errs.companyName = t('requiredField');
    if (!form.country)     errs.country     = t('requiredField');
    if (!form.contactName) errs.contactName = t('requiredField');
    if (!form.email)       errs.email       = t('requiredField');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t('invalidEmail');
    if (!form.phone)       errs.phone       = t('requiredField');
    if (!form.products.length)  errs.products    = t('requiredField');
    if (!form.annualVolume)     errs.annualVolume = t('requiredField');
    return errs;
  }

  function toggleProduct(id: string) {
    setForm((f) => ({
      ...f,
      products: f.products.includes(id) ? f.products.filter((p) => p !== id) : [...f.products, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStatus('submitting');

    try {
      const res = await fetch('/api/suppliers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, letterheadBase64, letterheadFileName }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-16 px-6">
        <div className="text-6xl mb-6">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('successTitle')}</h2>
        <p className="text-gray-500 max-w-sm mx-auto">{t('successDesc')}</p>
      </div>
    );
  }

  const inputClass = (field: string) =>
    `w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
    }`;

  const volumes = ['lt1000', '1000_5000', '5000_20000', 'gt20000'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company + Country */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('companyName')} *</label>
          <input className={inputClass('companyName')} value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('country')} *</label>
          <select className={inputClass('country')} value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}>
            <option value="">—</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
        </div>
      </div>

      {/* Elevator name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('elevatorName')}</label>
        <input className={inputClass('elevatorName')} value={form.elevatorName}
          onChange={(e) => setForm({ ...form, elevatorName: e.target.value })}
          placeholder="Например: Элеватор Астана-1" />
      </div>

      {/* Contact + Email + Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('contactName')} *</label>
          <input className={inputClass('contactName')} value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
          {errors.contactName && <p className="text-red-500 text-xs mt-1">{errors.contactName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')} *</label>
          <input type="email" className={inputClass('email')} value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')} *</label>
          <input type="tel" className={inputClass('phone')} value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>
      </div>

      {/* Products */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('products')} *</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRODUCT_LIST.map((p) => (
            <button key={p.id} type="button" onClick={() => toggleProduct(p.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                form.products.includes(p.id)
                  ? 'bg-primary-700 border-primary-700 text-white'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300'
              }`}>
              <span>{p.emoji}</span>
              <span className="text-xs">{tp(`items.${p.id}`)}</span>
            </button>
          ))}
        </div>
        {errors.products && <p className="text-red-500 text-xs mt-1">{errors.products}</p>}
      </div>

      {/* Annual Volume */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('annualVolume')} *</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {volumes.map((v) => (
            <button key={v} type="button" onClick={() => setForm({ ...form, annualVolume: v })}
              className={`px-3 py-2 rounded-lg border text-xs transition-all ${
                form.annualVolume === v
                  ? 'bg-primary-700 border-primary-700 text-white'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300'
              }`}>
              {t(`volumes.${v}`)}
            </button>
          ))}
        </div>
        {errors.annualVolume && <p className="text-red-500 text-xs mt-1">{errors.annualVolume}</p>}
      </div>

      {/* Letterhead upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('letterhead')}</label>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 hover:border-primary-300 rounded-xl px-4 py-5 cursor-pointer transition-colors text-center"
        >
          {letterheadFileName ? (
            <div className="flex items-center justify-center gap-2 text-sm text-primary-700 font-medium">
              <span>📎</span><span>{letterheadFileName}</span>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              <div className="text-2xl mb-1">📄</div>
              <div>{t('letterheadHint')}</div>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFile} />
        {fileError && <p className="text-red-500 text-xs mt-1">{fileError}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
        <textarea rows={4} className={inputClass('description')} value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>

      {status === 'error' && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {t('errorTitle')}
        </p>
      )}

      <button type="submit" disabled={status === 'submitting'}
        className="w-full bg-primary-700 hover:bg-primary-800 disabled:bg-primary-400 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm">
        {status === 'submitting' ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
