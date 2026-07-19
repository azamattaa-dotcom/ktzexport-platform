'use client';
import { useState } from 'react';

const TRANSPORT_TYPES = [
  { id: 'container', label: 'Контейнерный поезд' },
  { id: 'covered',   label: 'Крытый вагон' },
  { id: 'hopper',    label: 'Хоппер-зерновоз' },
] as const;

type TransportId = (typeof TRANSPORT_TYPES)[number]['id'];

const BORDER_STATIONS: Record<TransportId, string[]> = {
  container: ['Достык (эксп.) — Алашанькоу', 'Алтынколь (эксп.) — Хоргос', 'Актау Порт (эксп.)'],
  covered:   ['Сарыагаш (эксп.)', 'Болашак (эксп.)'],
  hopper:    ['Сарыагаш (эксп.)', 'Болашак (эксп.)'],
};

const DESTINATION_PLACEHOLDER: Record<TransportId, string> = {
  container: 'Например: Сиань',
  covered:   'Например: Галаба',
  hopper:    'Например: Аблык',
};

const CARGO_DEFAULTS: Record<TransportId, { name: string; etsnq: string; gng: string }> = {
  container: { name: 'Например: Комбикорма (кормовая мука)', etsnq: 'Например: 541024', gng: 'Например: 23099096' },
  covered:   { name: 'Например: Мука первого сорта',         etsnq: 'Например: 501027', gng: 'Например: 11010015' },
  hopper:    { name: 'Например: Пшеница',                    etsnq: 'Например: 011005', gng: 'Например: 10011100' },
};

const MONTHS = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь',
];

const DECADES = [
  { id: '1', label: '1-я декада (1–10 число)' },
  { id: '2', label: '2-я декада (11–20 число)' },
  { id: '3', label: '3-я декада (21–31 число)' },
];

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
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const isContainer = form.transportType === 'container';
  const borderCustom = form.stationBorder === 'Другое';
  const borderStations = BORDER_STATIONS[form.transportType];
  const destPlaceholder = DESTINATION_PLACEHOLDER[form.transportType];
  const cargoHints = CARGO_DEFAULTS[form.transportType];

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
    if (!form.stationDeparture) e.stationDeparture = 'Обязательное поле';
    if (!form.stationBorder) e.stationBorder = 'Выберите переход';
    if (borderCustom && !form.stationBorderCustom) e.stationBorderCustom = 'Укажите переход';
    if (!form.stationDestination) e.stationDestination = 'Обязательное поле';
    if (isContainer && !form.stationEmptyReturn) e.stationEmptyReturn = 'Обязательное поле';
    if (!form.cargoName) e.cargoName = 'Обязательное поле';
    if (isContainer && !form.containerCount) e.containerCount = 'Обязательное поле';
    if (!form.wagonCount) e.wagonCount = 'Обязательное поле';
    if (!form.month) e.month = 'Выберите месяц';
    if (!form.decade) e.decade = 'Выберите декаду';
    if (!form.contactName) e.contactName = 'Обязательное поле';
    if (!form.contactEmail) e.contactEmail = 'Обязательное поле';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) e.contactEmail = 'Некорректный email';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStatus('sending');
    const payload = {
      ...form,
      transportType: TRANSPORT_TYPES.find(t => t.id === form.transportType)?.label ?? form.transportType,
      stationBorder: borderCustom ? form.stationBorderCustom : form.stationBorder,
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
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Запрос отправлен</h2>
        <p className="text-gray-500 max-w-sm mx-auto">Мы свяжемся с вами в течение 24 часов с расчётом стоимости.</p>
        <button onClick={() => { setForm(emptyForm); setStatus('idle'); }}
          className="mt-8 text-primary-700 hover:text-primary-900 text-sm font-medium underline">
          Отправить ещё один запрос
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Transport type */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Тип транспорта</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TRANSPORT_TYPES.map((t) => (
            <button key={t.id} type="button"
              onClick={() => switchTransport(t.id)}
              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all text-center ${
                form.transportType === t.id
                  ? 'bg-primary-700 border-primary-700 text-white shadow-md'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section 1: Route */}
      <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">1. Маршрут</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Departure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Станция отправления *</label>
            <input value={form.stationDeparture} onChange={(e) => set('stationDeparture', e.target.value)}
              placeholder="Например: Костанай" className={inp('stationDeparture')} />
            {errors.stationDeparture && <p className="text-red-500 text-xs mt-1">{errors.stationDeparture}</p>}
          </div>

          {/* Border crossing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пограничный переход *</label>
            <select value={form.stationBorder} onChange={(e) => set('stationBorder', e.target.value)}
              className={inp('stationBorder')}>
              <option value="">— Выберите переход —</option>
              {borderStations.map((s) => <option key={s} value={s}>{s}</option>)}
              <option value="Другое">Другое</option>
            </select>
            {errors.stationBorder && <p className="text-red-500 text-xs mt-1">{errors.stationBorder}</p>}
            {borderCustom && (
              <div className="mt-2">
                <input value={form.stationBorderCustom}
                  onChange={(e) => set('stationBorderCustom', e.target.value)}
                  placeholder="Укажите пограничный переход"
                  className={inp('stationBorderCustom')} />
                {errors.stationBorderCustom && <p className="text-red-500 text-xs mt-1">{errors.stationBorderCustom}</p>}
              </div>
            )}
          </div>

          {/* Destination */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Станция назначения *</label>
            <input value={form.stationDestination} onChange={(e) => set('stationDestination', e.target.value)}
              placeholder={destPlaceholder} className={inp('stationDestination')} />
            {errors.stationDestination && <p className="text-red-500 text-xs mt-1">{errors.stationDestination}</p>}
          </div>

          {/* Empty return (container only) */}
          {isContainer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Станция возврата порожнего контейнера *</label>
              <input value={form.stationEmptyReturn} onChange={(e) => set('stationEmptyReturn', e.target.value)}
                placeholder="Например: Сиань" className={inp('stationEmptyReturn')} />
              {errors.stationEmptyReturn && <p className="text-red-500 text-xs mt-1">{errors.stationEmptyReturn}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Cargo */}
      <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">2. Данные о грузе</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Наименование груза *</label>
          <input value={form.cargoName} onChange={(e) => set('cargoName', e.target.value)}
            placeholder={cargoHints.name} className={inp('cargoName')} />
          {errors.cargoName && <p className="text-red-500 text-xs mt-1">{errors.cargoName}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Код ЕТСНГ</label>
            <input value={form.cargoCodeETSNG} onChange={(e) => set('cargoCodeETSNG', e.target.value)}
              placeholder={cargoHints.etsnq} className={inp('cargoCodeETSNG')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Код ГНГ</label>
            <input value={form.cargoCodeGNG} onChange={(e) => set('cargoCodeGNG', e.target.value)}
              placeholder={cargoHints.gng} className={inp('cargoCodeGNG')} />
          </div>
        </div>

        {/* Container size — container only */}
        {isContainer && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Параметры контейнеров</label>
            <div className="flex gap-3 sm:w-1/2">
              {['40ft', '20ft'].map((size) => (
                <button key={size} type="button"
                  onClick={() => set('containerSize', size)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    form.containerSize === size
                      ? 'bg-primary-700 border-primary-700 text-white'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300'
                  }`}>
                  {size === '40ft' ? '40-футовый' : '20-футовый'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isContainer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Количество контейнеров *</label>
              <input type="number" min="1" value={form.containerCount}
                onChange={(e) => set('containerCount', e.target.value)}
                placeholder="Например: 62" className={inp('containerCount')} />
              {errors.containerCount && <p className="text-red-500 text-xs mt-1">{errors.containerCount}</p>}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Количество вагонов *</label>
            <input type="number" min="1" value={form.wagonCount}
              onChange={(e) => set('wagonCount', e.target.value)}
              placeholder={isContainer ? 'Например: 31' : 'Например: 20'} className={inp('wagonCount')} />
            {errors.wagonCount && <p className="text-red-500 text-xs mt-1">{errors.wagonCount}</p>}
          </div>
        </div>
      </div>

      {/* Section 3: Period */}
      <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">3. Сроки поставки</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Месяц *</label>
            <select value={form.month} onChange={(e) => set('month', e.target.value)} className={inp('month')}>
              <option value="">— Выберите месяц —</option>
              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            {errors.month && <p className="text-red-500 text-xs mt-1">{errors.month}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Декада *</label>
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
        <h2 className="font-semibold text-gray-900">Контактные данные</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
            <input value={form.contactName} onChange={(e) => set('contactName', e.target.value)}
              className={inp('contactName')} />
            {errors.contactName && <p className="text-red-500 text-xs mt-1">{errors.contactName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Компания</label>
            <input value={form.contactCompany} onChange={(e) => set('contactCompany', e.target.value)}
              className={inp('contactCompany')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)}
              className={inp('contactEmail')} />
            {errors.contactEmail && <p className="text-red-500 text-xs mt-1">{errors.contactEmail}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
            <input type="tel" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)}
              className={inp('contactPhone')} />
          </div>
        </div>
      </div>

      {status === 'error' && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          Ошибка отправки. Проверьте данные и попробуйте снова.
        </p>
      )}

      <button type="submit" disabled={status === 'sending'}
        className="w-full bg-primary-700 hover:bg-primary-800 disabled:bg-primary-400 text-white font-semibold py-4 rounded-xl transition-colors text-base">
        {status === 'sending' ? 'Отправляем...' : 'Отправить запрос'}
      </button>
    </form>
  );
}
