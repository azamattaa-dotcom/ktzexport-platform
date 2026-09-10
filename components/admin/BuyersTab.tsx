'use client';
import { useEffect, useState } from 'react';
import { STATUS_COLORS, STATUS_LABELS } from './shared';

interface BuyerLight {
  id: string;
  companyName: string;
  country: string;
  registrationNumber: string;
  legalAddress: string;
  postalAddress: string;
  signatoryName: string;
  signatoryType: string;
  signatoryCustomType?: string;
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  description?: string;
  bankName: string;
  swift: string;
  bankAccount: string;
  bankCurrency: string;
  unloadingRegion: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  adminNotes?: string;
  hasCharter: boolean;
  hasRegistration: boolean;
  hasPassport: boolean;
  createdAt: string;
}

interface BuyerFull extends BuyerLight {
  charterDoc?: { url?: string; base64?: string; fileName: string };
  registrationDoc?: { url?: string; base64?: string; fileName: string };
  passportDoc?: { url?: string; base64?: string; fileName: string };
}

const SIGNATORY_LABELS: Record<string, string> = {
  director:  'Директор',
  ceo:       'Генеральный директор',
  legal_rep: 'Законный представитель / 法定代表人',
};

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
  links.push(
    { flag: '🌐', label: 'Google — иски/претензии', url: `https://www.google.com/search?q=${name}+иски+мошенничество+претензии` },
    { flag: '🌐', label: 'LinkedIn', url: `https://www.linkedin.com/search/results/companies/?keywords=${name}` },
  );

  return links;
}

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
          <div className="space-y-4 text-sm">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-3">Компания</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {[
                  ['Страна', buyer.country],
                  ['Рег. номер / БИН / USCC', buyer.registrationNumber],
                  ['Юридический адрес', buyer.legalAddress],
                  ['Почтовый адрес', buyer.postalAddress],
                  ['Email', buyer.email],
                  ['Телефон', buyer.phone],
                  ['Контактное лицо', buyer.contactName],
                  ...(buyer.website ? [['Сайт', buyer.website]] : []),
                ].map(([k, v]) => (
                  <div key={k}>
                    <span className="text-gray-400 text-xs">{k}</span>
                    <p className="text-gray-900 font-medium break-words">{v}</p>
                  </div>
                ))}
              </div>
              {buyer.description && (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <span className="text-gray-400 text-xs">О компании</span>
                  <p className="text-gray-700 mt-0.5">{buyer.description}</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-3">Подписант</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <span className="text-gray-400 text-xs">ФИО</span>
                  <p className="text-gray-900 font-medium">{buyer.signatoryName}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Должность</span>
                  <p className="text-gray-900 font-medium">
                    {buyer.signatoryType === 'other'
                      ? buyer.signatoryCustomType
                      : SIGNATORY_LABELS[buyer.signatoryType] ?? buyer.signatoryType}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-3">Банковские реквизиты</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {[
                  ['Банк', buyer.bankName],
                  ['БИК / SWIFT', buyer.swift],
                  ['Номер счёта', buyer.bankAccount],
                  ['Валюта', buyer.bankCurrency],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span className="text-gray-400 text-xs">{k}</span>
                    <p className="text-gray-900 font-medium">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="font-semibold text-blue-500 text-xs uppercase tracking-wide mb-1">Регион выгрузки</p>
              <p className="text-blue-900 font-semibold">{buyer.unloadingRegion}</p>
            </div>
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
                      <a href={doc.url ?? doc.base64} download={doc.fileName}
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

interface Props {
  buyers: BuyerLight[];
  setBuyers: React.Dispatch<React.SetStateAction<BuyerLight[]>>;
  loadingBuyers: boolean;
}

export default function BuyersTab({ buyers, setBuyers, loadingBuyers }: Props) {
  const [buyerFilter, setBuyerFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerLight | null>(null);

  const filteredBuyers = buyerFilter === 'all' ? buyers : buyers.filter((b) => b.status === buyerFilter);
  const buyerCounts = {
    all: buyers.length,
    pending:  buyers.filter((b) => b.status === 'pending').length,
    approved: buyers.filter((b) => b.status === 'approved').length,
    rejected: buyers.filter((b) => b.status === 'rejected').length,
  };

  return (
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
                    <span>👤 {buyer.signatoryName}</span>
                    <span>📧 {buyer.email}</span>
                    <span>📍 {buyer.unloadingRegion}</span>
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
    </>
  );
}
