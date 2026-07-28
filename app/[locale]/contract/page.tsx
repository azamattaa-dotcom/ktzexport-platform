import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PrintButton from './PrintButton';
import Link from 'next/link';
import { contractData } from './contractData';

const LABELS = {
  ru: {
    back: '← На главную',
    bannerTitle: 'Договор транспортно-экспедиторского обслуживания',
    bannerSubtitle: 'Типовой договор ТОО «KTZ Export» на организацию перевозок контейнерным поездом',
    revision: 'Актуальная редакция · 2026 г. · ТОО «KTZ Export»',
    signatures: 'РЕКВИЗИТЫ И ПОДПИСИ СТОРОН',
    forwarderLabel: 'Экспедитор',
    customerLabel: 'Заказчик',
    signatureLine: '_________________ / _________________',
    signatureHint: '(подпись)       (Ф.И.О.)',
    ceoLine: 'Генеральный директор',
  },
  en: {
    back: '← Home',
    bannerTitle: 'Freight Forwarding Services Agreement',
    bannerSubtitle: 'Standard agreement of KTZ Export LLP for organizing container train transportation',
    revision: 'Current revision · 2026 · KTZ Export LLP',
    signatures: 'ADDRESSES AND SIGNATURES OF THE PARTIES',
    forwarderLabel: 'Forwarder',
    customerLabel: 'Customer',
    signatureLine: '_________________ / _________________',
    signatureHint: '(signature)       (full name)',
    ceoLine: 'General Director',
  },
} as const;

const REQUISITES = {
  ru: [
    'ТОО «KTZ Export»',
    'БИН: 260240023256',
    'AO «ForteBank», ИИК KZ5196503F0016071682 USD, БИК IRTYKZKA',
    'Корр. банк: Bank of New York Mellon, New York, USA, SWIFT IRVTUS3N, счёт 8900548533',
    'Республика Казахстан, г. Астана, ул. Сарайшык 4, подъезд 6, кв. 239, 010000',
    'info@ktzexport.kz · +7 702 66 13 444',
  ],
  en: [
    '"KTZ Export" LLP',
    'BIN: 260240023256',
    'JSC «ForteBank», acc. KZ5196503F0016071682 USD, BIC IRTYKZKA',
    'Corr. bank: Bank of New York Mellon, New York, USA, SWIFT IRVTUS3N, account 8900548533',
    'Republic of Kazakhstan, Astana city, Saraishyk street 4, entrance 6, apt. 239, 010000',
    'info@ktzexport.kz · +7 702 66 13 444',
  ],
} as const;

export default async function ContractPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ru';
  const t = LABELS[lang];
  const doc = contractData[lang];
  const req = REQUISITES[lang];

  return (
    <>
      <Header />

      <style>{`
        @media print {
          .no-print { display: none !important; }
          header, footer { display: none !important; }
          body { font-size: 12pt; }
          .contract-page { padding: 0 !important; max-width: 100% !important; }
        }
      `}</style>

      <div className="bg-gradient-to-r from-primary-800 to-primary-700 text-white py-10 px-4 no-print">
        <div className="max-w-4xl mx-auto">
          <Link href={`/${locale}`} className="text-primary-200 hover:text-white text-sm mb-3 inline-block">
            {t.back}
          </Link>
          <h1 className="text-2xl font-bold">{t.bannerTitle}</h1>
          <p className="text-primary-200 mt-1 text-sm">{t.bannerSubtitle}</p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-10 contract-page">
        <div className="flex justify-between items-center mb-8 no-print">
          <p className="text-sm text-gray-500">{t.revision}</p>
          <PrintButton />
        </div>

        <article className="prose max-w-none text-gray-800 space-y-6 text-sm leading-relaxed">
          <div className="text-center space-y-1 mb-8">
            <h2 className="text-lg font-bold uppercase tracking-wide">{doc.docTitle}</h2>
            <p className="text-gray-500">{doc.dateLine}</p>
          </div>

          {doc.preamble.map((p, i) => (
            <p key={`pre-${i}`}>{p}</p>
          ))}

          <hr className="border-gray-200" />

          {doc.sections.map((section, si) => (
            <section key={si}>
              <h3 className="font-bold text-base">
                {si + 1}. {section.title}
              </h3>
              {section.paragraphs.map((p, pi) => (
                <p key={pi}>
                  <span className="text-gray-400 mr-1">{si + 1}.{pi + 1}</span>
                  {p}
                </p>
              ))}
            </section>
          ))}

          <hr className="border-gray-300 mt-8" />

          <section>
            <h3 className="font-bold text-base mb-6">{t.signatures}</h3>
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div className="space-y-1">
                <p className="font-semibold">{t.forwarderLabel}</p>
                {req.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
                <div className="mt-8 pt-2 border-t border-gray-400">
                  <p className="text-gray-500">{t.signatureLine}</p>
                  <p className="text-xs text-gray-400">{t.signatureHint}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">{t.customerLabel}</p>
                <p>________________________________</p>
                <p>________________________________</p>
                <p>________________________________</p>
                <p>________________________________</p>
                <p>________________________________</p>
                <div className="mt-8 pt-2 border-t border-gray-400">
                  <p className="text-gray-500">{t.signatureLine}</p>
                  <p className="text-xs text-gray-400">{t.signatureHint}</p>
                </div>
              </div>
            </div>
          </section>
        </article>

        <div className="mt-10 no-print flex justify-center">
          <PrintButton />
        </div>
      </main>

      <Footer />
    </>
  );
}
