'use client';
import { useState, useEffect, useRef } from 'react';

interface Msg {
  id: string;
  fromType: 'buyer' | 'supplier';
  content: string;
  timestamp: number;
}

interface Props {
  supplierId: string;
  productId: string;
  supplierName: string;
}

export default function SupplierChat({ supplierId, productId, supplierName }: Props) {
  const [phase, setPhase] = useState<'loading' | 'identify' | 'chat'>('loading');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [identForm, setIdentForm] = useState({ name: '', email: '' });
  const [identErr, setIdentErr] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const email = localStorage.getItem('ktz_buyer_email');
    const name = localStorage.getItem('ktz_buyer_name') ?? '';
    if (email) {
      setBuyerEmail(email);
      setBuyerName(name);
      loadThread(email);
    } else {
      setPhase('identify');
    }
  }, [supplierId, productId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadThread(email: string) {
    try {
      const res = await fetch(
        `/api/chat/thread?supplierId=${encodeURIComponent(supplierId)}&productId=${encodeURIComponent(productId)}&email=${encodeURIComponent(email)}`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } catch {}
    setPhase('chat');
  }

  async function handleIdentify(e: React.FormEvent) {
    e.preventDefault();
    setIdentErr('');
    if (!identForm.name.trim() || !identForm.email.trim()) return;
    localStorage.setItem('ktz_buyer_email', identForm.email.trim());
    localStorage.setItem('ktz_buyer_name', identForm.name.trim());
    setBuyerEmail(identForm.email.trim());
    setBuyerName(identForm.name.trim());
    await loadThread(identForm.email.trim());
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMsg.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId, productId, buyerEmail, buyerName, content: newMsg }),
      });
      if (res.ok) {
        setNewMsg('');
        await loadThread(buyerEmail);
      }
    } catch {}
    setSending(false);
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  const field = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400';

  if (phase === 'loading') {
    return <div className="py-4 text-center text-gray-400 text-sm">Загрузка...</div>;
  }

  if (phase === 'identify') {
    return (
      <div>
        <p className="text-sm text-gray-500 mb-3">Введите ваши данные, чтобы на��ать переписку с поставщиком</p>
        <form onSubmit={handleIdentify} className="space-y-2">
          <input required value={identForm.name} onChange={(e) => setIdentForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Ваше имя *" className={field} />
          <input required type="email" value={identForm.email}
            onChange={(e) => setIdentForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="Email *" className={field} />
          {identErr && <p className="text-red-500 text-xs">{identErr}</p>}
          <button type="submit"
            className="bg-primary-700 hover:bg-primary-800 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors">
            Начать переписку →
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      {/* Message thread */}
      <div className="h-52 overflow-y-auto space-y-2 mb-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-xs text-center py-6">
            Напишите первое сообщение поставщику {supplierName}
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.fromType === 'buyer' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] ${msg.fromType === 'buyer' ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                {msg.fromType === 'supplier' && (
                  <span className="text-xs font-semibold text-primary-700 px-1">{supplierName}</span>
                )}
                <div className={`px-3 py-2 rounded-xl text-sm leading-snug ${
                  msg.fromType === 'buyer'
                    ? 'bg-primary-700 text-white rounded-br-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
                <span className="text-xs text-gray-400 px-1">{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Ваше сообщение..."
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
        <button type="submit" disabled={sending || !newMsg.trim()}
          className="bg-primary-700 hover:bg-primary-800 disabled:bg-primary-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shrink-0">
          {sending ? '...' : 'Отправить'}
        </button>
      </form>

      {/* Identity footer */}
      <p className="text-xs text-gray-400 mt-2">
        {buyerName} · {buyerEmail} ·{' '}
        <button
          onClick={() => {
            localStorage.removeItem('ktz_buyer_email');
            localStorage.removeItem('ktz_buyer_name');
            setIdentForm({ name: '', email: '' });
            setMessages([]);
            setPhase('identify');
          }}
          className="text-primary-600 hover:underline"
        >
          изменить
        </button>
      </p>
    </div>
  );
}
