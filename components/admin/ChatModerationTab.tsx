'use client';
import { useState, useEffect } from 'react';

interface PendingItem {
  threadId: string;
  messageId: string;
  fromType: 'buyer' | 'supplier';
  content: string;
  timestamp: number;
  buyerName: string;
  buyerEmail: string;
  supplierId: string;
  supplierName: string;
  productLabel: string;
}

function PendingCard({ item, onDone }: { item: PendingItem; onDone: () => void }) {
  const [text, setText] = useState(item.content);
  const [busy, setBusy] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  async function review(action: 'approve' | 'reject') {
    setBusy(true);
    const res = await fetch('/api/admin/chat-inbox/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        threadId: item.threadId,
        messageId: item.messageId,
        action,
        editedContent: action === 'approve' && text.trim() !== item.content ? text : undefined,
      }),
    });
    setBusy(false);
    if (res.ok) onDone();
  }

  async function sendAdminReply() {
    if (!replyText.trim()) return;
    setBusy(true);
    const res = await fetch('/api/admin/chat-inbox/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId: item.threadId, content: replyText }),
    });
    setBusy(false);
    if (res.ok) { setReplyText(''); setReplyOpen(false); onDone(); }
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleString(undefined, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm">
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${
            item.fromType === 'buyer' ? 'bg-blue-50 text-blue-700' : 'bg-primary-50 text-primary-700'
          }`}>
            {item.fromType === 'buyer' ? 'От покупателя' : 'От поставщика'}
          </span>
          <span className="text-gray-500">{formatTime(item.timestamp)}</span>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        Покупатель: <span className="font-medium text-gray-900">{item.buyerName}</span> ({item.buyerEmail}) ·{' '}
        Поставщик: <span className="font-medium text-gray-900">{item.supplierName}</span> · Товар: {item.productLabel}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
      />

      <div className="flex flex-wrap gap-2">
        <button onClick={() => review('approve')} disabled={busy}
          className="bg-primary-700 hover:bg-primary-800 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Одобрить
        </button>
        <button onClick={() => review('reject')} disabled={busy}
          className="border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Отклонить
        </button>
        <button onClick={() => setReplyOpen((v) => !v)} disabled={busy}
          className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Ответить самостоятельно
        </button>
      </div>

      {replyOpen && (
        <div className="border-t border-gray-100 pt-3 flex gap-2">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Ответ от имени KTZ Export..."
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          <button onClick={sendAdminReply} disabled={busy || !replyText.trim()}
            className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Отправить
          </button>
        </div>
      )}
    </div>
  );
}

export default function ChatModerationTab() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch('/api/admin/chat-inbox');
    if (res.ok) {
      const data = await res.json();
      setItems(data.items ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  if (loading) return <div className="py-8 text-center text-gray-400 text-sm">Загрузка...</div>;

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        <div className="text-3xl mb-2">✅</div>
        <p className="text-sm">Нет сообщений, ожидающих проверки</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <PendingCard key={item.messageId} item={item} onDone={load} />
      ))}
    </div>
  );
}
