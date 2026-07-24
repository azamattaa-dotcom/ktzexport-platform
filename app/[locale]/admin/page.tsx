'use client';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { Supplier } from '@/lib/db';
import { PRODUCT_LIST } from '@/lib/products';

// ── Types ──────────────────────────────────────────────────────────────────

interface BuyerLight {
  id: string;
  companyName: string;
  country: string;
  registrationNumber: string;
  address: string;
  directorName: string;
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  adminNotes?: string;
  hasCharter: boolean;
  hasRegistration: boolean;
  hasPassport: boolean;
  createdAt: string;
}

interface BuyerFull extends BuyerLight {
  charterDoc?: { base64: string; fileName: string };
  registrationDoc?: { base64: string; fileName: string };
  passportDoc?: { base64: string; fileName: string };
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'На проверке', approved: 'Одобрен', rejected: 'Отклонён',
};

const PRODUCT_LABELS: Record<string, string> = {
  flour_feed: 'Кормовая мука', flour_wheat: 'Пшеничная мука', wheat: 'Пшеница',
  barley: 'Ячмень', bran: 'Пшеничные отруби', flaxseed: 'Семена льна',
  sunflower: 'Семена подсолнечника', corn: 'Кукуруза',
};

const LOADING_STATIONS = ['Костанай', 'Кокшетау', 'Петропавловск', 'Алматы', 'Павлодар', 'Астана', 'Актобе', 'Шымкент', 'Другая'];

const emptyForm = {
  companyName: '', country: 'Казахстан', contactName: '', email: '', phone: '',
  products: [] as string[], annualVolume: '', description: '', elevatorName: '',
  loadingStation: '', password: '',
};

// ── Verification links for buyers ──────────────────────────────────────────

function verifyLinks(buyer: BuyerLight) {
  const name = encodeURIComponent(buyer.companyName);
  const reg  = encodeURIComponent(buyer.registrationNumber);
  const isKZ = buyer.country === 'Казахстан';
  const isCN = buyer.country === 'Китай';

  const links: { label: string; url: string; flag: string }[] = [];

  if (isKZ) {
    links.push(
      { flag: '🇰🇿', label: 'БИН — eGov', url: `https://egov.kz/cms/ru/search?query=${reg}` },
      { flag: '🇰🇿', label: 'Судебный кабинет РК', url: `https://sud.gov.kz/rus/search?query=${name}` },
      { flag: '🇰🇿', label: 'Реестр должников', url: `https://www.adilet.gov.kz/ru/search-debtors?company=${name}` },
      { flag: '🇰🇿', label: 'КГД РК (налоги)', url: `https://kgd.gov.kz/ru/services/taxpayer_search?bin=${reg}` },
    );
  }
  if (isCN) {
    links.push(
      { flag: '🇨🇳', label: 'Tianyancha (天眼查)', url: `https://www.tianyancha.com/search?key=${name}` },
      { flag: '🇨🇳', label: 'Qichacha (企查查)', url: `https://www.qichacha.com/search?key=${name}` },
      { flag: '🇨🇳', label: 'Судебные решения КНР', url: `https://wenshu.court.gov.cn/website/wenshu/181217BMTKHNT2W0/index.html?pageId=ea6e82076ff27a9b16b37455b2dbac34&s8=${name}` },
      { flag: '🇨🇳', label: 'SAMR — реестр компаний', url: `https://www.gsxt.gov.cn/corp-query-homepage.html` },
    );
  }
  // Universal
  links.push(
    { flag: '🌐', label: 'Google — иски/претензии', url: `https://www.google.com/search?q=${name}+иски+мошенничество+претензии` },
    { flag: '🌐', label: 'LinkedIn', url: `https://www.linkedin.com/search/results/companies/?keywords=${name}` },
  );

  return links;
}

// ── Buyer detail panel ─────────────────────────────────────────────────────

function BuyerDetail({ buyer, onClose, onUpdate }: {
  buyer: BuyerLight;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<BuyerLight>) => void;
}) {
  const [full, setFull] = useState<BuyerFull | null>(null);
  const [loadingFull, setLoadingFull] = useState(true);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState(buyer.adminNotes ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/buyers/${buyer.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setFull(d); })
      .finally(() => setLoadingFull(false));
  }, [buyer.id]);

  async function doAction() {
    if (action === 'reject' && !reason.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/admin/buyers/${buyer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, rejectionReason: reason, adminNotes: notes }),
    });
    setSaving(false);
    if (res.ok) {
      onUpdate(buyer.id, {
        status: action === 'approve' ? 'approved' : 'rejected',
        rejectionReason: reason,
        adminNotes: notes,
      });
      onClose();
    }
  }

  async function saveNotes() {
    setSaving(true);
    await fetch(`/api/admin/buyers/${buyer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'notes', adminNotes: notes }),
    });
    setSaving(false);
    onUpdate(buyer.id, { adminNotes: notes });
  }

  const links = verifyLinks(buyer);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-end">
      <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-bold text-gray-900 text-lg truncate">{buyer.companyName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl ml-4">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${STATUS_COLORS[buyer.status]}`}>
              {STATUS_LABELS[buyer.status]}
            </span>
            <span className="text-xs text-gray-400">Зарегистрирован: {new Date(buyer.createdAt).toLocaleDateString('ru-RU')}</span>
          </div>

          {/* Company info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <p className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-3">Данные компании</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {[
                ['Страна', buyer.country],
                ['Рег. номер / БИН', buyer.registrationNumber],
                ['Директор', buyer.directorName],
                ['Контакт', buyer.contactName],
                ['Email', buyer.email],
                ['Телефон', buyer.phone],
                ...(buyer.website ? [['Сайт', buyer.website]] : []),
              ].map(([k, v]) => (
                <div key={k}>
                  <span className="text-gray-400 text-xs">{k}</span>
                  <p className="text-gray-900 font-medium">{v}</p>
                </div>
              ))}
            </div>
            {buyer.address && (
              <div className="border-t border-gray-200 pt-2 mt-2">
                <span className="text-gray-400 text-xs">Адрес</span>
                <p className="text-gray-900 font-medium">{buyer.address}</p>
              </div>
            )}
            {buyer.description && (
              <div className="border-t border-gray-200 pt-2 mt-2">
                <span className="text-gray-400 text-xs">О компании</span>
                <p className="text-gray-700">{buyer.description}</p>
              </div>
            )}
          </div>

          {/* Documents */}
          <div>
            <p className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-3">Документы</p>
            {loadingFull ? (
              <p className="text-sm text-gray-400">Загрузка документов...</p>
            ) : (
              <div className="space-y-2">
                {[
                  { label: 'Устав компании', doc: full?.charterDoc, has: buyer.hasCharter },
                  { label: 'Справка о гос. регистрации', doc: full?.registrationDoc, has: buyer.hasRegistration },
                  { label: 'Паспорт директора / учредителя', doc: full?.passportDoc, has: buyer.hasPassport },
                ].map(({ label, doc, has }) => (
                  <div key={label} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={has ? 'text-green-500' : 'text-gray-300'}>📄</span>
                      <span className="text-sm text-gray-700">{label}</span>
                    </div>
                    {doc ? (
                      <a href={doc.base64} download={doc.fileName}
                        className="text-primary-700 text-xs font-medium hover:underline flex items-center gap-1">
                        ⬇ Скачать
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">{has ? 'Загружен' : 'Не загружен'}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verification links */}
          <div>
            <p className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-3">Проверка по базам</p>
            <div className="grid grid-cols-1 gap-2">
              {links.map(({ flag, label, url }) => (
                <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary-700 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl px-4 py-2.5 transition-colors">
                  <span>{flag}</span>
                  <span className="font-medium">{label}</span>
                  <span className="ml-auto text-primary-400">↗</span>
                </a>
              ))}
            </div>
          </div>

          {/* Admin notes */}
          <div>
            <p className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-2">Заметки администратора</p>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={3} placeholder="Результаты проверки, замечания..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-400" />
            <button onClick={saveNotes} disabled={saving}
              className="mt-2 text-sm text-gray-600 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-colors">
              {saving ? 'Сохранение...' : 'Сохранить заметки'}
            </button>
          </div>

          {/* Reject reason */}
          {action === 'reject' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Причина отказа <span className="text-red-500">*</span></label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                rows={2} placeholder="Укажите причину для покупателя..."
                className="w-full border border-red-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>
          )}

          {/* Action buttons */}
          {buyer.status === 'pending' && (
            <div className="flex gap-3 border-t border-gray-100 pt-4">
              {action === null ? (
                <>
                  <button onClick={() => setAction('approve')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl text-sm transition-colors">
                    ✓ Одобрить и отправить инвайт
                  </button>
                  <button onClick={() => setAction('reject')}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-xl text-sm transition-colors">
                    ✗ Отклонить
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setAction(null)}
                    className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl text-sm transition-colors">
                    Отмена
                  </button>
                  <button onClick={doAction} disabled={saving || (action === 'reject' && !reason.trim())}
                    className={`flex-1 font-medium py-3 rounded-xl text-sm transition-colors disabled:opacity-60 text-white
                      ${action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}>
                    {saving ? 'Обработка...' : action === 'approve' ? 'Подтвердить одобрение' : 'Подтвердить отказ'}
                  </button>
                </>
              )}
            </div>
          )}

          {buyer.status !== 'pending' && buyer.status === 'rejected' && (
            <div className="border-t border-gray-100 pt-4">
              <button onClick={() => { setAction('approve'); doAction(); }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl text-sm transition-colors">
                Одобрить (изменить решение)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main admin page ────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const router = useRouter();

  // Tabs
  const [tab, setTab] = useState<'suppliers' | 'buyers'>('suppliers');

  // Suppliers state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierFilter, setSupplierFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [createErr, setCreateErr] = useState('');

  // Buyers state
  const [buyers, setBuyers] = useState<BuyerLight[]>([]);
  const [buyerFilter, setBuyerFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerLight | null>(null);

  // Load suppliers
  useEffect(() => {
    fetch('/api/admin/suppliers')
      .then((r) => {
        if (r.status === 401) { router.push(`/${locale}/admin/login`); return null; }
        return r.json();
      })
      .then((data) => { if (data) { setSuppliers(data); setLoadingSuppliers(false); } });
  }, []);

  // Load buyers when tab switches
  useEffect(() => {
    if (tab !== 'buyers' || buyers.length > 0) return;
    setLoadingBuyers(true);
    fetch('/api/admin/buyers')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setBuyers(data))
      .finally(() => setLoadingBuyers(false));
  }, [tab]);

  // Suppliers actions
  async function updateSupplierStatus(id: string, status: 'approved' | 'rejected') {
    const res = await fetch(`/api/admin/suppliers/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setSuppliers((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
  }

  async function deleteSupplier(id: string, name: string) {
    if (!confirm(`Удалить поставщика «${name}»?`)) return;
    const res = await fetch(`/api/admin/suppliers/${id}`, { method: 'DELETE' });
    if (res.ok) setSuppliers((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setCreateErr(''); setCreating(true);
    const res = await fetch('/api/admin/suppliers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    });
    setCreating(false);
    if (res.ok) {
      const s = await res.json();
      setSuppliers((prev) => [s, ...prev]);
      setShowCreate(false); setCreateForm(emptyForm);
    } else {
      const data = await res.json(); setCreateErr(data.error || 'Ошибка при создании');
    }
  }

  function toggleProduct(pid: string) {
    setCreateForm((prev) => ({
      ...prev,
      products: prev.products.includes(pid)
        ? prev.products.filter((p) => p !== pid)
        : [...prev.products, pid],
    }));
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push(`/${locale}/admin/login`);
  }

  // Derived
  const filteredSuppliers = supplierFilter === 'all' ? suppliers : suppliers.filter((s) => s.status === supplierFilter);
  const supplierCounts = {
    all: suppliers.length,
    pending:  suppliers.filter((s) => s.status === 'pending').length,
    approved: suppliers.filter((s) => s.status === 'approved').length,
    rejected: suppliers.filter((s) => s.status === 'rejected').length,
  };

  const filteredBuyers = buyerFilter === 'all' ? buyers : buyers.filter((b) => b.status === buyerFilter);
  const buyerCounts = {
    all: buyers.length,
    pending:  buyers.filter((b) => b.status === 'pending').length,
    approved: buyers.filter((b) => b.status === 'approved').length,
    rejected: buyers.filter((b) => b.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">KTZ</span>
          </div>
          <span className="font-bold text-gray-900">KTZ Export</span>
          <span className="text-gray-400 text-sm ml-2">/ {t('dashboardTitle')}</span>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600 transition-colors">
          {t('logout')} →
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Main tabs */}
        <div className="flex gap-1 mb-8 bg-gray-100 rounded-xl p-1 w-fit">
          <button onClick={() => setTab('suppliers')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'suppliers' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            Поставщики
            {supplierCounts.pending > 0 && (
              <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5">{supplierCounts.pending}</span>
            )}
          </button>
          <button onClick={() => setTab('buyers')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'buyers' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            Покупатели
            {buyerCounts.pending > 0 && (
              <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5">{buyerCounts.pending}</span>
            )}
          </button>
        </div>

        {/* ── SUPPLIERS TAB ── */}
        {tab === 'suppliers' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{t('suppliersTitle')}</h1>
              <button onClick={() => { setShowCreate(!showCreate); setCreateErr(''); }}
                className="bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                {showCreate ? '✕ Отмена' : '+ Создать поставщика'}
              </button>
            </div>

            {showCreate && (
              <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-primary-200 shadow-sm p-6 mb-6 space-y-4">
                <h2 className="font-bold text-gray-900 text-lg">Новый поставщик</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    ['companyName', 'Компания *', 'ТОО Агрохолдинг', true],
                    ['country', 'Страна *', 'Казахстан', true],
                    ['contactName', 'Контактное лицо *', 'Иванов Иван', true],
                    ['email', 'Email *', 'info@company.kz', true],
                    ['phone', 'Телефон *', '+7 701 000 00 00', true],
                    ['annualVolume', 'Годовой объём', '10 000 тонн/год', false],
                    ['elevatorName', 'Элеватор', 'Элеватор г. Астана', false],
                  ].map(([field, label, placeholder, req]) => (
                    <div key={field as string}>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label as string}</label>
                      <input required={req as boolean} value={createForm[field as keyof typeof createForm] as string}
                        onChange={(e) => setCreateForm((p) => ({ ...p, [field as string]: e.target.value }))}
                        placeholder={placeholder as string}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Станция погрузки</label>
                    <select value={createForm.loadingStation}
                      onChange={(e) => setCreateForm((p) => ({ ...p, loadingStation: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                      <option value="">— Выберите —</option>
                      {LOADING_STATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Пароль * (мин. 8 символов)</label>
                    <input required minLength={8} type="password" value={createForm.password}
                      onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="Минимум 8 символов"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Описание</label>
                  <textarea rows={2} value={createForm.description}
                    onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Продукты *</label>
                  <div className="flex flex-wrap gap-2">
                    {PRODUCT_LIST.map((p) => (
                      <button key={p.id} type="button" onClick={() => toggleProduct(p.id)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          createForm.products.includes(p.id)
                            ? `bg-gradient-to-r ${p.from} ${p.to} ${p.text} ${p.border} font-medium`
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                        {p.emoji} {PRODUCT_LABELS[p.id]}
                      </button>
                    ))}
                  </div>
                </div>
                {createErr && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{createErr}</p>}
                <button type="submit" disabled={creating}
                  className="bg-primary-700 hover:bg-primary-800 disabled:bg-primary-400 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm">
                  {creating ? 'Создаём...' : 'Создать поставщика'}
                </button>
              </form>
            )}

            <div className="flex gap-2 mb-6 flex-wrap">
              {(['all','pending','approved','rejected'] as const).map((f) => (
                <button key={f} onClick={() => setSupplierFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    supplierFilter === f ? 'bg-primary-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
                  }`}>
                  {f === 'all' ? 'Все' : t(f as any)} ({supplierCounts[f]})
                </button>
              ))}
            </div>

            {loadingSuppliers ? (
              <div className="text-center py-16 text-gray-400">Загружаем...</div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="text-center py-16 text-gray-400">{t('noApplications')}</div>
            ) : (
              <div className="space-y-4">
                {filteredSuppliers.map((supplier) => (
                  <div key={supplier.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="font-bold text-gray-900">{supplier.companyName}</h2>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[supplier.status]}`}>
                            {t(`status.${supplier.status}` as any)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                          <span>🌍 {supplier.country}</span>
                          <span>👤 {supplier.contactName}</span>
                          <span>📧 {supplier.email}</span>
                          <span>📞 {supplier.phone}</span>
                          <span>📦 {supplier.products.map((p) => PRODUCT_LABELS[p] ?? p).join(', ')}</span>
                          <span>⚖️ {supplier.annualVolume}</span>
                          {supplier.loadingStation && <span>🚉 {supplier.loadingStation}</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">{t('submittedAt')}: {new Date(supplier.createdAt).toLocaleString('ru-RU')}</p>
                      </div>
                      <div className="flex gap-2 shrink-0 flex-wrap">
                        {supplier.status !== 'approved' && (
                          <button onClick={() => updateSupplierStatus(supplier.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
                            {t('approve')} ✓
                          </button>
                        )}
                        {supplier.status !== 'rejected' && (
                          <button onClick={() => updateSupplierStatus(supplier.id, 'rejected')}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
                            {t('reject')} ✗
                          </button>
                        )}
                        <button onClick={() => deleteSupplier(supplier.id, supplier.companyName)}
                          className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
                          Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── BUYERS TAB ── */}
        {tab === 'buyers' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Покупатели</h1>
              <span className="text-sm text-gray-500 bg-white border border-gray-200 px-4 py-2 rounded-lg">
                Всего: {buyers.length}
              </span>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
              {(['all','pending','approved','rejected'] as const).map((f) => (
                <button key={f} onClick={() => setBuyerFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    buyerFilter === f ? 'bg-primary-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
                  }`}>
                  {f === 'all' ? 'Все' : STATUS_LABELS[f]} ({buyerCounts[f]})
                </button>
              ))}
            </div>

            {loadingBuyers ? (
              <div className="text-center py-16 text-gray-400">Загружаем...</div>
            ) : filteredBuyers.length === 0 ? (
              <div className="text-center py-16 text-gray-400">Заявок нет</div>
            ) : (
              <div className="space-y-3">
                {filteredBuyers.map((buyer) => (
                  <div key={buyer.id}
                    onClick={() => setSelectedBuyer(buyer)}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:border-primary-300 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="font-bold text-gray-900">{buyer.companyName}</h2>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[buyer.status]}`}>
                            {STATUS_LABELS[buyer.status]}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                          <span>🌍 {buyer.country}</span>
                          <span>🔢 {buyer.registrationNumber}</span>
                          <span>👤 {buyer.directorName}</span>
                          <span>📧 {buyer.email}</span>
                        </div>
                        <div className="flex gap-3 mt-2 text-xs">
                          {[
                            ['📋 Устав', buyer.hasCharter],
                            ['📄 Рег. справка', buyer.hasRegistration],
                            ['🪪 Паспорт', buyer.hasPassport],
                          ].map(([label, has]) => (
                            <span key={label as string} className={has ? 'text-green-600' : 'text-gray-300'}>
                              {has ? '✓' : '○'} {label as string}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs text-gray-400">{new Date(buyer.createdAt).toLocaleDateString('ru-RU')}</span>
                        <span className="text-primary-600 text-xs font-medium">Открыть →</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Buyer detail side panel */}
      {selectedBuyer && (
        <BuyerDetail
          buyer={selectedBuyer}
          onClose={() => setSelectedBuyer(null)}
          onUpdate={(id, patch) => {
            setBuyers((prev) => prev.map((b) => b.id === id ? { ...b, ...patch } : b));
            setSelectedBuyer((prev) => prev ? { ...prev, ...patch } : null);
          }}
        />
      )}
    </div>
  );
}
