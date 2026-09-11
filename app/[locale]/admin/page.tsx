'use client';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { Supplier } from '@/lib/db';
import ChatModerationTab from '@/components/admin/ChatModerationTab';
import LogisticsRequestsTab from '@/components/admin/LogisticsRequestsTab';
import SuppliersTab from '@/components/admin/SuppliersTab';
import BuyersTab from '@/components/admin/BuyersTab';

// ── Chat lead types ────────────────────────────────────────────────────────

interface LeadMessage {
  id: string;
  from: 'visitor' | 'admin';
  content: string;
  timestamp: string;
}

interface ChatLead {
  id: string;
  status: 'new' | 'active' | 'closed';
  intent: 'buyer' | 'supplier' | 'other';
  product?: string;
  volume?: string;
  contact: string;
  messages: LeadMessage[];
  createdAt: string;
  updatedAt: string;
}

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

// ── Main admin page ────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const router = useRouter();

  // Tabs
  const [tab, setTab] = useState<'suppliers' | 'buyers' | 'chats' | 'messages' | 'logistics'>('suppliers');

  // Suppliers/buyers state lives here — the nav badges need pending counts
  // regardless of which tab is active; everything else about each tab
  // (filters, forms, edit modals) is local to SuppliersTab/BuyersTab.
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

  const [buyers, setBuyers] = useState<BuyerLight[]>([]);
  const [loadingBuyers, setLoadingBuyers] = useState(false);

  // One-off Blob migration (see app/api/admin/migrate-files)
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ suppliersMigrated?: number; productCertificatesMigrated?: number; buyersMigrated?: number; errors: string[] } | null>(null);

  // One-off DB migration (see app/api/admin/migrate-db)
  const [migratingDb, setMigratingDb] = useState(false);
  const [dbMigrationResult, setDbMigrationResult] = useState<{ suppliers?: number; buyers?: number; chatThreads?: number; chatLeads?: number; logisticsRequests?: number; error?: string } | null>(null);

  // Chats state
  const [leads, setLeads] = useState<ChatLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [selectedLead, setSelectedLead] = useState<ChatLead | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

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

  // Load + poll leads
  useEffect(() => {
    if (tab !== 'chats') return;
    setLoadingLeads(true);
    fetch('/api/admin/chat').then((r) => r.ok ? r.json() : []).then(setLeads).finally(() => setLoadingLeads(false));
    const interval = setInterval(() => {
      fetch('/api/admin/chat').then((r) => r.ok ? r.json() : []).then((data) => {
        setLeads(data);
        setSelectedLead((prev) => prev ? data.find((l: ChatLead) => l.id === prev.id) ?? prev : null);
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [tab]);

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push(`/${locale}/admin/login`);
  }

  async function runFileMigration() {
    if (!confirm(
      'Перенести логотипы, сертификаты и документы покупателей из базы в файловое хранилище (Vercel Blob)?\n\n' +
      'Перед этим убедитесь, что вы скачали резервную копию. Действие безопасно повторять — уже перенесённые файлы пропускаются.'
    )) return;
    setMigrating(true);
    setMigrationResult(null);
    const res = await fetch('/api/admin/migrate-files', { method: 'POST' });
    const data = await res.json();
    setMigrating(false);
    setMigrationResult(res.ok ? data : { errors: [data.error ?? 'Не удалось выполнить перенос'] });
  }

  async function runDbMigration() {
    if (!confirm(
      'Перенести поставщиков, покупателей, чаты и заявки на логистику из KV в Postgres?\n\n' +
      'Перед этим убедитесь, что вы скачали свежую резервную копию. Действие безопасно повторять.'
    )) return;
    setMigratingDb(true);
    setDbMigrationResult(null);
    const res = await fetch('/api/admin/migrate-db', { method: 'POST' });
    const data = await res.json();
    setMigratingDb(false);
    setDbMigrationResult(res.ok ? data : { error: data.error ?? 'Не удалось выполнить перенос' });
  }

  async function sendAdminReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLead || !adminReply.trim()) return;
    setSendingReply(true);
    const res = await fetch(`/api/admin/chat/${selectedLead.id}/reply`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: adminReply.trim() }),
    });
    setSendingReply(false);
    if (res.ok) {
      setAdminReply('');
      const updated: ChatLead[] = await fetch('/api/admin/chat').then((r) => r.json());
      setLeads(updated);
      setSelectedLead(updated.find((l) => l.id === selectedLead.id) ?? null);
    }
  }

  async function closeLead(id: string) {
    await fetch(`/api/admin/chat/${id}/reply`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'closed' }),
    });
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status: 'closed' } : l));
    setSelectedLead((prev) => prev?.id === id ? { ...prev, status: 'closed' } : prev);
  }

  const pendingSuppliers = suppliers.filter((s) => s.status === 'pending').length;
  const pendingBuyers = buyers.filter((b) => b.status === 'pending').length;

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
        <div className="flex items-center gap-4">
          <a href="/api/admin/export" className="text-sm text-gray-500 hover:text-primary-700 transition-colors">
            ⬇ Резервная копия
          </a>
          <button onClick={runFileMigration} disabled={migrating}
            className="text-sm text-gray-500 hover:text-primary-700 disabled:opacity-50 transition-colors">
            {migrating ? 'Переносим файлы...' : '📦 Перенести файлы в Blob'}
          </button>
          <button onClick={runDbMigration} disabled={migratingDb}
            className="text-sm text-gray-500 hover:text-primary-700 disabled:opacity-50 transition-colors">
            {migratingDb ? 'Переносим базу...' : '🗄 Перенести базу в Postgres'}
          </button>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600 transition-colors">
            {t('logout')} →
          </button>
        </div>
      </header>

      {migrationResult && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <div className={`rounded-xl border px-4 py-3 text-sm ${migrationResult.errors.length ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
            <div className="flex items-center justify-between gap-3">
              <p>
                Готово: поставщиков — {migrationResult.suppliersMigrated ?? 0}, сертификатов — {migrationResult.productCertificatesMigrated ?? 0}, покупателей — {migrationResult.buyersMigrated ?? 0}.
                {migrationResult.errors.length > 0 && ` Ошибок: ${migrationResult.errors.length}.`}
              </p>
              <button onClick={() => setMigrationResult(null)} className="text-xs opacity-60 hover:opacity-100 shrink-0">✕</button>
            </div>
            {migrationResult.errors.length > 0 && (
              <ul className="mt-2 list-disc list-inside space-y-0.5">
                {migrationResult.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}

      {dbMigrationResult && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <div className={`rounded-xl border px-4 py-3 text-sm ${dbMigrationResult.error ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
            <div className="flex items-center justify-between gap-3">
              <p>
                {dbMigrationResult.error
                  ? dbMigrationResult.error
                  : `Готово: поставщиков — ${dbMigrationResult.suppliers ?? 0}, покупателей — ${dbMigrationResult.buyers ?? 0}, чатов — ${dbMigrationResult.chatThreads ?? 0}, лидов — ${dbMigrationResult.chatLeads ?? 0}, заявок на логистику — ${dbMigrationResult.logisticsRequests ?? 0}.`}
              </p>
              <button onClick={() => setDbMigrationResult(null)} className="text-xs opacity-60 hover:opacity-100 shrink-0">✕</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Main tabs */}
        <div className="flex gap-1 mb-8 bg-gray-100 rounded-xl p-1 w-fit">
          <button onClick={() => setTab('suppliers')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'suppliers' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            Поставщики
            {pendingSuppliers > 0 && (
              <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5">{pendingSuppliers}</span>
            )}
          </button>
          <button onClick={() => setTab('buyers')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'buyers' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            Покупатели
            {pendingBuyers > 0 && (
              <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5">{pendingBuyers}</span>
            )}
          </button>
          <button onClick={() => setTab('chats')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'chats' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            Чаты
            {leads.filter((l) => l.status === 'new').length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {leads.filter((l) => l.status === 'new').length}
              </span>
            )}
          </button>
          <button onClick={() => setTab('messages')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'messages' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            Сообщения
          </button>
          <button onClick={() => setTab('logistics')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'logistics' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            Логистика
          </button>
        </div>

        {tab === 'suppliers' && (
          <SuppliersTab suppliers={suppliers} setSuppliers={setSuppliers} loadingSuppliers={loadingSuppliers} />
        )}

        {tab === 'buyers' && (
          <BuyersTab buyers={buyers} setBuyers={setBuyers} loadingBuyers={loadingBuyers} />
        )}

        {/* ── CHATS TAB ── */}
        {tab === 'chats' && (
          <div className="flex gap-6 h-[calc(100vh-220px)] min-h-[400px]">

            {/* Lead list */}
            <div className="w-72 shrink-0 flex flex-col gap-2 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-xl font-bold text-gray-900">Чаты</h1>
                <span className="text-xs text-gray-400">{leads.length} лидов</span>
              </div>

              {loadingLeads ? (
                <div className="text-center py-8 text-gray-400 text-sm">Загружаем...</div>
              ) : leads.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Лидов пока нет</div>
              ) : leads.map((lead) => (
                <button key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedLead?.id === lead.id
                      ? 'bg-primary-50 border-primary-300 shadow-sm'
                      : 'bg-white border-gray-100 hover:border-primary-200 hover:shadow-sm'
                  }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm truncate">{lead.contact}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {lead.intent === 'buyer' ? '🛒 Покупатель' : lead.intent === 'supplier' ? '🚜 Поставщик' : '—'}
                        {lead.product ? ` · ${lead.product}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        lead.status === 'new' ? 'bg-red-100 text-red-700' :
                        lead.status === 'active' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {lead.status === 'new' ? 'Новый' : lead.status === 'active' ? 'Активный' : 'Закрыт'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(lead.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  {lead.messages.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1.5 truncate">
                      {lead.messages[lead.messages.length - 1].from === 'admin' ? '↩ ' : ''}
                      {lead.messages[lead.messages.length - 1].content}
                    </p>
                  )}
                </button>
              ))}
            </div>

            {/* Chat panel */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
              {!selectedLead ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center space-y-2">
                    <div className="text-4xl">💬</div>
                    <p className="text-sm">Выберите лид слева</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between shrink-0">
                    <div>
                      <p className="font-bold text-gray-900">{selectedLead.contact}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {selectedLead.intent === 'buyer' ? '🛒 Покупатель' : '🚜 Поставщик'}
                        {selectedLead.product && ` · ${selectedLead.product}`}
                        {selectedLead.volume && ` · ${selectedLead.volume}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        selectedLead.status === 'new' ? 'bg-red-100 text-red-700' :
                        selectedLead.status === 'active' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {selectedLead.status === 'new' ? 'Новый' : selectedLead.status === 'active' ? 'Активный' : 'Закрыт'}
                      </span>
                      {selectedLead.status !== 'closed' && (
                        <button onClick={() => closeLead(selectedLead.id)}
                          className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2.5 py-1 rounded-lg transition-colors">
                          Закрыть
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lead info */}
                  <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex gap-6 text-xs text-gray-500 shrink-0 flex-wrap">
                    <span>📅 {new Date(selectedLead.createdAt).toLocaleString('ru-RU')}</span>
                    {selectedLead.product && <span>📦 {selectedLead.product}</span>}
                    {selectedLead.volume && <span>⚖️ {selectedLead.volume}</span>}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    {selectedLead.messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        Посетитель оставил контакт, но ещё не написал сообщений.<br />
                        Напишите первым — ответ придёт в чат-виджет.
                      </div>
                    ) : selectedLead.messages.map((m) => (
                      <div key={m.id} className={`flex ${m.from === 'admin' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          m.from === 'admin'
                            ? 'bg-primary-700 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}>
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          <p className={`text-xs mt-1 ${m.from === 'admin' ? 'text-white/60' : 'text-gray-400'}`}>
                            {m.from === 'admin' ? 'Вы' : 'Посетитель'} · {new Date(m.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply input */}
                  {selectedLead.status !== 'closed' ? (
                    <form onSubmit={sendAdminReply}
                      className="border-t border-gray-100 px-4 py-3 flex gap-2 items-end shrink-0">
                      <textarea
                        value={adminReply}
                        onChange={(e) => setAdminReply(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAdminReply(e as unknown as React.FormEvent); } }}
                        placeholder="Напишите ответ... (Enter — отправить, Shift+Enter — новая строка)"
                        rows={2}
                        className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none bg-gray-50"
                      />
                      <button type="submit" disabled={!adminReply.trim() || sendingReply}
                        className="h-10 px-4 bg-primary-700 hover:bg-primary-800 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors shrink-0">
                        {sendingReply ? '...' : 'Отправить'}
                      </button>
                    </form>
                  ) : (
                    <div className="border-t border-gray-100 px-4 py-3 text-center text-xs text-gray-400 shrink-0">
                      Чат закрыт
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── MESSAGES TAB (chat moderation) ── */}
        {tab === 'messages' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Сообщения на проверке</h1>
            <ChatModerationTab />
          </>
        )}

        {/* ── LOGISTICS TAB ── */}
        {tab === 'logistics' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Заявки на логистику</h1>
            <LogisticsRequestsTab />
          </>
        )}
      </main>
    </div>
  );
}
