'use client';
import { useEffect, useState } from 'react';
import type { LogisticsConfig, LogisticsBorder, LogisticsStation } from '@/lib/logistics-config';

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function LogisticsConfigPanel() {
  const [config, setConfig] = useState<LogisticsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    fetch('/api/admin/logistics-config')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setConfig(data); })
      .finally(() => setLoading(false));
  }, []);

  function updateBorder(id: string, patch: Partial<LogisticsBorder>) {
    setConfig((c) => c ? { ...c, borders: c.borders.map((b) => b.id === id ? { ...b, ...patch } : b) } : c);
  }

  function addBorder() {
    setConfig((c) => c ? { ...c, borders: [...c.borders, { id: uid('border'), label: '' }] } : c);
  }

  function removeBorder(id: string) {
    setConfig((c) => c ? { ...c, borders: c.borders.filter((b) => b.id !== id) } : c);
  }

  function updateStation(id: string, patch: Partial<LogisticsStation>) {
    setConfig((c) => c ? { ...c, stations: c.stations.map((s) => s.id === id ? { ...s, ...patch } : s) } : c);
  }

  function addStation() {
    setConfig((c) => c ? { ...c, stations: [...c.stations, { id: uid('station'), ru: '', en: '', pricePerContainer: 800 }] } : c);
  }

  function removeStation(id: string) {
    setConfig((c) => c ? { ...c, stations: c.stations.filter((s) => s.id !== id) } : c);
  }

  async function save() {
    if (!config) return;
    setSaveStatus('saving');
    const res = await fetch('/api/admin/logistics-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaveStatus(res.ok ? 'saved' : 'error');
    if (res.ok) setTimeout(() => setSaveStatus('idle'), 2500);
  }

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">Загружаем настройки...</div>;
  if (!config) return <div className="text-center py-16 text-red-500 text-sm">Не удалось загрузить настройки логистики.</div>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Эти настройки управляют мгновенным калькулятором логистики на сайте (страница товара и страница «Логистика»).
        Изменения применяются сразу после сохранения — без деплоя.
      </p>

      {/* Reference tons */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <label className="block text-sm font-semibold text-gray-900 mb-1">Тонн на контейнер (база для расчёта за тонну)</label>
        <p className="text-xs text-gray-500 mb-3">Используется, чтобы показать тариф за контейнер как цену за тонну (тариф ÷ это число). Не меняет сам тариф за контейнер.</p>
        <input
          type="number"
          min={1}
          value={config.referenceTonsPerContainer}
          onChange={(e) => setConfig({ ...config, referenceTonsPerContainer: Math.max(1, parseFloat(e.target.value) || 1) })}
          className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Borders */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Погранпереходы</h3>
        <div className="space-y-2">
          {config.borders.map((b) => (
            <div key={b.id} className="flex gap-2 items-center">
              <input
                value={b.label}
                onChange={(e) => updateBorder(b.id, { label: e.target.value })}
                placeholder="Например: Алтынколь (эксп.) — Хоргос"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button onClick={() => removeBorder(b.id)} className="text-red-500 hover:text-red-700 text-sm px-2" title="Удалить">✕</button>
            </div>
          ))}
        </div>
        <button onClick={addBorder} className="mt-3 text-sm font-medium text-primary-700 hover:text-primary-900">
          + Добавить переход
        </button>
      </div>

      {/* Stations & rates */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Станции возврата и тарифы ($ за 40-фут. контейнер)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-2 py-2 font-medium">Название (рус.)</th>
                <th className="text-left px-2 py-2 font-medium">Название (англ.)</th>
                <th className="text-left px-2 py-2 font-medium">Тариф, $</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {config.stations.map((s) => (
                <tr key={s.id} className="border-t border-gray-100">
                  <td className="px-2 py-2">
                    <input value={s.ru} onChange={(e) => updateStation(s.id, { ru: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </td>
                  <td className="px-2 py-2">
                    <input value={s.en} onChange={(e) => updateStation(s.id, { en: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </td>
                  <td className="px-2 py-2">
                    <input type="number" min={0} value={s.pricePerContainer}
                      onChange={(e) => updateStation(s.id, { pricePerContainer: Math.max(0, parseFloat(e.target.value) || 0) })}
                      className="w-28 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </td>
                  <td className="px-2 py-2">
                    <button onClick={() => removeStation(s.id)} className="text-red-500 hover:text-red-700 text-sm" title="Удалить">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={addStation} className="mt-3 text-sm font-medium text-primary-700 hover:text-primary-900">
          + Добавить станцию
        </button>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saveStatus === 'saving'}
          className="bg-primary-700 hover:bg-primary-800 disabled:opacity-40 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
        >
          {saveStatus === 'saving' ? 'Сохраняем...' : 'Сохранить изменения'}
        </button>
        {saveStatus === 'saved' && <span className="text-sm text-green-700 font-medium">✓ Сохранено</span>}
        {saveStatus === 'error' && <span className="text-sm text-red-600">Ошибка сохранения, попробуйте ещё раз</span>}
      </div>
    </div>
  );
}
