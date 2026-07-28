'use client';
import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';

// ── Document configs by country ──────────────────────────────────────────────

interface DocConfig {
  doc1: string;
  doc2: string;
  doc3: string;
  taxIdLabel: string;
}

const DOC_CONFIG_COUNTRIES = [
  'Казахстан', 'Китай', 'Россия', 'Узбекистан', 'Кыргызстан',
  'Таджикистан', 'Туркменистан', 'Турция', 'ОАЭ', 'Индия',
];

// ── Signatory options ────────────────────────────────────────────────────────

const SIGNATORY_VALUES = ['director', 'ceo', 'legal_rep', 'other'];

const CURRENCIES = ['USD', 'EUR', 'CNY', 'KZT', 'RUB', 'AED', 'TRY', 'INR', 'Другая'];

const COUNTRIES = [
  'Китай', 'Казахстан', 'Россия', 'Узбекистан', 'Кыргызстан',
  'Таджикистан', 'Туркменистан', 'Турция', 'ОАЭ', 'Индия', 'Другое',
];

// ── Types ────────────────────────────────────────────────────────────────────

interface DocState { base64: string; fileName: string; fileType: string; }

interface FormData {
  companyName: string;
  country: string;
  registrationNumber: string;
  legalAddress: string;
  postalAddress: string;
  signatoryName: string;
  signatoryType: string;
  signatoryCustomType: string;
  contactName: string;
  email: string;
  phone: string;
  bankName: string;
  swift: string;
  bankAccount: string;
  bankCurrency: string;
  unloadingRegion: string;
  website: string;
  description: string;
}

const MAX_SIZE = 5 * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Document upload widget ───────────────────────────────────────────────────

function DocUpload({ label, doc, onChange, error }: {
  label: string; doc: DocState | null;
  onChange: (d: DocState | null) => void; error?: string;
}) {
  const t = useTranslations('buyerRegister');
  const ref = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE) {
      onChange(null);
      if (ref.current) ref.current.value = '';
      alert(t('fileTooLarge', { fileName: file.name }));
      return;
    }
    const base64 = await fileToBase64(file);
    onChange({ base64, fileName: file.name, fileType: file.type });
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <div
        onClick={() => ref.current?.click()}
        className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-colors
          ${doc ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-primary-400 bg-gray-50'}
          ${error ? 'border-red-400 bg-red-50' : ''}`}
      >
        <span className="text-xl shrink-0">{doc ? '✅' : '📎'}</span>
        <div className="min-w-0 flex-1">
          {doc
            ? <p className="text-sm font-medium text-green-700 truncate">{doc.fileName}</p>
            : <p className="text-sm text-gray-400">{t('uploadHint')}</p>
          }
        </div>
        {doc && (
          <button type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); if (ref.current) ref.current.value = ''; }}
            className="text-gray-400 hover:text-red-500 text-xs shrink-0">✕</button>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ── Main form ────────────────────────────────────────────────────────────────

export default function BuyerRegistrationForm() {
  const t = useTranslations('buyerRegister');

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    companyName: '', country: '', registrationNumber: '',
    legalAddress: '', postalAddress: '',
    signatoryName: '', signatoryType: '', signatoryCustomType: '',
    contactName: '', email: '', phone: '',
    bankName: '', swift: '', bankAccount: '', bankCurrency: 'USD',
    unloadingRegion: '', website: '', description: '',
  });
  const [charter, setCharter] = useState<DocState | null>(null);
  const [regDoc, setRegDoc] = useState<DocState | null>(null);
  const [passport, setPassport] = useState<DocState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState('');

  const docCfg: DocConfig = DOC_CONFIG_COUNTRIES.includes(form.country)
    ? {
        doc1: t(`docConfig.${form.country}.doc1`),
        doc2: t(`docConfig.${form.country}.doc2`),
        doc3: t(`docConfig.${form.country}.doc3`),
        taxIdLabel: t(`docConfig.${form.country}.taxIdLabel`),
      }
    : {
        doc1: t('defaultDocConfig.doc1'),
        doc2: t('defaultDocConfig.doc2'),
        doc3: t('defaultDocConfig.doc3'),
        taxIdLabel: t('defaultDocConfig.taxIdLabel'),
      };

  function set(field: keyof FormData, val: string) {
    setForm((p) => ({ ...p, [field]: val }));
    setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  }

  function validateStep1() {
    const e: Record<string, string> = {};
    const req: Array<[keyof FormData, string]> = [
      ['companyName', t('companyName')], ['country', t('country')],
      ['registrationNumber', t('registrationNumber')],
      ['legalAddress', t('legalAddress')], ['postalAddress', t('postalAddress')],
      ['signatoryName', t('signatoryName')], ['signatoryType', t('signatoryType')],
      ['contactName', t('contactName')], ['phone', t('phone')], ['email', t('email')],
      ['bankName', t('bankName')], ['swift', t('swift')],
      ['bankAccount', t('bankAccount')], ['bankCurrency', t('bankCurrency')],
      ['unloadingRegion', t('unloadingRegion')],
    ];
    for (const [field, label] of req) {
      if (!form[field]?.trim()) e[field] = `${label} — ${t('required')}`;
    }
    if (form.signatoryType === 'other' && !form.signatoryCustomType.trim()) {
      e.signatoryCustomType = t('required');
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = t('invalidEmail');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    if (!charter) e.charter = t('docRequired');
    if (!regDoc) e.regDoc = t('docRequired');
    if (!passport) e.passport = t('docRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validateStep2()) return;
    setSubmitting(true); setServerError('');
    try {
      const res = await fetch('/api/buyer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          charterDoc: charter, registrationDoc: regDoc, passportDoc: passport,
        }),
      });
      if (res.ok) { setDone(true); }
      else { const d = await res.json(); setServerError(d.error || t('errorDefault')); }
    } catch { setServerError(t('errorDefault')); }
    finally { setSubmitting(false); }
  }

  const inp = (field: keyof FormData) =>
    `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 ${errors[field] ? 'border-red-400' : 'border-gray-200'}`;

  const fieldBlock = (field: keyof FormData, label: string, placeholder: string, type = 'text', required = true) => (
    <div key={field}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input type={type} value={form[field] as string}
        onChange={(e) => set(field, e.target.value)}
        placeholder={placeholder} className={inp(field)} />
      {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
    </div>
  );

  if (done) return (
    <div className="text-center py-10 space-y-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl">✅</div>
      <h2 className="text-xl font-bold text-gray-900">{t('successTitle')}</h2>
      <p className="text-gray-500 text-sm max-w-md mx-auto">{t('successDesc')}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Progress bar */}
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

      {/* ── STEP 1: Company + Banking info ── */}
      {step === 1 && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">{t('step1Title')}</h2>

          {/* Company basics */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('sectionCompany')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fieldBlock('companyName', t('companyName'), '')}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('country')} <span className="text-red-500">*</span>
              </label>
              <select value={form.country} onChange={(e) => set('country', e.target.value)} className={inp('country')}>
                <option value="">— {t('selectCountry')} —</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{t(`countries.${c}`)}</option>)}
              </select>
              {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form.country ? docCfg.taxIdLabel : t('registrationNumber')} <span className="text-red-500">*</span>
              </label>
              <input value={form.registrationNumber}
                onChange={(e) => set('registrationNumber', e.target.value)}
                placeholder={form.country ? docCfg.taxIdLabel : t('registrationNumber')}
                className={inp('registrationNumber')} />
              {errors.registrationNumber && <p className="text-red-500 text-xs mt-1">{errors.registrationNumber}</p>}
            </div>

            <div className="sm:col-span-2">
              {fieldBlock('legalAddress', t('legalAddress'), '')}
            </div>
            <div className="sm:col-span-2">
              {fieldBlock('postalAddress', t('postalAddress'), '')}
            </div>
          </div>

          {/* Signatory */}
          <div className="border-t border-gray-100 pt-4 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('sectionSignatory')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fieldBlock('signatoryName', t('signatoryName'), '')}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('signatoryType')} <span className="text-red-500">*</span>
                </label>
                <select value={form.signatoryType} onChange={(e) => set('signatoryType', e.target.value)} className={inp('signatoryType')}>
                  <option value="">— {t('selectSignatory')} —</option>
                  {SIGNATORY_VALUES.map((v) => <option key={v} value={v}>{t(`signatoryTypes.${v}`)}</option>)}
                </select>
                {errors.signatoryType && <p className="text-red-500 text-xs mt-1">{errors.signatoryType}</p>}
              </div>
              {form.signatoryType === 'other' && (
                <div className="sm:col-span-2">
                  {fieldBlock('signatoryCustomType', t('signatoryCustomType'), '')}
                </div>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="border-t border-gray-100 pt-4 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('sectionContact')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fieldBlock('contactName', t('contactName'), '')}
              {fieldBlock('phone', t('phone'), '')}
              {fieldBlock('email', t('email'), '', 'email')}
              {fieldBlock('website', t('website'), '', 'text', false)}
            </div>
          </div>

          {/* Banking */}
          <div className="border-t border-gray-100 pt-4 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('sectionBanking')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                {fieldBlock('bankName', t('bankName'), '')}
              </div>
              {fieldBlock('swift', t('swift'), '')}
              {fieldBlock('bankAccount', t('bankAccount'), '')}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('bankCurrency')} <span className="text-red-500">*</span>
                </label>
                <select value={form.bankCurrency} onChange={(e) => set('bankCurrency', e.target.value)} className={inp('bankCurrency')}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c === 'Другая' ? t('otherCurrency') : c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Logistics */}
          <div className="border-t border-gray-100 pt-4 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('sectionLogistics')}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('unloadingRegion')} <span className="text-red-500">*</span>
              </label>
              <input value={form.unloadingRegion}
                onChange={(e) => set('unloadingRegion', e.target.value)}
                className={inp('unloadingRegion')} />
              {errors.unloadingRegion && <p className="text-red-500 text-xs mt-1">{errors.unloadingRegion}</p>}
              <p className="text-xs text-gray-400 mt-1">{t('unloadingRegionHint')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
                rows={2} placeholder={t('descriptionPlaceholder')}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none" />
            </div>
          </div>

          <button onClick={() => { if (validateStep1()) setStep(2); }}
            className="w-full bg-primary-700 hover:bg-primary-800 text-white font-medium py-3 rounded-xl text-sm transition-colors">
            {t('nextStep')} →
          </button>
        </div>
      )}

      {/* ── STEP 2: Documents ── */}
      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">{t('step2Title')}</h2>

          {form.country && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <span className="font-semibold">{t('country')}: {t(`countries.${form.country}`)}.</span> {t('docsNote')}
            </div>
          )}

          <DocUpload label={docCfg.doc1} doc={charter} onChange={setCharter} error={errors.charter} />
          <DocUpload label={docCfg.doc2} doc={regDoc} onChange={setRegDoc} error={errors.regDoc} />
          <DocUpload label={docCfg.doc3} doc={passport} onChange={setPassport} error={errors.passport} />

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

      {/* ── STEP 3: Review ── */}
      {step === 3 && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">{t('step3Title')}</h2>

          <div className="bg-gray-50 rounded-xl p-5 text-sm space-y-4">
            {/* Company */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('sectionCompany')}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {[
                  [t('companyName'), form.companyName],
                  [t('country'), t(`countries.${form.country}`)],
                  [docCfg.taxIdLabel, form.registrationNumber],
                  [t('legalAddress'), form.legalAddress],
                  [t('postalAddress'), form.postalAddress],
                ].map(([k, v]) => (
                  <div key={k} className="contents">
                    <span className="text-gray-400">{k}</span>
                    <span className="font-medium text-gray-900 truncate">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Signatory */}
            <div className="border-t border-gray-200 pt-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('sectionSignatory')}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <span className="text-gray-400">{t('signatoryName')}</span>
                <span className="font-medium text-gray-900">{form.signatoryName}</span>
                <span className="text-gray-400">{t('signatoryType')}</span>
                <span className="font-medium text-gray-900">
                  {form.signatoryType === 'other'
                    ? form.signatoryCustomType
                    : t(`signatoryTypes.${form.signatoryType}`)}
                </span>
              </div>
            </div>
            {/* Banking */}
            <div className="border-t border-gray-200 pt-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('sectionBanking')}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {[
                  [t('bankName'), form.bankName],
                  [t('swift'), form.swift],
                  [t('bankAccount'), form.bankAccount],
                  [t('bankCurrency'), form.bankCurrency],
                ].map(([k, v]) => (
                  <div key={k} className="contents">
                    <span className="text-gray-400">{k}</span>
                    <span className="font-medium text-gray-900">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Logistics */}
            <div className="border-t border-gray-200 pt-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('sectionLogistics')}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <span className="text-gray-400">{t('unloadingRegion')}</span>
                <span className="font-medium text-gray-900">{form.unloadingRegion}</span>
              </div>
            </div>
            {/* Docs */}
            <div className="border-t border-gray-200 pt-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('documentsUploaded')}</p>
              {[charter, regDoc, passport].map((d, i) => (
                <div key={i} className="flex items-center gap-2 mt-1">
                  <span className="text-green-500 text-xs">✓</span>
                  <span className="text-gray-700 text-xs">{d?.fileName}</span>
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
              className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl text-sm transition-colors">
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
