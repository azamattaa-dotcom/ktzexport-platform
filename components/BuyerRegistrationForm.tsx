'use client';
import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';

interface DocState {
  base64: string;
  fileName: string;
  fileType: string;
}

interface FormData {
  companyName: string;
  country: string;
  registrationNumber: string;
  address: string;
  directorName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  description: string;
}

const COUNTRIES = [
  'Китай', 'Казахстан', 'Россия', 'Узбекистан', 'Кыргызстан',
  'Таджикистан', 'Туркменистан', 'Турция', 'ОАЭ', 'Индия', 'Другое',
];

const MAX_SIZE = 5 * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function DocUpload({
  label, required, doc, onChange, error,
}: {
  label: string;
  required?: boolean;
  doc: DocState | null;
  onChange: (d: DocState | null) => void;
  error?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE) {
      onChange(null);
      if (ref.current) ref.current.value = '';
      alert(`Файл ${file.name} превышает 5 МБ`);
      return;
    }
    const base64 = await fileToBase64(file);
    onChange({ base64, fileName: file.name, fileType: file.type });
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div
        onClick={() => ref.current?.click()}
        className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-colors
          ${doc ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-primary-400 bg-gray-50'}
          ${error ? 'border-red-400' : ''}`}
      >
        <span className="text-xl">{doc ? '✅' : '📎'}</span>
        <div className="min-w-0">
          {doc ? (
            <p className="text-sm font-medium text-green-700 truncate">{doc.fileName}</p>
          ) : (
            <p className="text-sm text-gray-400">PDF, JPEG или PNG — до 5 МБ</p>
          )}
        </div>
        {doc && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); if (ref.current) ref.current.value = ''; }}
            className="ml-auto text-gray-400 hover:text-red-500 text-xs shrink-0"
          >
            ✕
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFile} />
    </div>
  );
}

export default function BuyerRegistrationForm() {
  const t = useTranslations('buyerRegister');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    companyName: '', country: '', registrationNumber: '', address: '',
    directorName: '', contactName: '', email: '', phone: '',
    website: '', description: '',
  });
  const [charter, setCharter] = useState<DocState | null>(null);
  const [registration, setRegistration] = useState<DocState | null>(null);
  const [passport, setPassport] = useState<DocState | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | 'charter' | 'registration' | 'passport', string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState('');

  function set(field: keyof FormData, val: string) {
    setForm((p) => ({ ...p, [field]: val }));
    setErrors((p) => ({ ...p, [field]: '' }));
  }

  function validateStep1() {
    const e: typeof errors = {};
    if (!form.companyName.trim()) e.companyName = t('required');
    if (!form.country) e.country = t('required');
    if (!form.registrationNumber.trim()) e.registrationNumber = t('required');
    if (!form.address.trim()) e.address = t('required');
    if (!form.directorName.trim()) e.directorName = t('required');
    if (!form.contactName.trim()) e.contactName = t('required');
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('invalidEmail');
    if (!form.phone.trim()) e.phone = t('required');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: typeof errors = {};
    if (!charter) e.charter = t('docRequired');
    if (!registration) e.registration = t('docRequired');
    if (!passport) e.passport = t('docRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validateStep2()) return;
    setSubmitting(true);
    setServerError('');
    try {
      const res = await fetch('/api/buyer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, charterDoc: charter, registrationDoc: registration, passportDoc: passport }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const data = await res.json();
        setServerError(data.error || t('errorDefault'));
      }
    } catch {
      setServerError(t('errorDefault'));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (field: keyof FormData) =>
    `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 ${errors[field] ? 'border-red-400' : 'border-gray-200'}`;

  if (done) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl">✅</div>
        <h2 className="text-xl font-bold text-gray-900">{t('successTitle')}</h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto">{t('successDesc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
              ${step === s ? 'bg-primary-700 text-white' : step > s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step > s ? '✓' : s}
            </div>
            <span className={`text-xs hidden sm:block ${step === s ? 'text-primary-700 font-medium' : 'text-gray-400'}`}>
              {s === 1 ? t('step1Label') : s === 2 ? t('step2Label') : t('step3Label')}
            </span>
            {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1 — Company info */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('step1Title')}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('companyName')} <span className="text-red-500">*</span></label>
              <input value={form.companyName} onChange={(e) => set('companyName', e.target.value)}
                placeholder="ООО «Пример Трейд»" className={inputClass('companyName')} />
              {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('country')} <span className="text-red-500">*</span></label>
              <select value={form.country} onChange={(e) => set('country', e.target.value)} className={inputClass('country')}>
                <option value="">— {t('selectCountry')} —</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('registrationNumber')} <span className="text-red-500">*</span></label>
              <input value={form.registrationNumber} onChange={(e) => set('registrationNumber', e.target.value)}
                placeholder="БИН / ИНН / Business ID" className={inputClass('registrationNumber')} />
              {errors.registrationNumber && <p className="text-red-500 text-xs mt-1">{errors.registrationNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('directorName')} <span className="text-red-500">*</span></label>
              <input value={form.directorName} onChange={(e) => set('directorName', e.target.value)}
                placeholder="Иванов Иван Иванович" className={inputClass('directorName')} />
              {errors.directorName && <p className="text-red-500 text-xs mt-1">{errors.directorName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('address')} <span className="text-red-500">*</span></label>
            <input value={form.address} onChange={(e) => set('address', e.target.value)}
              placeholder="г. Пекин, ул. Примерная 1, офис 201" className={inputClass('address')} />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('contactSection')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('contactName')} <span className="text-red-500">*</span></label>
                <input value={form.contactName} onChange={(e) => set('contactName', e.target.value)}
                  placeholder="Ли Вэй" className={inputClass('contactName')} />
                {errors.contactName && <p className="text-red-500 text-xs mt-1">{errors.contactName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')} <span className="text-red-500">*</span></label>
                <input value={form.phone} onChange={(e) => set('phone', e.target.value)}
                  placeholder="+86 138 0000 0000" className={inputClass('phone')} />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')} <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                  placeholder="buyer@company.com" className={inputClass('email')} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('website')}</label>
                <input value={form.website} onChange={(e) => set('website', e.target.value)}
                  placeholder="https://company.com" className={inputClass('website')} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
              rows={3} placeholder={t('descriptionPlaceholder')}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none" />
          </div>

          <button onClick={() => { if (validateStep1()) setStep(2); }}
            className="w-full bg-primary-700 hover:bg-primary-800 text-white font-medium py-3 rounded-xl text-sm transition-colors">
            {t('nextStep')} →
          </button>
        </div>
      )}

      {/* Step 2 — Documents */}
      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">{t('step2Title')}</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            {t('docsNote')}
          </div>

          <DocUpload label={t('charterDoc')} required doc={charter} onChange={setCharter} error={errors.charter} />
          <DocUpload label={t('registrationDoc')} required doc={registration} onChange={setRegistration} error={errors.registration} />
          <DocUpload label={t('passportDoc')} required doc={passport} onChange={setPassport} error={errors.passport} />

          <div className="flex gap-3">
            <button onClick={() => setStep(1)}
              className="flex-1 border border-gray-200 text-gray-600 hover:border-gray-300 font-medium py-3 rounded-xl text-sm transition-colors">
              ← {t('back')}
            </button>
            <button onClick={() => { if (validateStep2()) setStep(3); }}
              className="flex-1 bg-primary-700 hover:bg-primary-800 text-white font-medium py-3 rounded-xl text-sm transition-colors">
              {t('nextStep')} →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Review */}
      {step === 3 && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">{t('step3Title')}</h2>

          <div className="bg-gray-50 rounded-xl p-5 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <span className="text-gray-500">{t('companyName')}</span>
              <span className="font-medium text-gray-900">{form.companyName}</span>
              <span className="text-gray-500">{t('country')}</span>
              <span className="font-medium text-gray-900">{form.country}</span>
              <span className="text-gray-500">{t('registrationNumber')}</span>
              <span className="font-medium text-gray-900">{form.registrationNumber}</span>
              <span className="text-gray-500">{t('directorName')}</span>
              <span className="font-medium text-gray-900">{form.directorName}</span>
              <span className="text-gray-500">{t('contactName')}</span>
              <span className="font-medium text-gray-900">{form.contactName}</span>
              <span className="text-gray-500">{t('email')}</span>
              <span className="font-medium text-gray-900">{form.email}</span>
              <span className="text-gray-500">{t('phone')}</span>
              <span className="font-medium text-gray-900">{form.phone}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 space-y-1">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">{t('documentsUploaded')}</p>
              {[charter, registration, passport].map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700">{d?.fileName}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            {t('reviewNote')}
          </div>

          {serverError && <p className="text-red-500 text-sm text-center">{serverError}</p>}

          <div className="flex gap-3">
            <button onClick={() => setStep(2)}
              className="flex-1 border border-gray-200 text-gray-600 hover:border-gray-300 font-medium py-3 rounded-xl text-sm transition-colors">
              ← {t('back')}
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-medium py-3 rounded-xl text-sm transition-colors">
              {submitting ? t('submitting') : t('submit')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
