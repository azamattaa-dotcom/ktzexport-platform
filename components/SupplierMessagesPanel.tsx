'use client';
import { useState, useEffect } from 'react';

const PRODUCT_LABELS: Record<string, string> = {
  flour_feed: 'Кормовая мука', flour_wheat: 'Пшеничная мука', wheat: 'Пшеница',
  barley: 'Ячмень', bran: 'Пшеничные отруби', flaxseed: 'Семена льна',
  sunflower: 'Се��ена подсолнечника', corn: 'Кукуруза',
};

interface Msg { id: string; fromType: 'buyer' | 'supplier'; content: string; timestamp: number; }
interface Thread {
  id: string; supplierId: string; productId: string;
  buyerEmail: string; buyerName: string; messages: Msg[]; lastAt: number;
}

export default function SupplierMessagesPanel() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { fetchThreads(); }, []);

  async function fetchThreads() {
    setLoading(true);
    try {
      const res = await fetch('/api/supplier/chat');
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads ?? []);
      }
    } catch {}
    setLoading(false);
  }

  async function sendReply(thread: Thread) {
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/supplier/chat/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: thread.supplierId,
          productId: thread.productId,
          buyerEmail: thread.buyerEmail,
          buyerName: thread.buyerName,
          content: reply,
        }),
      });
      if (res.ok) {
        setReply('');
        await fetchThreads();
      }
    } catch {}
    setSending(false);
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  if (loading) {
    return <div className="py-8 text-center text-gray-400 text-sm">Загрузка сообщений...</div>;
  }

  if (threads.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400">
        <div className="text-3xl mb-2">💬</div>
        <p className="text-sm">Входящих сообщений пока нет</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {threads.map((thread) => {
        const isOpen = openId === thread.id;
        const lastMsg = thread.messages[thread.messages.length - 1];
        const unread = thread.messages.some((m) => m.fromType === 'buyer');

        return (
          <div key={thread.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setOpenId(isOpen ? null : thread.id)}
              className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">{thread.buyerName}</span>
                    <span className="text-xs text-gray-400">{thread.buyerEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-primary-600 font-medium">
                      {PRODUCT_LABELS[thread.productId] ?? thread.productId}
                    </span>
                    {lastMsg && (
                      <span className="text-xs text-gray-400 truncate max-w-[200px]">· {lastMsg.content}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400">{formatTime(thread.lastAt)}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 px-5 py-4">
                {/* Messages */}
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  {thread.messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.fromType === 'supplier' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] flex flex-col gap-0.5 ${msg.fromType === 'supplier' ? 'items-end' : 'items-start'}`}>
                        <span className="text-xs text-gray-400 px-1">
                          {msg.fromType === 'buyer' ? thread.buyerName : 'Вы'} · {formatTime(msg.timestamp)}
                        </span>
                        <div className={`px-3 py-2 rounded-xl text-sm ${
                          msg.fromType === 'supplier'
                            ? 'bg-primary-700 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply */}
                <div className="flex gap-2">
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(thread); } }}
                    placeholder="Ответить..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                  <button
                    onClick={() => sendReply(thread)}
                    disabled={sending || !reply.trim()}
                    className="bg-primary-700 hover:bg-primary-800 disabled:bg-primary-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    {sending ? '...' : 'Ответить'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
