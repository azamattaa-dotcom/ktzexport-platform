'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';

// ── Types ────────────────────────────────────────────────────────────────────

type Step =
  | 'routing'
  | 'product'
  | 'volume'
  | 'contact_buyer'
  | 'supplier_options'
  | 'contact_supplier'
  | 'submitted'
  | 'live';

interface Msg {
  id: string;
  from: 'bot' | 'visitor' | 'admin';
  content: string;
  quickReplies?: string[];
  link?: { label: string; href: string };
}

interface Ctx {
  intent: 'buyer' | 'supplier' | 'other';
  product: string;
  volume: string;
  contact: string;
}

function uid() { return Math.random().toString(36).slice(2, 10); }

// ── UI bubbles ────────────────────────────────────────────────────────────────

function BotBubble({ msg, botInitial, onQR }: { msg: Msg; botInitial: string; onQR: (t: string) => void }) {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-primary-700 flex items-center justify-center text-white text-xs font-bold shrink-0">{botInitial}</div>
      <div className="max-w-[84%] space-y-2">
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
          {msg.content}
        </div>
        {msg.link && (
          <a href={msg.link.href}
            className="block text-sm px-4 py-2.5 rounded-xl bg-primary-700 text-white text-center font-medium hover:bg-primary-800 transition-colors">
            {msg.link.label} →
          </a>
        )}
        {msg.quickReplies && msg.quickReplies.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {msg.quickReplies.map((qr) => (
              <button key={qr} onClick={() => onQR(qr)}
                className="text-left text-sm px-4 py-2.5 rounded-xl border border-primary-300 bg-primary-50 text-primary-800 hover:bg-primary-100 transition-colors font-medium">
                {qr}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminBubble({ content, managerName }: { content: string; managerName: string }) {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">M</div>
      <div className="max-w-[84%]">
        <p className="text-xs text-gray-400 mb-1">{managerName}</p>
        <div className="bg-green-50 border border-green-200 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </div>
  );
}

function VisitorBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] bg-primary-700 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}

function TypingDots({ botInitial }: { botInitial: string }) {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-primary-700 flex items-center justify-center text-white text-xs font-bold shrink-0">{botInitial}</div>
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────

export default function AgentChatWidget() {
  const t = useTranslations('agentChat');
  const locale = useLocale();

  const PRODUCTS = [
    t('products.wheatFlour'), t('products.feedFlour'), t('products.wheat'), t('products.barley'),
    t('products.wheatBran'), t('products.flaxSeed'), t('products.sunflowerSeed'), t('products.corn'),
    t('products.later'),
  ];

  function getGreeting(): string {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const hour = parseInt(
      new Date().toLocaleTimeString('en', { hour: '2-digit', hourCycle: 'h23', timeZone: tz }).split(':')[0],
      10
    );
    if (hour >= 5 && hour < 12) return t('greetingMorning');
    if (hour >= 12 && hour < 18) return t('greetingDay');
    return t('greetingEvening');
  }

  const [isOpen, setIsOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const [step, setStep] = useState<Step>('routing');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [ctx, setCtx] = useState<Ctx>({ intent: 'other', product: '', volume: '', contact: '' });
  const [sessionId] = useState<string>(() => uid() + uid());
  const [submitted, setSubmitted] = useState(false);
  const [lastMsgCount, setLastMsgCount] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, typing]);
  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);

  // ── Allow other components (e.g. "How it works" cards) to open this widget ──
  useEffect(() => {
    const handler = () => open();
    window.addEventListener('ktz-open-chat', handler);
    return () => window.removeEventListener('ktz-open-chat', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  // ── Polling ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!submitted) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/lead/${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        const adminMsgs = (data.messages ?? []).filter((m: { from: string }) => m.from === 'admin');
        if (adminMsgs.length > lastMsgCount) {
          const newOnes = adminMsgs.slice(lastMsgCount);
          setLastMsgCount(adminMsgs.length);
          setStep('live');
          newOnes.forEach((m: { id: string; content: string }) => {
            setMsgs((prev) => [...prev, { id: m.id, from: 'admin', content: m.content }]);
          });
        }
      } catch { /* ignore polling errors */ }
    }, 4000);
    return () => clearInterval(id);
  }, [submitted, sessionId, lastMsgCount]);

  // ── Bot message helper ────────────────────────────────────────────────────

  const botSay = useCallback((
    content: string,
    opts?: { quickReplies?: string[]; link?: { label: string; href: string } }
  ) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((prev) => [...prev, { id: uid(), from: 'bot', content, ...opts }]);
    }, 700);
  }, []);

  // ── Open chat / initial greeting ─────────────────────────────────────────

  function open() {
    setIsOpen(true);
    if (opened) return;
    setOpened(true);
    const greeting = getGreeting();
    setTimeout(() => {
      setMsgs([{
        id: uid(),
        from: 'bot',
        content: t('welcomeMessage', { greeting }),
        quickReplies: [t('qrBuyer'), t('qrSupplier')],
      }]);
    }, 400);
  }

  // ── Remove quickReplies from last bot message ────────────────────────────

  function clearQR() {
    setMsgs((prev) => prev.map((m, i) =>
      i === prev.length - 1 && m.from === 'bot' ? { ...m, quickReplies: [] } : m
    ));
  }

  // ── Add visitor message to display ───────────────────────────────────────

  function addVisitorMsg(content: string) {
    setMsgs((prev) => [...prev, { id: uid(), from: 'visitor', content }]);
  }

  // ── Save lead to backend ──────────────────────────────────────────────────

  async function saveLead(contact: string, finalCtx: Ctx) {
    await fetch('/api/chat/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        intent: finalCtx.intent,
        product: finalCtx.product || undefined,
        volume: finalCtx.volume || undefined,
        contact,
      }),
    }).catch(console.error);
    setSubmitted(true);
  }

  // ── Send visitor message in submitted/live state ──────────────────────────

  async function sendFollowUp(text: string) {
    addVisitorMsg(text);
    await fetch(`/api/chat/lead/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    }).catch(console.error);
  }

  // ── Quick reply handler ───────────────────────────────────────────────────

  function handleQR(text: string) {
    clearQR();
    addVisitorMsg(text);

    if (step === 'routing') {
      if (text === t('qrBuyer')) {
        setCtx((c) => ({ ...c, intent: 'buyer' }));
        setStep('product');
        botSay(t('buyerIntro'), { quickReplies: PRODUCTS });
      } else {
        setCtx((c) => ({ ...c, intent: 'supplier' }));
        setStep('supplier_options');
        botSay(t('supplierIntro'), { quickReplies: [t('qrRegister'), t('qrTellMore')] });
      }
    } else if (step === 'product') {
      setCtx((c) => ({ ...c, product: text.replace('🔍 ', '') }));
      setStep('volume');
      botSay(text === t('products.later') ? t('volumeQuestionLater') : t('volumeQuestionChosen'));
    } else if (step === 'supplier_options') {
      if (text === t('qrRegister')) {
        botSay(
          t('registerSupplierMsg'),
          { link: { label: t('registerSupplierLinkLabel'), href: `/${locale}/supplier/register` } }
        );
        setStep('submitted');
        setSubmitted(true);
      } else {
        setStep('contact_supplier');
        botSay(t('supplierBenefitsMsg'));
      }
    }
  }

  // ── Free text input handler ───────────────────────────────────────────────

  async function handleSend(text: string) {
    if (!text.trim()) return;
    setInput('');

    if (step === 'submitted' || step === 'live') {
      await sendFollowUp(text);
      return;
    }

    addVisitorMsg(text);

    if (step === 'volume') {
      setCtx((c) => ({ ...c, volume: text }));
      setStep('contact_buyer');
      botSay(t('contactBuyerQuestion'));
    } else if (step === 'contact_buyer') {
      const finalCtx: Ctx = { ...ctx, contact: text };
      setCtx(finalCtx);
      setStep('submitted');
      await saveLead(text, finalCtx);
      botSay(t('buyerThanks', { contact: text }));
    } else if (step === 'contact_supplier') {
      const finalCtx: Ctx = { ...ctx, contact: text };
      setCtx(finalCtx);
      setStep('submitted');
      await saveLead(text, finalCtx);
      botSay(
        t('supplierThanks', { contact: text }),
        { link: { label: t('registerSupplierLinkLabel'), href: `/${locale}/supplier/register` } }
      );
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSend(input);
  }

  const showInput = !['routing', 'product', 'supplier_options'].includes(step) || step === 'submitted' || step === 'live';
  const botInitial = t('botName').charAt(0).toUpperCase();

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button onClick={open}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary-700 hover:bg-primary-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
          aria-label={t('openAria')}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-5rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="bg-primary-700 px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">{botInitial}</div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight">
                {step === 'live' ? t('managerName') : t('botName')}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                <span className="text-white/70 text-xs">
                  {step === 'live' ? t('online') : t('assistantSubtitle')}
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              aria-label={t('closeAria')}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
            {msgs.length === 0 && (
              <div className="flex justify-center pt-8">
                <div className="text-center text-gray-400 text-xs space-y-2">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mx-auto text-primary-700 font-bold text-sm">{botInitial}</div>
                  <p>{t('connecting')}</p>
                </div>
              </div>
            )}
            {msgs.map((m) =>
              m.from === 'bot'
                ? <BotBubble key={m.id} msg={m} botInitial={botInitial} onQR={handleQR} />
                : m.from === 'admin'
                  ? <AdminBubble key={m.id} content={m.content} managerName={t('managerName')} />
                  : <VisitorBubble key={m.id} content={m.content} />
            )}
            {typing && <TypingDots botInitial={botInitial} />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {showInput && (
            <form onSubmit={handleSubmit}
              className="shrink-0 border-t border-gray-100 bg-white px-3 py-3 flex gap-2 items-center">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  step === 'volume' ? t('placeholderVolume') :
                  step === 'contact_buyer' || step === 'contact_supplier' ? t('placeholderContact') :
                  step === 'submitted' ? t('placeholderSubmitted') :
                  t('placeholderDefault')
                }
                className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50"
              />
              <button type="submit" disabled={!input.trim()}
                className="w-10 h-10 bg-primary-700 hover:bg-primary-800 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors shrink-0">
                <svg className="w-4 h-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
