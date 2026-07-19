import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LogisticsForm from '@/components/LogisticsForm';

export default function LogisticsPage() {
  return (
    <>
      <Header />
      <div className="bg-gradient-to-r from-primary-800 to-primary-700 text-white py-14 px-4 text-center">
        <h1 className="text-3xl font-bold mb-3">Логистика</h1>
        <p className="text-primary-200 max-w-xl mx-auto text-sm">
          Запрос на расчёт стоимости перевозки из Казахстана в Китай и другие направления.
          Мы свяжемся с вами в течение 24 часов.
        </p>
      </div>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
          <LogisticsForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
