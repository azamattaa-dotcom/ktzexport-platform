'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Supplier } from '@/lib/db';
import { PRODUCT_LIST } from '@/lib/products';
import { STATIONS } from '@/lib/stations';
import SupplierProductManager from '@/components/SupplierProductManager';
import StationAutocomplete from '@/components/StationAutocomplete';
import { STATUS_COLORS } from './shared';

const PRODUCT_LABELS: Record<string, string> = {
  flour_feed: 'Кормовая мука', flour_wheat: 'Пшеничная мука', wheat: 'Пшеница',
  barley: 'Ячмень', bran: 'Пшеничные отруби', flaxseed: 'Семена льна',
  sunflower: 'Семена подсолнечника', corn: 'Кукуруза', groats: 'Крупы',
};

const LOADING_STATIONS = [...STATIONS, 'Другая'];

const emptyForm = {
  companyName: '', country: 'Казахстан', contactName: '', email: '', phone: '',
  products: [] as string[], annualVolume: '', description: '', elevatorName: '',
  loadingStation: '', password: '', letterheadBase64: '', letterheadFileName: '',
};

interface EditForm {
  companyName: string; country: string; contactName: string; email: string; phone: string;
  products: string[]; annualVolume: string;
  description: string; elevatorName: string; loadingStation: string;
  letterheadBase64?: string; letterheadFileName?: string;
}
const emptyEditForm: EditForm = {
  companyName: '', country: '', contactName: '', email: '', phone: '',
  products: [], annualVolume: '',
  description: '', elevatorName: '', loadingStation: '',
  letterheadBase64: '', letterheadFileName: '',
};

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/png'];

interface Props {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  loadingSuppliers: boolean;
}

export default function SuppliersTab({ suppliers, setSuppliers, loadingSuppliers }: Props) {
  const t = useTranslations('admin');

  const [supplierFilter, setSupplierFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [createErr, setCreateErr] = useState('');
  const [createLogoFileErr, setCreateLogoFileErr] = useState('');

  // Edit-supplier modal
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(emptyEditForm);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editErr, setEditErr] = useState('');
  const [logoFileErr, setLogoFileErr] = useState('');
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [sendingCredId, setSendingCredId] = useState<string | null>(null);

  async function updateSupplierStatus(id: string, status: 'approved' | 'rejected') {
    const res = await fetch(`/api/admin/suppliers/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setSuppliers((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
  }

  async function togglePublished(supplier: Supplier) {
    setPublishingId(supplier.id);
    const res = await fetch(`/api/admin/suppliers/${supplier.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !supplier.published }),
    });
    setPublishingId(null);
    if (res.ok) {
      const updated = await res.json();
      setSuppliers((prev) => prev.map((s) => s.id === supplier.id ? { ...s, ...updated } : s));
    }
  }

  async function sendCredentials(supplier: Supplier) {
    if (!confirm(`Сгенерировать новый пароль и выслать на ${supplier.email}? Старый пароль (если был) перестанет работать.`)) return;
    setSendingCredId(supplier.id);
    const res = await fetch(`/api/admin/suppliers/${supplier.id}/credentials`, { method: 'POST' });
    setSendingCredId(null);
    if (res.ok) {
      setSuppliers((prev) => prev.map((s) => s.id === supplier.id ? { ...s, status: 'approved' } : s));
      alert(`Логин и пароль отправлены на ${supplier.email}`);
    } else {
      alert('Не удалось отправить. Попробуйте ещё раз.');
    }
  }

  function openEdit(supplier: Supplier) {
    setEditingSupplier(supplier);
    setEditErr('');
    setLogoFileErr('');
    setEditForm({
      companyName: supplier.companyName,
      country: supplier.country,
      contactName: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone,
      products: supplier.products,
      annualVolume: supplier.annualVolume,
      description: supplier.description,
      elevatorName: supplier.elevatorName,
      loadingStation: supplier.loadingStation ?? '',
      letterheadBase64: supplier.letterheadUrl ?? supplier.letterheadBase64 ?? '',
      letterheadFileName: supplier.letterheadFileName ?? '',
    });
  }

  function handleEditLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setLogoFileErr('Разрешены только изображения JPEG или PNG');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoFileErr('Файл слишком большой (максимум 2 МБ)');
      return;
    }
    setLogoFileErr('');
    const reader = new FileReader();
    reader.onload = (ev) => setEditForm((p) => ({
      ...p,
      letterheadBase64: ev.target?.result as string,
      letterheadFileName: file.name,
    }));
    reader.readAsDataURL(file);
  }

  function clearEditLogo() {
    setEditForm((p) => ({ ...p, letterheadBase64: '', letterheadFileName: '' }));
    setLogoFileErr('');
  }

  function handleCreateLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setCreateLogoFileErr('Разрешены только изображения JPEG или PNG');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setCreateLogoFileErr('Файл слишком большой (максимум 2 МБ)');
      return;
    }
    setCreateLogoFileErr('');
    const reader = new FileReader();
    reader.onload = (ev) => setCreateForm((p) => ({
      ...p,
      letterheadBase64: ev.target?.result as string,
      letterheadFileName: file.name,
    }));
    reader.readAsDataURL(file);
  }

  function clearCreateLogo() {
    setCreateForm((p) => ({ ...p, letterheadBase64: '', letterheadFileName: '' }));
    setCreateLogoFileErr('');
  }

  function toggleEditProduct(pid: string) {
    setEditForm((prev) => ({
      ...prev,
      products: prev.products.includes(pid)
        ? prev.products.filter((p) => p !== pid)
        : [...prev.products, pid],
    }));
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSupplier) return;
    if (editForm.products.length === 0) { setEditErr('Выберите хотя бы один продукт'); return; }
    setSavingEdit(true); setEditErr('');
    const res = await fetch(`/api/admin/suppliers/${editingSupplier.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setSavingEdit(false);
    if (res.ok) {
      const updated = await res.json();
      setSuppliers((prev) => prev.map((s) => s.id === editingSupplier.id ? { ...s, ...updated } : s));
      setEditingSupplier(updated);
    } else {
      const data = await res.json();
      setEditErr(data.error || 'Ошибка при сохранении');
    }
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
      setShowCreate(false); setCreateForm(emptyForm); setCreateLogoFileErr('');
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

  const filteredSuppliers = supplierFilter === 'all' ? suppliers : suppliers.filter((s) => s.status === supplierFilter);
  const supplierCounts = {
    all: suppliers.length,
    pending:  suppliers.filter((s) => s.status === 'pending').length,
    approved: suppliers.filter((s) => s.status === 'approved').length,
    rejected: suppliers.filter((s) => s.status === 'rejected').length,
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('suppliersTitle')}</h1>
        <button onClick={() => { setShowCreate(!showCreate); setCreateErr(''); setCreateLogoFileErr(''); }}
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
              <StationAutocomplete
                options={LOADING_STATIONS}
                value={createForm.loadingStation}
                onChange={(s) => setCreateForm((p) => ({ ...p, loadingStation: s }))}
                placeholder="— Выберите —"
              />
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
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Товарный знак компании</label>
            <div className="flex items-center gap-3">
              {createForm.letterheadBase64 ? (
                <img src={createForm.letterheadBase64} alt="Товарный знак"
                  className="w-14 h-14 rounded-lg object-cover border border-gray-200 shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xl shrink-0">🖼️</div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-primary-700 border border-primary-200 hover:bg-primary-50 rounded-lg px-3 py-1.5 cursor-pointer transition-colors w-fit">
                  {createForm.letterheadBase64 ? 'Заменить файл' : 'Загрузить файл'}
                  <input type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" className="hidden" onChange={handleCreateLogoFile} />
                </label>
                {createForm.letterheadBase64 && (
                  <button type="button" onClick={clearCreateLogo} className="text-xs text-gray-400 hover:text-red-500 w-fit">Удалить</button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">JPEG или PNG, до 2 МБ</p>
            {createLogoFileErr && <p className="text-xs text-red-500 mt-1">{createLogoFileErr}</p>}
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
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 ${supplier.published ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                      {supplier.published ? '🌐 Видно покупателям' : '🔒 Скрыт от покупателей'}
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
                  <button onClick={() => togglePublished(supplier)} disabled={publishingId === supplier.id}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
                    {supplier.published ? 'Скрыть с сайта' : 'Показать на сайте'}
                  </button>
                  <button onClick={() => openEdit(supplier)}
                    className="bg-gray-700 hover:bg-gray-800 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
                    Редактировать ✎
                  </button>
                  <button onClick={() => sendCredentials(supplier)} disabled={sendingCredId === supplier.id}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
                    Выслать логин/пароль ✉
                  </button>
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

      {editingSupplier && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setEditingSupplier(null)}>
          <div className="bg-gray-50 rounded-2xl max-w-2xl w-full my-8 p-6 space-y-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Редактирование: {editingSupplier.companyName}</h2>
              <button onClick={() => setEditingSupplier(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <form onSubmit={saveEdit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  ['companyName', 'Компания *'],
                  ['country', 'Страна'],
                  ['contactName', 'Контактное лицо *'],
                  ['email', 'Email *'],
                  ['phone', 'Телефон *'],
                  ['annualVolume', 'Годовой объём'],
                  ['elevatorName', 'Элеватор'],
                ] as const).map(([field, label]) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
                    <input required={field === 'companyName' || field === 'contactName' || field === 'email' || field === 'phone'}
                      type={field === 'email' ? 'email' : 'text'}
                      value={editForm[field]}
                      onChange={(e) => setEditForm((p) => ({ ...p, [field]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Станция погрузки</label>
                  <StationAutocomplete
                    options={LOADING_STATIONS}
                    value={editForm.loadingStation}
                    onChange={(s) => setEditForm((p) => ({ ...p, loadingStation: s }))}
                    placeholder="— Выберите —"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Описание</label>
                <textarea rows={2} value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Товарный знак компании</label>
                <div className="flex items-center gap-3">
                  {editForm.letterheadBase64 ? (
                    <img src={editForm.letterheadBase64} alt="Товарный знак"
                      className="w-14 h-14 rounded-lg object-cover border border-gray-200 shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xl shrink-0">🖼️</div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-primary-700 border border-primary-200 hover:bg-primary-50 rounded-lg px-3 py-1.5 cursor-pointer transition-colors w-fit">
                      {editForm.letterheadBase64 ? 'Заменить файл' : 'Загрузить файл'}
                      <input type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" className="hidden" onChange={handleEditLogoFile} />
                    </label>
                    {editForm.letterheadBase64 && (
                      <button type="button" onClick={clearEditLogo} className="text-xs text-gray-400 hover:text-red-500 w-fit">Удалить</button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">JPEG или PNG, до 2 МБ</p>
                {logoFileErr && <p className="text-xs text-red-500 mt-1">{logoFileErr}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Продукты *</label>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_LIST.map((p) => (
                    <button key={p.id} type="button" onClick={() => toggleEditProduct(p.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        editForm.products.includes(p.id)
                          ? `bg-gradient-to-r ${p.from} ${p.to} ${p.text} ${p.border} font-medium`
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}>
                      {p.emoji} {PRODUCT_LABELS[p.id]}
                    </button>
                  ))}
                </div>
              </div>
              {editErr && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{editErr}</p>}
              <button type="submit" disabled={savingEdit}
                className="bg-primary-700 hover:bg-primary-800 disabled:bg-primary-400 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm">
                {savingEdit ? 'Сохраняем...' : 'Сохранить данные компании'}
              </button>
            </form>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Товары и цены</h3>
              <SupplierProductManager
                key={editingSupplier.id + editingSupplier.products.join(',')}
                supplier={editingSupplier}
                apiUrl={`/api/admin/suppliers/${editingSupplier.id}`}
                method="PUT"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
