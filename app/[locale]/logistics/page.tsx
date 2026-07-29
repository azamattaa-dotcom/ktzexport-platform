import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LogisticsForm from '@/components/LogisticsForm';
import LogisticsEstimator from '@/components/LogisticsEstimator';

export default async function LogisticsPage() {
  const t = await getTranslations('logistics');

  return (
    <>
      <Header />
      <div className="bg-gradient-to-r from-primary-800 to-primary-700 text-white py-14 px-4 text-center">
        <h1 className="text-3xl font-bold mb-3">{t('pageTitle')}</h1>
        <p className="text-primary-200 max-w-xl mx-auto text-sm">{t('pageSubtitle')}</p>
      </div>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
          <h2 className="font-semibold text-gray-900 mb-1">Быстрый расчёт по контейнерному поезду</h2>
          <p className="text-sm text-gray-500 mb-5">
            Для маршрутов через Алтынколь и Достык с возвратом контейнера на основные станции Китая — цена рассчитывается сразу, без заявки.
          </p>
          <LogisticsEstimator />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
          <h2 className="font-semibold text-gray-900 mb-1">Другой маршрут или вид транспорта</h2>
          <p className="text-sm text-gray-500 mb-5">Оставьте заявку — ответим с расчётом вручную.</p>
          <LogisticsForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
