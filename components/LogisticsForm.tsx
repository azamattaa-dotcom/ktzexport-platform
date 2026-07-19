'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

type TransportId = 'container' | 'covered' | 'hopper';

const BORDER_STATION_KEYS: Record<TransportId, string[]> = {
  container: ['dostyk', 'altynkol', 'aktau'],
  covered:   ['saryagash', 'bolashak'],
  hopper:    ['saryagash', 'bolashak'],
};

// Russian station names sent in the email to KTZ team
const STATION_RU: Record<string, string> = {
  dostyk:    'Достык (эксп.) — Алашанькоу',
  altynkol:  'Алтынколь (эксп.) — Хоргос',
  aktau:     'Актау Порт (эксп.)',
  saryagash: 'Сарыагаш (эксп.)',
  bolashak:  'Болашак (эксп.)',
};

const emptyForm = {
  transportType: 'container' as TransportId,
  stationDeparture: '',
  stationBorder: '',
  stationBorderCustom: '',
  stationDestination: '',
  stationEmptyReturn: '',
  cargoName: '',
  cargoCodeGNG: '',
  cargoCodeETSNG: '',
  containerSize: '40ft',
  containerCount: '',
  wagonCount: '',
  month: '',
  decade: '',
  contactName: '',
  contactCompany: '',
  contactEmail: '',
  contactPhone: '',
};

export default function LogisticsForm() {
  const t = useTranslations('logistics');
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const isContainer = form.transportType === 'container';
  const borderCustom = form.stationBorder === 'other';
  const borderStationKeys = BORDER_STATION_KEYS[form.transportType];

  const TRANSPORT_TYPES: { id: TransportId; label: string }[] = [
    { id: 'container', label: t('transport.container') },
    { id: 'covered',   label: t('transport.covered') },
    { id: 'hopper',    label: t('transport.hopper') },
  ];

  const destPlaceholder = t(`placeholders.dest${form.transportType.charAt(0).toUpperCase() + form.transportType.slice(1)}` as any);
  const cargoPlaceholder = t(`placeholders.cargo${form.transportType.charAt(0).toUpperCase() + form.transportType.slice(1)}` as any);

  const MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12].map((n) => ({
    id: String(n),
    label: t(`months.${n}` as any),
  }));

  const DECADES = [
    { id: '1', label: t('decade1') },
    { id: '2', label: t('decade2') },
    { id: '3', label: t('decade3') },
  ];

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  }

  function switchTransport(id: TransportId) {
    setForm((p) => ({ ...p, transportType: id, stationBorder: '', stationBorderCustom: '' }));
    setErrors({});
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.stationDeparture) e.stationDeparture = t('errRequired');
    if (!form.stationBorder) e.stationBorder = t('errSelectBorder');
    if (borderCustom && !form.stationBorderCustom) e.stationBorderCustom = t('errSpecifyBorder');
    if (!form.stationDestination) e.stationDestination = t('errRequired');
    if (isContainer && !form.stationEmptyReturn) e.stationEmptyReturn = t('errRequired');
    if (!form.cargoName) e.cargoName = t('errRequired');
    if (isContainer && !form.containerCount) e.containerCount = t('errRequired');
    if (!form.wagonCount) e.wagonCount = t('errRequired');
    if (!form.month) e.month = t('errSelectMonth');
    if (!form.decade) e.decade = t('errSelectDecade');
    if (!form.contactName) e.contactName = t('errRequired');
    if (!form.contactEmail) e.contactEmail = t('errRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) e.contactEmail = t('errInvalidEmail');
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStatus('sending');
    const selectedTransport = TRANSPORT_TYPES.find(t => t.id === form.transportType);
    const payload = {
      ...form,
      transportType: selectedTransport?.label ?? form.transportType,
      stationBorder: borderCustom ? form.stationBorderCustom : (STATION_RU[form.stationBorder] ?? form.stationBorder),
      containerSize: isContainer ? (form.containerSize === '40ft' ? '40-футовый' : '20-футовый') : undefined,
    };
    const res = await fetch('/api/logistics/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setStatus(res.ok ? 'sent' : 'error');
  }

  const inp = (field: string) =>
    `w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
    }`;

  if (status === 'sent') {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('successTitle')}</h2>
        <p className="text-gray-500 max-w-sm mx-auto">{t('successDesc')}</p>
        <button onClick={() => { setForm(emptyForm); setStatus('idle'); }}
          className="mt-8 text-primary-700 hover:text-primary-900 text-sm font-medium underline">
          {t('sendAnother')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Transport type */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('transportType')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TRANSPORT_TYPES.map((tp) => (
            <button key={tp.id} type="button"
              onClick={() => switchTransport(tp.id)}
              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all text-center ${
                form.transportType === tp.id
                  ? 'bg-primary-700 border-primary-700 text-white shadow-md'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300'
              }`}>
              {tp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section 1: Route */}
      <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">{t('section1')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Departure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('stationDeparture')} *</label>
            <input value={form.stationDeparture} onChange={(e) => set('stationDeparture', e.target.value)}
              placeholder={t('placeholders.departure')} className={inp('stationDeparture')} />
            {errors.stationDeparture && <p className="text-red-500 text-xs mt-1">{errors.stationDeparture}</p>}
          </div>

          {/* Border crossing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('stationBorder')} *</label>
            <select value={form.stationBorder} onChange={(e) => set('stationBorder', e.target.value)}
              className={inp('stationBorder')}>
              <option value="">{t('selectBorder')}</option>
              {borderStationKeys.map((key) => (
                <option key={key} value={key}>{t(`stations.${key}` as any)}</option>
              ))}
              <option value="other">{t('stations.other')}</option>
            </select>
            {errors.stationBorder && <p className="text-red-500 text-xs mt-1">{errors.stationBorder}</p>}
            {borderCustom && (
              <div className="mt-2">
                <input value={form.stationBorderCustom}
                  onChange={(e) => set('stationBorderCustom', e.target.value)}
                  placeholder={t('stations.specifyPlaceholder')}
                  className={inp('stationBorderCustom')} />
                {errors.stationBorderCustom && <p className="text-red-500 text-xs mt-1">{errors.stationBorderCustom}</p>}
              </div>
            )}
          </div>

          {/* Destination */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('stationDestination')} *</label>
            <input value={form.stationDestination} onChange={(e) => set('stationDestination', e.target.value)}
              placeholder={destPlaceholder} className={inp('stationDestination')} />
            {errors.stationDestination && <p className="text-red-500 text-xs mt-1">{errors.stationDestination}</p>}
          </div>

          {/* Empty return (container only) */}
          {isContainer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('stationEmptyReturn')} *</label>
              <input value={form.stationEmptyReturn} onChange={(e) => set('stationEmptyReturn', e.target.value)}
                placeholder={t('placeholders.emptyReturn')} className={inp('stationEmptyReturn')} />
              {errors.stationEmptyReturn && <p className="text-red-500 text-xs mt-1">{errors.stationEmptyReturn}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Cargo */}
      <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">{t('section2')}</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('cargoName')} *</label>
          <input value={form.cargoName} onChange={(e) => set('cargoName', e.target.value)}
            placeholder={cargoPlaceholder} className={inp('cargoName')} />
          {errors.cargoName && <p className="text-red-500 text-xs mt-1">{errors.cargoName}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('cargoCodeETSNG')}</label>
            <input value={form.cargoCodeETSNG} onChange={(e) => set('cargoCodeETSNG', e.target.value)}
              placeholder="541024" className={inp('cargoCodeETSNG')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('cargoCodeGNG')}</label>
            <input value={form.cargoCodeGNG} onChange={(e) => set('cargoCodeGNG', e.target.value)}
              placeholder="23099096" className={inp('cargoCodeGNG')} />
          </div>
        </div>

        {isContainer && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('containerParams')}</label>
            <div className="flex gap-3 sm:w-1/2">
              {(['40ft', '20ft'] as const).map((size) => (
                <button key={size} type="button"
                  onClick={() => set('containerSize', size)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    form.containerSize === size
                      ? 'bg-primary-700 border-primary-700 text-white'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300'
                  }`}>
                  {size === '40ft' ? t('container40ft') : t('container20ft')}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isContainer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('containerCount')} *</label>
              <input type="number" min="1" value={form.containerCount}
                onChange={(e) => set('containerCount', e.target.value)}
                placeholder={t('placeholders.containerCount')} className={inp('containerCount')} />
              {errors.containerCount && <p className="text-red-500 text-xs mt-1">{errors.containerCount}</p>}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('wagonCount')} *</label>
            <input type="number" min="1" value={form.wagonCount}
              onChange={(e) => set('wagonCount', e.target.value)}
              placeholder={isContainer ? t('placeholders.wagonCountContainer') : t('placeholders.wagonCount')}
              className={inp('wagonCount')} />
            {errors.wagonCount && <p className="text-red-500 text-xs mt-1">{errors.wagonCount}</p>}
          </div>
        </div>
      </div>

      {/* Section 3: Period */}
      <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">{t('section3')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('month')} *</label>
            <select value={form.month} onChange={(e) => set('month', e.target.value)} className={inp('month')}>
              <option value="">{t('selectMonth')}</option>
              {MONTHS.map((m) => <option key={m.id} value={m.label}>{m.label}</option>)}
            </select>
            {errors.month && <p className="text-red-500 text-xs mt-1">{errors.month}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('decade')} *</label>
            <div className="flex flex-col gap-2">
              {DECADES.map((d) => (
                <label key={d.id}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                    form.decade === d.id
                      ? 'border-primary-500 bg-primary-50 text-primary-800'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                  <input type="radio" name="decade" value={d.id} checked={form.decade === d.id}
                    onChange={() => set('decade', d.id)} className="accent-primary-700" />
                  <span className="text-sm">{d.label}</span>
                </label>
              ))}
            </div>
            {errors.decade && <p className="text-red-500 text-xs mt-1">{errors.decade}</p>}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">{t('contacts')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('contactName')} *</label>
            <input value={form.contactName} onChange={(e) => set('contactName', e.target.value)}
              className={inp('contactName')} />
            {errors.contactName && <p className="text-red-500 text-xs mt-1">{errors.contactName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('company')}</label>
            <input value={form.contactCompany} onChange={(e) => set('contactCompany', e.target.value)}
              className={inp('contactCompany')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')} *</label>
            <input type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)}
              className={inp('contactEmail')} />
            {errors.contactEmail && <p className="text-red-500 text-xs mt-1">{errors.contactEmail}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
            <input type="tel" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)}
              className={inp('contactPhone')} />
          </div>
        </div>
      </div>

      {status === 'error' && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {t('errorMsg')}
        </p>
      )}

      <button type="submit" disabled={status === 'sending'}
        className="w-full bg-primary-700 hover:bg-primary-800 disabled:bg-primary-400 text-white font-semibold py-4 rounded-xl transition-colors text-base">
        {status === 'sending' ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
