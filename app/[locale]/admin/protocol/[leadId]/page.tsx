'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PrintButton from './PrintButton';
import type { ChatLead } from '@/lib/chat-leads';

const EXPEDITOR = {
  name: 'ТОО «KTZ Export»',
  bin: '260240023256',
  bank: 'AO «ForteBank», ИИК KZ5196503F0016071682 USD, БИК IRTYKZKA',
  address: 'Республика Казахстан, г. Астана, ул. Сарайшык 4, подъезд 6, кв. 239, 010000',
  contact: 'info@ktzexport.kz · +7 702 66 13 444',
  director: 'Токанов А.А.',
};

export default function ProtocolPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.leadId as string;

  const [lead, setLead] = useState<ChatLead | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    fetch(`/api/admin/chat/${leadId}`)
      .then((r) => {
        if (r.status === 401) { router.push('/ru/admin/login'); return null; }
        if (!r.ok) { setStatus('error'); return null; }
        return r.json();
      })
      .then((data) => { if (data) { setLead(data); setStatus('ready'); } });
  }, [leadId, router]);

  if (status === 'loading') {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-400">Загружаем...</div>;
  }
  if (status === 'error' || !lead || !lead.orderContext) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-500">
        Заявка не найдена, или в ней нет данных по логистике для формирования протокола.
      </div>
    );
  }

  const oc = lead.orderContext;
  const today = new Date();
  const dateStr = today.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  const hasProduct = typeof oc.productPricePerTon === 'number' && oc.productCurrency === 'USD';
  const ratePerTon = oc.ratePerTon ?? (oc.logisticsPerContainer / 26);
  const totalPerTon = oc.totalPerTon ?? (hasProduct ? oc.productPricePerTon! + ratePerTon : undefined);

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 12pt; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-8 no-print">
          <p className="text-sm text-gray-500">Протокол договорной цены · сформировано автоматически из заявки</p>
          <PrintButton />
        </div>

        <article className="text-gray-800 text-sm leading-relaxed space-y-5">
          <div className="text-center space-y-1 mb-8">
            <h1 className="text-lg font-bold uppercase tracking-wide">Протокол договорной цены</h1>
            <p className="text-gray-500">г. Астана &nbsp;&nbsp;&nbsp; «{today.getDate()}» {today.toLocaleDateString('ru-RU', { month: 'long' })} {today.getFullYear()} г.</p>
          </div>

          <p>
            <strong>{EXPEDITOR.name}</strong> (БИН: {EXPEDITOR.bin}), именуемое в дальнейшем <strong>«Экспедитор»</strong>,
            в лице Генерального директора {EXPEDITOR.director}, действующего на основании Устава, с одной стороны, и
          </p>
          <p>
            <strong>{lead.contact}</strong>, именуемое в дальнейшем <strong>«Заказчик»</strong>, с другой стороны,
            совместно именуемые «Стороны», составили настоящий Протокол договорной цены о нижеследующем:
          </p>

          <hr className="border-gray-200" />

          <section>
            <h2 className="font-bold text-base mb-2">1. Маршрут и тариф</h2>
            <p>1.1. Стороны согласовали тарифную ставку при перевозке груза{oc.productName ? ` «${oc.productName}»` : ''} контейнерным поездом.</p>
            <p>1.2. Погранпереход: <strong>{oc.borderLabel}</strong>.</p>
            <p>1.3. Станция возврата контейнера: <strong>{oc.returnStationLabel}</strong>.</p>
            <p>1.4. Количество контейнеров (40 фут): <strong>{oc.containers}</strong>.</p>
            <p>1.5. Стоимость логистики: <strong>${oc.logisticsPerContainer.toLocaleString()}</strong> за один 40-фут. контейнер (фиксированная ставка по данному маршруту).</p>
          </section>

          {hasProduct && (
            <section>
              <h2 className="font-bold text-base mb-2">2. Цена за тонну</h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                <p>(a) Цена за тонну (товар{oc.supplierName ? `, поставщик: ${oc.supplierName}` : ''}): <strong>${oc.productPricePerTon}</strong></p>
                <p>(b) Постоянные расходы (логистика): <strong>${ratePerTon.toFixed(2)}</strong></p>
                <p className="font-bold border-t border-gray-200 pt-1">(c) Итого за тонну: ${totalPerTon?.toFixed(2)}</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Логистика — фиксированная стоимость перевозки контейнера (${oc.logisticsPerContainer}), выраженная как расход на тонну от базы 26 т. Итоговая сумма по факту зависит от реального веса груза в контейнере.
              </p>
            </section>
          )}

          <section>
            <h2 className="font-bold text-base mb-2">{hasProduct ? '3' : '2'}. Заключительные положения</h2>
            <p>Настоящий Протокол является неотъемлемой частью договора на транспортно-экспедиторское обслуживание, вступает в силу со дня подписания и действует до подписания документов, его отменяющих или изменяющих.</p>
            <p>Оплата производится в порядке, предусмотренном основным Договором.</p>
          </section>

          <hr className="border-gray-300 mt-8" />

          <section>
            <h2 className="font-bold text-base mb-6">Реквизиты и подписи сторон</h2>
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div className="space-y-1">
                <p className="font-semibold">Экспедитор</p>
                <p>{EXPEDITOR.name}</p>
                <p>БИН: {EXPEDITOR.bin}</p>
                <p>{EXPEDITOR.bank}</p>
                <p>{EXPEDITOR.address}</p>
                <p>{EXPEDITOR.contact}</p>
                <div className="mt-8 pt-2 border-t border-gray-400">
                  <p className="text-gray-500">_________________ / {EXPEDITOR.director}</p>
                  <p className="text-xs text-gray-400">(подпись)</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">Заказчик</p>
                <p>{lead.contact}</p>
                <p className="text-gray-400">________________________________</p>
                <p className="text-gray-400">________________________________</p>
                <div className="mt-8 pt-2 border-t border-gray-400">
                  <p className="text-gray-500">_________________ / _________________</p>
                  <p className="text-xs text-gray-400">(подпись) &nbsp;&nbsp;&nbsp; (Ф.И.О.)</p>
                </div>
              </div>
            </div>
          </section>
        </article>

        <div className="mt-10 no-print flex justify-center">
          <PrintButton />
        </div>
      </div>
    </>
  );
}
